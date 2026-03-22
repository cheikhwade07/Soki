import postgres from 'postgres';
import {
  Card,
  Deck,
  DeckWithCounts,
  Deadline,
  DeadlineWithCard,
} from './definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// ─── DECKS ───────────────────────────────────────────────

export async function fetchDecks(userId: string) {
  if (!userId) {
    throw new Error("fetchDecks called with no userId");
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

// ─── CARDS ───────────────────────────────────────────────

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

// ─── DEADLINES ───────────────────────────────────────────

export async function fetchDeadlines(userId: string) {
  try {
    const data = await sql<DeadlineWithCard[]>`
      SELECT dl.*, c.front AS card_front
      FROM deadlines dl
             JOIN cards c ON dl.card_id = c.card_id
      WHERE dl.user_id = ${userId}
      ORDER BY dl.due_date ASC
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch deadlines.');
  }
}

export async function fetchUpcomingDeadlines(userId: string) {
  try {
    const data = await sql<DeadlineWithCard[]>`
      SELECT 
        dl.*,
        c.front AS card_front
      FROM deadlines dl
      LEFT JOIN cards c ON dl.card_id = c.card_id
      WHERE dl.user_id = ${userId}
        AND dl.due_date >= NOW()
      ORDER BY dl.due_date ASC
      LIMIT 10
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch upcoming deadlines.');
  }
}

// ─── DASHBOARD STATS ─────────────────────────────────────

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
    const deadlineCountPromise = sql`
      SELECT COUNT(*) FROM deadlines
      WHERE user_id = ${userId} AND due_date >= NOW()
    `;

    const data = await Promise.all([
      deckCountPromise,
      cardCountPromise,
      deadlineCountPromise,
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
