import postgres from 'postgres';
import {
  Card,
  Deck,
  DeckWithCounts,
  DueReview,
  ReviewQueueCard,
} from './definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

export async function fetchDecks(userId: string) {
  if (!userId) {
    throw new Error('fetchDecks called with no userId');
  }

  try {
    const data = await sql<DeckWithCounts[]>`
      SELECT
        d.*,
        (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.deck_id)::int AS card_count,
        (SELECT COUNT(*) FROM decks sub WHERE sub.parent_deck_id = d.deck_id)::int AS subdeck_count
      FROM decks d
      WHERE d.user_id = ${userId}
        AND d.parent_deck_id IS NULL
      ORDER BY d.created_at DESC
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch decks.');
  }
}

export async function fetchDeckById(deckId: string, userId: string) {
  try {
    const data = await sql<Deck[]>`
      SELECT * FROM decks
      WHERE deck_id = ${deckId}
        AND user_id = ${userId}
    `;
    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch deck.');
  }
}

export async function fetchSubDecks(parentDeckId: string, userId: string) {
  try {
    const data = await sql<DeckWithCounts[]>`
      SELECT
        d.*,
        (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.deck_id)::int AS card_count,
        (SELECT COUNT(*) FROM decks sub WHERE sub.parent_deck_id = d.deck_id)::int AS subdeck_count
      FROM decks d
      WHERE d.parent_deck_id = ${parentDeckId}
        AND d.user_id = ${userId}
      ORDER BY d.created_at DESC
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch subdecks.');
  }
}

export async function fetchCardsByDeck(deckId: string, userId: string) {
  try {
    const data = await sql<Card[]>`
      SELECT c.*
      FROM cards c
      JOIN decks d ON c.deck_id = d.deck_id
      WHERE c.deck_id = ${deckId}
        AND d.user_id = ${userId}
      ORDER BY c.created_at DESC
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch cards.');
  }
}

export async function fetchCardById(cardId: string) {
  try {
    const data = await sql<Card[]>`
      SELECT * FROM cards
      WHERE card_id = ${cardId}
    `;
    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card.');
  }
}

export async function fetchDueReviews(userId: string) {
  try {
    const data = await sql<DueReview[]>`
      SELECT rs.*, c.front AS card_front
      FROM review_state rs
      JOIN cards c ON rs.card_id = c.card_id
      WHERE rs.user_id = ${userId}
      ORDER BY rs.due_at ASC
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch due reviews.');
  }
}

export async function fetchUpcomingReviews(userId: string) {
  try {
    const data = await sql<DueReview[]>`
      SELECT
        rs.*,
        c.front AS card_front
      FROM review_state rs
      JOIN cards c ON rs.card_id = c.card_id
      WHERE rs.user_id = ${userId}
        AND rs.due_at >= NOW()
      ORDER BY rs.due_at ASC
      LIMIT 10
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch upcoming reviews.');
  }
}

export async function fetchReviewQueue(userId: string) {
  try {
    const data = await sql<ReviewQueueCard[]>`
      SELECT
        rs.*,
        c.card_type,
        c.front,
        c.back
      FROM review_state rs
      JOIN cards c ON rs.card_id = c.card_id
      JOIN decks d ON c.deck_id = d.deck_id
      WHERE rs.user_id = ${userId}
        AND d.user_id = ${userId}
      ORDER BY rs.due_at ASC
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch review queue.');
  }
}

export async function fetchDashboardData(userId: string) {
  try {
    const deckCountPromise = sql`
      SELECT COUNT(*) FROM decks WHERE user_id = ${userId}
    `;
    const cardCountPromise = sql`
      SELECT COUNT(*) FROM cards c
      JOIN decks d ON c.deck_id = d.deck_id
      WHERE d.user_id = ${userId}
    `;
    const reviewCountPromise = sql`
      SELECT COUNT(*) FROM review_state
      WHERE user_id = ${userId} AND due_at >= NOW()
    `;

    const data = await Promise.all([
      deckCountPromise,
      cardCountPromise,
      reviewCountPromise,
    ]);

    return {
      totalDecks: Number(data[0][0].count ?? '0'),
      totalCards: Number(data[1][0].count ?? '0'),
      upcomingDeadlines: Number(data[2][0].count ?? '0'),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch dashboard data.');
  }
}
