'use client';

import { useState } from 'react';
import type { Card } from '@/app/lib/definitions';
import { BookOpenText, CircleHelp, FilePenLine } from 'lucide-react';

function getCardMeta(cardType: Card['card_type']) {
    switch (cardType) {
        case 'mcq':
            return {
                label: 'MCQ',
                promptLabel: 'Question',
                answerLabel: 'Correct answer',
                icon: CircleHelp,
                accent: 'bg-amber-50 text-amber-700',
                border: 'border-amber-200',
                hint: 'Choose the strongest option before revealing.',
                align: 'text-center',
            };
        case 'methodology':
            return {
                label: 'Methodology',
                promptLabel: 'Prompt',
                answerLabel: 'Methodology and reference response',
                icon: FilePenLine,
                accent: 'bg-purple-50 text-purple-700',
                border: 'border-purple-200',
                hint: 'Think through your own approach before checking the methodology.',
                align: 'text-left',
            };
        default:
            return {
                label: 'Flashcard',
                promptLabel: 'Question',
                answerLabel: 'Answer',
                icon: BookOpenText,
                accent: 'bg-blue-50 text-blue-700',
                border: 'border-blue-200',
                hint: 'Try to recall the answer before revealing.',
                align: 'text-center',
            };
    }
}

export function FlashCard({ card }: { card: Card }) {
    const [flipped, setFlipped] = useState(false);
    const meta = getCardMeta(card.card_type);
    const Icon = meta.icon;

    return (
        <div
            onClick={() => setFlipped(!flipped)}
            className={`flex min-h-[240px] cursor-pointer flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${meta.border}`}
        >
            <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${meta.accent}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                </span>
                <span className="text-xs uppercase tracking-wide text-gray-400">
                    {flipped ? meta.answerLabel : meta.promptLabel}
                </span>
            </div>

            <div className="flex flex-1 flex-col justify-center py-6">
                {!flipped && (
                    <p className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                        {meta.hint}
                    </p>
                )}
                <p className={`text-lg leading-8 text-slate-900 ${meta.align}`}>
                    {flipped ? card.back : card.front}
                </p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{flipped ? 'Click to return to the prompt' : 'Click to reveal the response'}</span>
                {card.card_type === 'methodology' && <span>Self-assess</span>}
            </div>
        </div>
    );
}

export function CardList({ cards }: { cards: Card[] }) {
    if (cards.length === 0) {
        return <p className="text-sm text-gray-500">No cards in this deck yet.</p>;
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
                <FlashCard key={card.card_id} card={card} />
            ))}
        </div>
    );
}
