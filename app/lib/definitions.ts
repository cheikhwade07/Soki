// Type definitions for Soki Learning App

export type User = {
  user_id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type Deck = {
  deck_id: string;
  user_id: string;
  parent_deck_id: string | null;
  title: string;
  description: string | null;
  created_at: string;
};

// Deck with computed fields for display
export type DeckWithCounts = Deck & {
  card_count: number;
  subdeck_count: number;
};

export type Card = {
  card_id: string;
  deck_id: string;
  card_type: 'flashcard' | 'mcq';
  front: string;
  back: string;
  created_at: string;
};

export type Deadline = {
  deadline_id: string;
  user_id: string;
  deck_id: string | null;
  title: string;
  due_date: string;
  created_at: string;
};

// Deadline joined with deck title for display
export type DeadlineWithDeck = Deadline & {
  deck_title: string | null;
};