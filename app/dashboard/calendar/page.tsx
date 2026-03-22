import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { fetchDueReviews } from '@/app/lib/data';
import { DeadlineCalendar } from '@/app/ui/dashboard/calendar';

export default async function Page() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect('/login');
    }

    const deadlines = await fetchDueReviews(userId);

    return (
        <section className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-500">Review Calendar</p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">Plan what to study next</h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-600">
                    Explore your schedule by day, week, or month, then open any planned item directly in active recall.
                </p>
            </div>
            <DeadlineCalendar deadlines={deadlines} />
        </section>
    );
}
