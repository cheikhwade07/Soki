'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DueReview } from '@/app/lib/definitions';

type CalendarView = 'day' | 'week' | 'month';

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

function startOfDay(date: Date) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
}

function startOfWeek(date: Date) {
    const next = startOfDay(date);
    next.setDate(next.getDate() - next.getDay());
    return next;
}

function endOfWeek(date: Date) {
    const next = startOfWeek(date);
    next.setDate(next.getDate() + 6);
    next.setHours(23, 59, 59, 999);
    return next;
}

function formatDateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatLongDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function ReviewLink({ review, compact = false }: { review: DueReview; compact?: boolean }) {
    return (
        <Link
            href={`/dashboard/active_recall?cardId=${review.card_id}`}
            className={`block rounded-lg bg-white shadow-sm hover:bg-slate-100 ${
                compact ? 'p-2 text-xs' : 'border border-gray-200 p-4 text-sm'
            }`}
            title={review.card_front ?? 'Scheduled review'}
        >
            <p className="truncate font-medium text-slate-900">{review.card_front ?? 'Review card'}</p>
            <p className="mt-1 text-xs text-gray-500">Due {formatLongDate(review.due_at)}</p>
        </Link>
    );
}

export function DeadlineCalendar({ deadlines }: { deadlines: DueReview[] }) {
    const today = useMemo(() => startOfDay(new Date()), []);
    const [view, setView] = useState<CalendarView>('month');
    const [focusDate, setFocusDate] = useState(today);
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const todayKey = formatDateKey(today);

    const deadlineMap = useMemo(() => {
        const map = new Map<string, DueReview[]>();

        deadlines.forEach((deadline) => {
            const dateKey = formatDateKey(new Date(deadline.due_at));
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(deadline);
        });

        return map;
    }, [deadlines]);

    const weekStart = startOfWeek(focusDate);
    const weekEnd = endOfWeek(focusDate);
    const weekDays = Array.from({ length: 7 }, (_, index) => {
        const next = new Date(weekStart);
        next.setDate(weekStart.getDate() + index);
        return next;
    });

    const dayItems = deadlineMap.get(formatDateKey(focusDate)) || [];
    const weekItems = deadlines.filter((deadline) => {
        const dueDate = new Date(deadline.due_at);
        return dueDate >= weekStart && dueDate <= weekEnd;
    });
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth, daysInMonth, 23, 59, 59, 999);
    const monthItems = deadlines.filter((deadline) => {
        const dueDate = new Date(deadline.due_at);
        return dueDate >= monthStart && dueDate <= monthEnd;
    });

    const prevPeriod = () => {
        if (view === 'month') {
            if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear((value) => value - 1);
            } else {
                setCurrentMonth((value) => value - 1);
            }
            return;
        }

        const nextFocus = new Date(focusDate);
        nextFocus.setDate(nextFocus.getDate() - (view === 'week' ? 7 : 1));
        setFocusDate(startOfDay(nextFocus));
    };

    const nextPeriod = () => {
        if (view === 'month') {
            if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear((value) => value + 1);
            } else {
                setCurrentMonth((value) => value + 1);
            }
            return;
        }

        const nextFocus = new Date(focusDate);
        nextFocus.setDate(nextFocus.getDate() + (view === 'week' ? 7 : 1));
        setFocusDate(startOfDay(nextFocus));
    };

    const monthName = new Date(currentYear, currentMonth).toLocaleString('default', {
        month: 'long',
        year: 'numeric',
    });

    const monthCells = [];

    for (let i = 0; i < firstDay; i++) {
        monthCells.push(<div key={`empty-${i}`} className="min-h-28 rounded-xl border border-gray-200 bg-gray-50" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateKey = formatDateKey(date);
        const dayDeadlines = deadlineMap.get(dateKey) || [];
        const isToday = dateKey === todayKey;

        monthCells.push(
            <div
                key={day}
                className={`min-h-28 rounded-xl border p-2 ${
                    isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
            >
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>
                        {day}
                    </span>
                    {dayDeadlines.length > 0 && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white">
                            {dayDeadlines.length}
                        </span>
                    )}
                </div>
                <div className="mt-2 space-y-1">
                    {dayDeadlines.slice(0, 3).map((deadline) => (
                        <Link
                            key={deadline.card_id}
                            href={`/dashboard/active_recall?cardId=${deadline.card_id}`}
                            className="block truncate rounded bg-red-100 px-2 py-1 text-[10px] text-red-700 hover:bg-red-200"
                            title={deadline.card_front ?? 'Scheduled review'}
                        >
                            {deadline.card_front ?? 'Review card'}
                        </Link>
                    ))}
                    {dayDeadlines.length > 3 && (
                        <p className="text-[10px] text-gray-500">+{dayDeadlines.length - 3} more</p>
                    )}
                </div>
            </div>,
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="inline-flex w-fit rounded-xl bg-gray-100 p-1">
                    {(['day', 'week', 'month'] as const).map((option) => (
                        <button
                            key={option}
                            onClick={() => setView(option)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                                view === option ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-white'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={prevPeriod}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        Prev
                    </button>
                    <button
                        onClick={nextPeriod}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            {view === 'month' && (
                <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">{monthName}</h2>
                        <p className="text-sm text-gray-500">{monthItems.length} reviews in view</p>
                    </div>
                    <div className="grid grid-cols-7 text-center text-xs text-gray-500">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayLabel) => (
                            <div key={dayLabel} className="py-1">
                                {dayLabel}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">{monthCells}</div>
                </section>
            )}

            {view === 'week' && (
                <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Week of {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </h2>
                        <p className="text-sm text-gray-500">{weekItems.length} reviews in view</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-7">
                        {weekDays.map((date) => {
                            const dateKey = formatDateKey(date);
                            const items = deadlineMap.get(dateKey) || [];
                            const isToday = dateKey === todayKey;

                            return (
                                <div
                                    key={dateKey}
                                    className={`rounded-xl border p-3 ${
                                        isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div className="mb-3">
                                        <p className="text-xs uppercase tracking-wide text-gray-500">
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        {items.map((item) => (
                                            <ReviewLink key={item.card_id} review={item} compact />
                                        ))}
                                        {items.length === 0 && (
                                            <p className="text-xs text-gray-400">No reviews</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {view === 'day' && (
                <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            {focusDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </h2>
                        <p className="text-sm text-gray-500">{dayItems.length} reviews in view</p>
                    </div>
                    <div className="space-y-3">
                        {dayItems.map((item) => (
                            <ReviewLink key={item.card_id} review={item} />
                        ))}
                        {dayItems.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                                No reviews scheduled for this day.
                            </div>
                        )}
                    </div>
                </section>
            )}

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                    Click any scheduled review to open it directly in active recall.
                </p>
            </div>
        </div>
    );
}
