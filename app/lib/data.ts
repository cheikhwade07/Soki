import postgres from 'postgres';
import {
  Card,
  Deck,
  DeckWithCounts,
  Deadline,
  DeadlineWithDeck,
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

export async function fetchDeckById(deckId: string) {
  try {
    const data = await sql<Deck[]>`
      SELECT * FROM decks
      WHERE deck_id = ${deckId}
    `;
    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch deck.');
  }
}

export async function fetchSubDecks(parentDeckId: string) {
  try {
    const data = await sql<DeckWithCounts[]>`
      SELECT 
        d.*,
        (SELECT COUNT(*) FROM cards c WHERE c.deck_id = d.deck_id)::int AS card_count,
        (SELECT COUNT(*) FROM decks sub WHERE sub.parent_deck_id = d.deck_id)::int AS subdeck_count
      FROM decks d
      WHERE d.parent_deck_id = ${parentDeckId}
      ORDER BY d.created_at DESC
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch subdecks.');
  }
}

// ─── CARDS ───────────────────────────────────────────────

export async function fetchCardsByDeck(deckId: string) {
  try {
    const data = await sql<Card[]>`
      SELECT * FROM cards
      WHERE deck_id = ${deckId}
      ORDER BY created_at DESC
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
    const data = await sql<DeadlineWithDeck[]>`
      SELECT 
        dl.*,
        d.title AS deck_title
      FROM deadlines dl
      LEFT JOIN decks d ON dl.deck_id = d.deck_id
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
    const data = await sql<DeadlineWithDeck[]>`
      SELECT 
        dl.*,
        d.title AS deck_title
      FROM deadlines dl
      LEFT JOIN decks d ON dl.deck_id = d.deck_id
      WHERE dl.user_id = ${userId}
        AND dl.due_date >= NOW()
      ORDER BY dl.due_date ASC
      LIMIT 5
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