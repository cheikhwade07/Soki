// app/dashboard/decks/[id]/page.tsx — show subdecks or cards
import { fetchDeckById, fetchSubDecks, fetchCardsByDeck } from '@/app/lib/data';
import { DeckList } from '@/app/ui/dashboard/deck';
import { CardList } from '@/app/ui/dashboard/card';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const deck = await fetchDeckById(id);
    const subdecks = await fetchSubDecks(id);

    if (subdecks.length > 0) {
        return (
            <div>
                <h1 className="text-xl font-bold mb-4">{deck?.title}</h1>
                <DeckList decks={subdecks} />
            </div>
        );
    }

    const cards = await fetchCardsByDeck(id);
    return (
        <div>
            <h1 className="text-xl font-bold mb-4">{deck?.title}</h1>
            <CardList cards={cards} />
        </div>
    );
}