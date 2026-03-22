import { auth } from '@/auth';
import { fetchDashboardData } from '@/app/lib/data';
import { lusitana } from '@/app/ui/fonts';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Page() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect('/login');
    }

    const stats = await fetchDashboardData(userId);

    return (
        <main className="space-y-8">
            <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-700 to-cyan-500 p-8 text-white shadow-lg">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-100">
                            Study Command Center
                        </p>
                        <h1 className={`${lusitana.className} text-3xl leading-tight md:text-4xl`}>
                            Turn source material into structured recall practice.
                        </h1>
                        <p className="max-w-xl text-sm text-blue-50 md:text-base">
                            Organize decks, stage generated cards, track upcoming reviews,
                            and jump straight into active recall from one place.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/dashboard/decks/new"
                            className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-blue-50"
                        >
                            Create Deck
                        </Link>
                        <Link
                            href="/dashboard/active_recall"
                            className="rounded-xl border border-white/40 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                        >
                            Start Reviewing
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-blue-700">Decks</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.totalDecks}</p>
                    <p className="mt-2 text-sm text-gray-600">Organized study spaces ready for cards or nested decks.</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-emerald-700">Cards</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.totalCards}</p>
                    <p className="mt-2 text-sm text-gray-600">Manual and generated prompts available for recall practice.</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-amber-700">Upcoming Reviews</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.upcomingDeadlines}</p>
                    <p className="mt-2 text-sm text-gray-600">Scheduled cards waiting in the calendar and review queue.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-700">Best Next Step</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                        {stats.totalDecks === 0 ? 'Create your first deck' : stats.totalCards === 0 ? 'Add your first cards' : 'Jump into review'}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                        {stats.totalDecks === 0
                            ? 'Build a deck structure first, then decide whether it holds cards or nested decks.'
                            : stats.totalCards === 0
                                ? 'Populate a card deck manually or stage file-based generation.'
                                : 'Use active recall or calendar to move through scheduled practice.'}
                    </p>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <Link
                    href="/dashboard/decks"
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
                >
                    <p className="text-sm font-medium text-blue-600">Organize</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">Build your deck structure</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Create top-level decks, branch into nested decks, and keep card decks separate from container decks.
                    </p>
                </Link>
                <Link
                    href="/dashboard/calendar"
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
                >
                    <p className="text-sm font-medium text-blue-600">Plan</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">See what needs attention</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Switch between day, week, and month views, then open any scheduled review directly.
                    </p>
                </Link>
                <Link
                    href="/dashboard/active_recall"
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
                >
                    <p className="text-sm font-medium text-blue-600">Practice</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">Run an active recall session</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Reveal answers, inspect review state, and move through the queue in a clear study flow.
                    </p>
                </Link>
            </section>
        </main>
    );
}
