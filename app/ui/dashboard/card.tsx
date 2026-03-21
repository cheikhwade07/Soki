'use client';

import { useState } from 'react';
import type { Card } from '@/app/lib/definitions';

export function FlashCard({ card }: { card: Card }) {
  const [flipped, setFlipped] = useState(false);

  return (
      <div
          onClick={() => setFlipped(!flipped)}
          className="cursor-pointer rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow min-h-[200px] flex flex-col justify-center items-center"
      >
      <span className="text-xs text-gray-400 mb-2 uppercase">
        {flipped ? 'Answer' : 'Question'} · {card.card_type}
      </span>
        <p className="text-center text-lg">
          {flipped ? card.back : card.front}
        </p>
        <span className="text-xs text-gray-400 mt-4">
        {flipped ? 'Click to see question' : 'Click to reveal'}
      </span>
      </div>
  );
}

export function CardList({ cards }: { cards: Card[] }) {
  if (cards.length === 0) {
    return <p className="text-sm text-gray-500">No cards in this deck.</p>;
  }

  return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
            <FlashCard key={card.card_id} card={card} />
        ))}
      </div>
  );
}