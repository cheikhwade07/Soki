import {
    FolderIcon,
    BookOpenIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { DeckWithCounts } from '@/app/lib/definitions';

export function DeckItem({ deck }: { deck: DeckWithCounts }) {
    const isParent = deck.subdeck_count > 0;

    return (
        <Link href={`/dashboard/decks/${deck.deck_id}`}>
            <div className="rounded-xl bg-gray-50 p-4 shadow-sm hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                    {isParent ? (
                        <FolderIcon className="h-6 w-6 text-blue-500" />
                    ) : (
                        <BookOpenIcon className="h-6 w-6 text-green-500" />
                    )}
                    <div>
                        <h3 className="text-sm font-medium">{deck.title}</h3>
                        {deck.description && (
                            <p className="text-xs text-gray-500">{deck.description}</p>
                        )}
                    </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                    {isParent
                        ? `${deck.subdeck_count} subdeck${deck.subdeck_count !== 1 ? 's' : ''}`
                        : `${deck.card_count} card${deck.card_count !== 1 ? 's' : ''}`}
                </div>
            </div>
        </Link>
    );
}

export function DeckList({ decks }: { decks: DeckWithCounts[] }) {
    if (decks.length === 0) {
        return <p className="text-sm text-gray-500">No decks yet.</p>;
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
                <DeckItem key={deck.deck_id} deck={deck} />
            ))}
        </div>
    );
}