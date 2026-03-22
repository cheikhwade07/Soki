import { auth } from '@/auth';
import {
    deleteCardAction,
    deleteDeckAction,
    updateCardAction,
    updateDeckAction,
} from '@/app/lib/action';
import { fetchCardsByDeck, fetchDeckById, fetchSubDecks } from '@/app/lib/data';
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

    return (
        <section className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-blue-500">Edit Deck</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">{deck.title}</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Rename this deck, update its description, or manage its contents.
                    </p>
                </div>
                <BackButton />
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px]">
                <form action={updateDeckAction} className="rounded-2xl bg-gray-50 p-5 shadow-sm space-y-4">
                    <input type="hidden" name="deckId" value={deck.deck_id} />
                    <div className="space-y-2">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Deck title
                        </label>
                        <input
                            id="title"
                            name="title"
                            required
                            defaultValue={deck.title}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            defaultValue={deck.description ?? ''}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded-lg border border-blue-300 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                        Save Changes
                    </button>
                </form>

                <form action={deleteDeckAction} className="rounded-2xl bg-gray-50 p-5 shadow-sm flex items-start justify-end">
                    <input type="hidden" name="deckId" value={deck.deck_id} />
                    <input type="hidden" name="redirectTo" value="/dashboard/decks" />
                    <button
                        type="submit"
                        className="rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                        Delete Deck
                    </button>
                </form>
            </div>

            {subdecks.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Manage Decks</h2>
                        <span className="text-sm text-gray-500">{subdecks.length}</span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {subdecks.map((subdeck) => (
                            <article key={subdeck.deck_id} className="rounded-2xl bg-gray-50 p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900">{subdeck.title}</h3>
                                        {subdeck.description && (
                                            <p className="mt-2 text-sm text-gray-600">{subdeck.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/dashboard/decks/${subdeck.deck_id}/edit`}
                                            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-white"
                                            title="Edit deck"
                                        >
                                            Open
                                        </Link>
                                        <form action={deleteDeckAction}>
                                            <input type="hidden" name="deckId" value={subdeck.deck_id} />
                                            <input type="hidden" name="redirectTo" value={`/dashboard/decks/${deck.deck_id}/edit`} />
                                            <button
                                                type="submit"
                                                className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                                title="Delete deck"
                                            >
                                                Delete
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {cards.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Manage Cards</h2>
                        <span className="text-sm text-gray-500">{cards.length}</span>
                    </div>
                    <div className="space-y-4">
                        {cards.map((card) => (
                            <details key={card.card_id} className="rounded-2xl bg-gray-50 p-5 shadow-sm">
                                <summary className="cursor-pointer list-none">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase text-slate-700">
                                                {card.card_type}
                                            </span>
                                            <p className="mt-3 text-sm text-slate-900">{card.front}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700"
                                                title="Edit card"
                                            >
                                                Open
                                            </span>
                                        </div>
                                    </div>
                                </summary>
                                <div className="mt-4 border-t border-gray-200 pt-4">
                                    <form action={updateCardAction} className="space-y-4">
                                        <input type="hidden" name="cardId" value={card.card_id} />
                                        <input type="hidden" name="deckId" value={deck.deck_id} />
                                        <div className="space-y-2">
                                            <label htmlFor={`card-type-${card.card_id}`} className="block text-sm font-medium text-gray-700">
                                                Card type
                                            </label>
                                            <select
                                                id={`card-type-${card.card_id}`}
                                                name="cardType"
                                                defaultValue={card.card_type}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                            >
                                                <option value="flashcard">Flashcard</option>
                                                <option value="mcq">MCQ</option>
                                                <option value="methodology">Methodology</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor={`front-${card.card_id}`} className="block text-sm font-medium text-gray-700">
                                                Front / Prompt
                                            </label>
                                            <textarea
                                                id={`front-${card.card_id}`}
                                                name="front"
                                                required
                                                rows={4}
                                                defaultValue={card.front}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor={`back-${card.card_id}`} className="block text-sm font-medium text-gray-700">
                                                Back / Answer or Methodology
                                            </label>
                                            <textarea
                                                id={`back-${card.card_id}`}
                                                name="back"
                                                required
                                                rows={5}
                                                defaultValue={card.back}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="submit"
                                                className="rounded-lg border border-blue-300 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
                                            >
                                                Save Card
                                            </button>
                                        </div>
                                    </form>
                                    <form action={deleteCardAction} className="mt-3">
                                        <input type="hidden" name="cardId" value={card.card_id} />
                                        <input type="hidden" name="deckId" value={deck.deck_id} />
                                        <button
                                            type="submit"
                                            className="rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                                        >
                                            Delete Card
                                        </button>
                                    </form>
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}
        </section>
    );
}
