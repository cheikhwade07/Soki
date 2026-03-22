import { auth } from '@/auth';
import { createCardAction, createDeckAction } from '@/app/lib/action';
import { fetchDeckById } from '@/app/lib/data';
import { BackButton } from '@/app/ui/back-button';
import { DropFiles } from '@/app/ui/dashboard/dropfile';
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

    const isContainer = deck.deck_kind === 'container';
    const isCardsDeck = deck.deck_kind === 'cards';
    const isEmpty = deck.deck_kind === null;

    return (
        <section className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-blue-500">Add To Deck</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">{deck.title}</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        {isEmpty && 'This deck is empty. Choose what kind of content it should hold.'}
                        {isContainer && 'This is a container deck. You can add decks only.'}
                        {isCardsDeck && 'This is a card deck. You can add cards manually or generate them from a file.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <BackButton />
                </div>
            </header>

            {(isEmpty || isContainer) && (
                <section className="rounded-2xl bg-gray-50 p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Add Deck</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Adding a deck keeps this deck in container mode and organizes content into nested groups.
                    </p>
                    <form action={createDeckAction} className="mt-4 space-y-4">
                        <input type="hidden" name="parentDeckId" value={deck.deck_id} />
                        <div className="space-y-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Deck title
                            </label>
                            <input
                                id="title"
                                name="title"
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                placeholder="e.g. Week 3 Review"
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
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                placeholder="Optional deck description"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white hover:bg-blue-400"
                        >
                            Create Deck
                        </button>
                    </form>
                </section>
            )}

            {(isEmpty || isCardsDeck) && (
                <section className="space-y-6">
                    <div className="rounded-2xl bg-gray-50 p-5 shadow-sm">
                        <h2 className="text-lg font-semibold">Add Card Manually</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Manual cards save immediately and put this deck into card mode.
                        </p>
                        <form action={createCardAction} className="mt-4 space-y-4">
                            <input type="hidden" name="deckId" value={deck.deck_id} />
                            <div className="space-y-2">
                                <label htmlFor="cardType" className="block text-sm font-medium text-gray-700">
                                    Card type
                                </label>
                                <select
                                    id="cardType"
                                    name="cardType"
                                    defaultValue="flashcard"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                >
                                    <option value="flashcard">Flashcard</option>
                                    <option value="mcq">MCQ</option>
                                    <option value="methodology">Methodology</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="front" className="block text-sm font-medium text-gray-700">
                                    Front / Prompt
                                </label>
                                <textarea
                                    id="front"
                                    name="front"
                                    required
                                    rows={4}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                    placeholder="Enter the prompt, question, or problem statement"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="back" className="block text-sm font-medium text-gray-700">
                                    Back / Answer or Methodology
                                </label>
                                <textarea
                                    id="back"
                                    name="back"
                                    required
                                    rows={5}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                    placeholder="Enter the answer, methodology, or reference response"
                                />
                            </div>
                            <button
                                type="submit"
                                className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
                            >
                                Save Card
                            </button>
                        </form>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-5 shadow-sm">
                        <h2 className="text-lg font-semibold">Generate Cards From File</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Generated cards should save immediately once the backend endpoint is connected.
                        </p>
                        <div className="mt-4">
                            <DropFiles deckId={deck.deck_id} />
                        </div>
                    </div>
                </section>
            )}
        </section>
    );
}
