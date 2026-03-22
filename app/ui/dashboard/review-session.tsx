'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReviewQueueCard, ReviewRating } from '@/app/lib/definitions';
import { BookOpenText, CircleHelp, FilePenLine } from 'lucide-react';

type ReviewSessionProps = {
    queue: ReviewQueueCard[];
    initialCardId?: string;
};

type McqOption = {
    key: string;
    text: string;
};

const ratingStyles: Record<ReviewRating, string> = {
    again: 'bg-red-100 text-red-700 border-red-200',
    hard: 'bg-amber-100 text-amber-700 border-amber-200',
    good: 'bg-blue-100 text-blue-700 border-blue-200',
    easy: 'bg-green-100 text-green-700 border-green-200',
};

function formatRelativeDue(dateString: string) {
    const target = new Date(dateString);
    const now = new Date();
    const diffHours = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 0) {
        return `${Math.abs(diffHours)}h overdue`;
    }

    if (diffHours === 0) {
        return 'due now';
    }

    if (diffHours < 24) {
        return `due in ${diffHours}h`;
    }

    return `due in ${Math.round(diffHours / 24)}d`;
}

function getReviewMeta(cardType: ReviewQueueCard['card_type']) {
    switch (cardType) {
        case 'mcq':
            return {
                label: 'MCQ',
                promptLabel: 'Question',
                answerLabel: 'Correct answer',
                hint: 'Choose one option before the rating controls unlock.',
                icon: CircleHelp,
                accent: 'bg-amber-50 text-amber-700 border-amber-200',
                responseMode: 'choice',
            } as const;
        case 'methodology':
            return {
                label: 'Methodology',
                promptLabel: 'Prompt',
                answerLabel: 'Methodology and reference response',
                hint: 'Solve it your way first, then compare your process against the methodology.',
                icon: FilePenLine,
                accent: 'bg-purple-50 text-purple-700 border-purple-200',
                responseMode: 'self_assess',
            } as const;
        default:
            return {
                label: 'Flashcard',
                promptLabel: 'Prompt',
                answerLabel: 'Answer',
                hint: 'Try to recall the answer before revealing it.',
                icon: BookOpenText,
                accent: 'bg-blue-50 text-blue-700 border-blue-200',
                responseMode: 'reveal',
            } as const;
    }
}

function parseMcq(front: string, back: string) {
    const optionPattern = /([A-D])\)\s*([\s\S]*?)(?=\s+[A-D]\)\s*|$)/g;
    const matches = [...front.matchAll(optionPattern)];

    if (matches.length < 2) {
        return null;
    }

    const firstOptionIndex = front.search(/\bA\)\s*/);
    if (firstOptionIndex === -1) {
        return null;
    }

    const stem = front.slice(0, firstOptionIndex).trim();
    const options: McqOption[] = matches.map((match) => ({
        key: match[1],
        text: match[2].trim(),
    }));
    const correctKeyMatch = back.trim().match(/^([A-D])\)/);

    return {
        stem,
        options,
        correctKey: correctKeyMatch?.[1] ?? null,
        answer: back,
    };
}

export function ReviewSession({ queue, initialCardId }: ReviewSessionProps) {
    const initialIndex = useMemo(() => {
        if (!initialCardId) {
            return 0;
        }

        const matchedIndex = queue.findIndex((card) => card.card_id === initialCardId);
        return matchedIndex >= 0 ? matchedIndex : 0;
    }, [initialCardId, queue]);

    const [index, setIndex] = useState(initialIndex);
    const [showAnswer, setShowAnswer] = useState(false);
    const [selectedMcq, setSelectedMcq] = useState<string | null>(null);

    useEffect(() => {
        setIndex(initialIndex);
        setShowAnswer(false);
        setSelectedMcq(null);
    }, [initialIndex]);

    const currentCard = queue[index];
    const currentMeta = getReviewMeta(currentCard.card_type);
    const CurrentIcon = currentMeta.icon;
    const parsedMcq = currentCard.card_type === 'mcq' ? parseMcq(currentCard.front, currentCard.back) : null;
    const mcqEvaluated = currentCard.card_type === 'mcq' && selectedMcq !== null;
    const mcqCorrect = mcqEvaluated && parsedMcq?.correctKey ? selectedMcq === parsedMcq.correctKey : false;
    const canRate = currentCard.card_type === 'mcq' ? mcqEvaluated : showAnswer;
    const availableRatings: ReviewRating[] =
        currentCard.card_type === 'mcq'
            ? mcqCorrect
                ? ['hard', 'good', 'easy']
                : ['again', 'hard']
            : currentCard.card_type === 'methodology'
                ? ['again', 'hard', 'good']
                : ['again', 'hard', 'good', 'easy'];

    const stats = useMemo(() => {
        const now = new Date();
        const overdue = queue.filter((card) => new Date(card.due_at) < now).length;
        const learning = queue.filter((card) => card.state === 'learning' || card.state === 'relearning').length;

        return {
            total: queue.length,
            overdue,
            learning,
        };
    }, [queue]);

    const goToNextCard = () => {
        setShowAnswer(false);
        setSelectedMcq(null);
        setIndex((value) => (value + 1) % queue.length);
    };

    if (queue.length === 0) {
        return (
            <section className="max-w-3xl space-y-4">
                <div>
                    <h1 className="text-2xl font-bold">Review</h1>
                    <p className="text-sm text-gray-600">
                        No cards are scheduled yet. Seed the database or generate cards
                        from a deck to start a review session.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="mx-auto max-w-4xl space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Review</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Stay focused on one prompt at a time and rate it only after you respond.
                    </p>
                    {initialCardId && currentCard.card_id === initialCardId && (
                        <p className="mt-2 text-sm text-blue-600">Opened from calendar.</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Card</p>
                        <p className="font-semibold text-slate-900">{index + 1} / {queue.length}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Overdue</p>
                        <p className="font-semibold text-slate-900">{stats.overdue}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                        <p className="text-gray-500">Learning</p>
                        <p className="font-semibold text-slate-900">{stats.learning}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${currentMeta.accent}`}>
                        <CurrentIcon className="h-3.5 w-3.5" />
                        {currentMeta.label}
                    </span>
                    <span className="text-sm text-gray-500">{formatRelativeDue(currentCard.due_at)}</span>
                </div>

                <div className="rounded-3xl bg-slate-50 p-6">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
                        {currentMeta.promptLabel}
                    </p>
                    <p className="mt-3 text-sm text-gray-500">{currentMeta.hint}</p>

                    {currentCard.card_type === 'mcq' && parsedMcq ? (
                        <div className="mt-6 space-y-4">
                            <p className="text-xl leading-8 text-slate-900">{parsedMcq.stem}</p>
                            <div className="grid gap-3">
                                {parsedMcq.options.map((option) => {
                                    const isSelected = selectedMcq === option.key;
                                    const showCorrect = mcqEvaluated && option.key === parsedMcq.correctKey;
                                    const showIncorrect = mcqEvaluated && isSelected && option.key !== parsedMcq.correctKey;

                                    return (
                                        <button
                                            key={option.key}
                                            type="button"
                                            disabled={mcqEvaluated}
                                            onClick={() => setSelectedMcq(option.key)}
                                            className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                                                showCorrect
                                                    ? 'border-green-300 bg-green-50'
                                                    : showIncorrect
                                                        ? 'border-red-300 bg-red-50'
                                                        : isSelected
                                                            ? 'border-blue-300 bg-blue-50'
                                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                                                {option.key}
                                            </span>
                                            <span className="mt-2 block text-base text-slate-900">{option.text}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {mcqEvaluated && (
                                <div className={`rounded-2xl border px-4 py-4 text-sm ${
                                    mcqCorrect ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
                                }`}>
                                    <p className="font-medium">
                                        {mcqCorrect ? 'Correct.' : 'Not quite.'}
                                    </p>
                                    <p className="mt-2">
                                        {parsedMcq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-6">
                            <p className="text-xl leading-8 text-slate-900">{currentCard.front}</p>

                            {showAnswer && (
                                <div className="mt-8 border-t border-slate-200 pt-6">
                                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
                                        {currentMeta.answerLabel}
                                    </p>
                                    <p className="mt-3 text-base leading-8 text-slate-700">{currentCard.back}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    {currentCard.card_type !== 'mcq' && (
                        <button
                            type="button"
                            onClick={() => setShowAnswer((value) => !value)}
                            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
                        >
                            {showAnswer ? 'Hide Response' : currentCard.card_type === 'methodology' ? 'Reveal Methodology' : 'Reveal Answer'}
                        </button>
                    )}

                    <div>
                        <p className="mb-3 text-sm font-medium text-slate-900">
                            {currentCard.card_type === 'methodology' ? 'How well did your approach hold up?' : 'How did that feel?'}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-4">
                            {availableRatings.map((rating) => (
                                <button
                                    key={rating}
                                    type="button"
                                    disabled={!canRate}
                                    onClick={goToNextCard}
                                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-opacity ${ratingStyles[rating]} ${!canRate ? 'cursor-not-allowed opacity-40' : ''}`}
                                >
                                    {rating.charAt(0).toUpperCase() + rating.slice(1)}
                                </button>
                            ))}
                        </div>
                        {!canRate && (
                            <p className="mt-3 text-xs text-gray-500">
                                {currentCard.card_type === 'mcq'
                                    ? 'Choose an option to unlock the rating buttons.'
                                    : currentCard.card_type === 'methodology'
                                        ? 'Reveal the methodology to self-assess your approach.'
                                        : 'Reveal the answer to unlock the rating buttons.'}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={goToNextCard}
                        disabled={currentCard.card_type === 'mcq' && !mcqEvaluated}
                        className={`text-sm ${currentCard.card_type === 'mcq' && !mcqEvaluated ? 'text-gray-300' : 'text-gray-500 hover:text-slate-900'}`}
                    >
                        Skip card
                    </button>
                </div>
            </div>

            <details className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-900">
                    Review details
                </summary>
                <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-3">
                    <p>State: {currentCard.state}</p>
                    <p>Stability: {currentCard.stability.toFixed(1)}</p>
                    <p>Difficulty: {currentCard.difficulty.toFixed(1)}</p>
                    <p>Reps: {currentCard.reps}</p>
                    <p>Lapses: {currentCard.lapses}</p>
                    <p>Due: {formatRelativeDue(currentCard.due_at)}</p>
                </div>
            </details>
        </section>
    );
}
