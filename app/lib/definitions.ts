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
  deck_kind: 'container' | 'cards' | null;
  title: string;
  description: string | null;
  created_at: string;
};

export type DeckWithCounts = Deck & {
  card_count: number;
  subdeck_count: number;
};

export type Card = {
  card_id: string;
  deck_id: string;
  card_type: 'flashcard' | 'mcq' | 'methodology';
  front: string;
  back: string;
  created_at: string;
  updated_at?: string;
};

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
export type MemoryState = 'new' | 'learning' | 'review' | 'relearning';

export type ReviewState = {
  card_id: string;
  user_id: string;
  due_at: string;
  last_reviewed_at: string | null;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: MemoryState;
  created_at: string;
  updated_at: string;
};

export type ReviewEvent = {
  review_event_id: string;
  card_id: string;
  user_id: string;
  rating: ReviewRating;
  reviewed_at: string;
  previous_due_at: string | null;
  next_due_at: string;
  previous_stability: number | null;
  next_stability: number;
  previous_difficulty: number | null;
  next_difficulty: number;
  response_ms: number | null;
};

export type DueReview = ReviewState & {
  card_front: string | null;
};

export type ReviewQueueCard = ReviewState & {
  card_type: 'flashcard' | 'mcq' | 'methodology';
  front: string;
  back: string;
};
