import {
    FolderIcon,
    BookOpenIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { DeckWithCounts } from '@/app/lib/definitions';

export function DeckItem({ deck }: { deck: DeckWithCounts }) {
    const isContainer = deck.deck_kind === 'container';
    const isCardsDeck = deck.deck_kind === 'cards';

    return (
        <Link href={`/dashboard/decks/${deck.deck_id}`}>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start gap-3">
                    {isContainer ? (
                        <div className="rounded-xl bg-blue-50 p-2">
                            <FolderIcon className="h-6 w-6 text-blue-500" />
                        </div>
                    ) : (
                        <div className="rounded-xl bg-emerald-50 p-2">
                            <BookOpenIcon className="h-6 w-6 text-green-500" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="truncate text-base font-semibold text-slate-900">{deck.title}</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                                {isContainer ? 'Container' : isCardsDeck ? 'Cards' : 'Empty'}
                            </span>
                        </div>
                        {deck.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-gray-500">{deck.description}</p>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>
                        {isContainer
                            ? `${deck.subdeck_count} deck${deck.subdeck_count !== 1 ? 's' : ''}`
                            : isCardsDeck
                                ? `${deck.card_count} card${deck.card_count !== 1 ? 's' : ''}`
                                : 'Empty deck'}
                    </span>
                    <span className="font-medium text-blue-600">Open</span>
                </div>
            </div>
        </Link>
    );
}

export function DeckList({ decks }: { decks: DeckWithCounts[] }) {
    if (decks.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <p className="text-base font-medium text-slate-900">No decks yet</p>
                <p className="mt-2 text-sm text-gray-500">
                    Create your first deck to start organizing cards and review sessions.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
                <DeckItem key={deck.deck_id} deck={deck} />
            ))}
        </div>
    );
}
