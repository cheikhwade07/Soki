import { auth } from '@/auth';
import { fetchDecks } from '@/app/lib/data';
import { redirect } from 'next/navigation';
import { DeckList } from '@/app/ui/dashboard/deck';
import { FolderPlus } from 'lucide-react';
import Link from 'next/link';

export default async function Page() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect('/login');
    }

    const decks = await fetchDecks(userId);

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-500">Deck Library</p>
                    <h1 className="text-2xl font-bold text-slate-900">Your study structure</h1>
                    <p className="max-w-2xl text-sm text-gray-600">
                        Create decks, branch into nested decks, and keep card decks separate from container decks.
                    </p>
                </div>
                <Link
                    href="/dashboard/decks/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400"
                >
                    <FolderPlus className="h-4 w-4" />
                    Create Deck
                </Link>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {decks.length} top-level deck{decks.length !== 1 ? 's' : ''}
                </p>
            </div>

            <DeckList decks={decks} />
        </section>
    );
}
