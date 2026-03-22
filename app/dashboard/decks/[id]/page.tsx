import { auth } from '@/auth';
import { fetchDeckById, fetchSubDecks, fetchCardsByDeck } from '@/app/lib/data';
import { DeckList } from '@/app/ui/dashboard/deck';
import { CardList } from '@/app/ui/dashboard/card';
import { BackButton } from '@/app/ui/back-button';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect('/login');
    }

    const { id } = await params;
    const deck = await fetchDeckById(id, userId);

    if (!deck) {
        notFound();
    }

    const [subdecks, cards] = await Promise.all([
        fetchSubDecks(id, userId),
        fetchCardsByDeck(id, userId),
    ]);

    const isContainer = deck.deck_kind === 'container';
    const isCardsDeck = deck.deck_kind === 'cards';

    return (
        <section className="space-y-8">
            <div className="flex justify-end">
                <BackButton />
            </div>

            <header className="rounded-2xl bg-gray-50 p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-blue-500">Deck</p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">{deck.title}</h1>
                        <p className="mt-2 max-w-3xl text-sm text-gray-600">
                            {deck.description || 'This deck is ready to hold either nested decks or cards.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
                            {deck.deck_kind === null && <p>Empty deck</p>}
                            {isContainer && <p>{subdecks.length} decks</p>}
                            {isCardsDeck && <p>{cards.length} cards</p>}
                        </div>
                        <Link
                            href={`/dashboard/decks/${deck.deck_id}/add`}
                            className="rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white hover:bg-blue-400"
                        >
                            Add To Deck
                        </Link>
                        <Link
                            href={`/dashboard/decks/${deck.deck_id}/edit`}
                            className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Edit Deck
                        </Link>
                    </div>
                </div>
            </header>

            {deck.deck_kind === null && (
                <section className="rounded-2xl bg-gray-50 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">Empty Deck</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        This deck does not contain anything yet. Choose whether this should become a container
                        deck with nested decks, or a study deck with cards.
                    </p>
                    <div className="mt-4">
                        <Link
                            href={`/dashboard/decks/${deck.deck_id}/add`}
                            className="inline-flex rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
                        >
                            Choose What To Add
                        </Link>
                    </div>
                </section>
            )}

            {isContainer && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Decks</h2>
                        <span className="text-sm text-gray-500">{subdecks.length}</span>
                    </div>
                    <DeckList decks={subdecks} />
                </section>
            )}

            {isCardsDeck && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Cards</h2>
                        <span className="text-sm text-gray-500">{cards.length}</span>
                    </div>
                    <CardList cards={cards} />
                </section>
            )}
        </section>
    );
}
