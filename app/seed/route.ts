import bcrypt from 'bcrypt';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

const demoUserId = '410544b2-4001-4271-9855-fec4b6a6442a';

export async function GET() {
    if (process.env.NODE_ENV !== 'development') {
        return Response.json({ error: 'Not found' }, { status: 404 });
    }

    try {
        await sql.begin(async (transaction) => {
            await transaction`DROP TABLE IF EXISTS review_events CASCADE`;
            await transaction`DROP TABLE IF EXISTS review_state CASCADE`;
            await transaction`DROP TABLE IF EXISTS cards CASCADE`;
            await transaction`DROP TABLE IF EXISTS decks CASCADE`;
            await transaction`DROP TABLE IF EXISTS users CASCADE`;

            await transaction`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

            await transaction`
              CREATE TABLE users (
                user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT now()
              )`;

            await transaction`
              CREATE TABLE decks (
                deck_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                parent_deck_id UUID REFERENCES decks(deck_id) ON DELETE CASCADE,
                deck_kind VARCHAR(20) CHECK (deck_kind IN ('container', 'cards')),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT now()
              )`;

            await transaction`
              CREATE TABLE cards (
                card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                deck_id UUID NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
                card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('flashcard', 'mcq', 'methodology')),
                front TEXT NOT NULL,
                back TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now()
              )`;

            await transaction`
              CREATE TABLE review_state (
                card_id UUID PRIMARY KEY REFERENCES cards(card_id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                due_at TIMESTAMP NOT NULL,
                last_reviewed_at TIMESTAMP,
                stability DOUBLE PRECISION NOT NULL DEFAULT 0,
                difficulty DOUBLE PRECISION NOT NULL DEFAULT 5,
                elapsed_days INTEGER NOT NULL DEFAULT 0,
                scheduled_days INTEGER NOT NULL DEFAULT 0,
                reps INTEGER NOT NULL DEFAULT 0,
                lapses INTEGER NOT NULL DEFAULT 0,
                state VARCHAR(20) NOT NULL CHECK (state IN ('new', 'learning', 'review', 'relearning')),
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now()
              )`;

            await transaction`
              CREATE TABLE review_events (
                review_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                rating VARCHAR(20) NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
                reviewed_at TIMESTAMP NOT NULL,
                previous_due_at TIMESTAMP,
                next_due_at TIMESTAMP NOT NULL,
                previous_stability DOUBLE PRECISION,
                next_stability DOUBLE PRECISION NOT NULL,
                previous_difficulty DOUBLE PRECISION,
                next_difficulty DOUBLE PRECISION NOT NULL,
                response_ms INTEGER
              )`;

            const hash = await bcrypt.hash('123456', 10);

            await transaction`
              INSERT INTO users (user_id, email, password_hash) VALUES
              (${demoUserId}, 'test@soki.com', ${hash})`;

            await transaction`
              INSERT INTO decks (deck_id, user_id, parent_deck_id, deck_kind, title, description) VALUES
              ('d0000001-0000-4000-8000-000000000001', ${demoUserId}, NULL, NULL, 'Hackathon Demo', 'Fresh empty deck that lets you choose what to add.'),
              ('d0000002-0000-4000-8000-000000000002', ${demoUserId}, NULL, 'container', 'Biology 101', 'Container deck with subdecks only.'),
              ('d0000003-0000-4000-8000-000000000003', ${demoUserId}, NULL, 'container', 'Computer Science', 'Container deck with subdecks only.'),
              ('d0000004-0000-4000-8000-000000000004', ${demoUserId}, NULL, 'cards', 'Rapid Recall', 'Top-level card deck for direct study.')`;

            await transaction`
              INSERT INTO decks (deck_id, user_id, parent_deck_id, deck_kind, title, description) VALUES
              ('d0000011-0000-4000-8000-000000000011', ${demoUserId}, 'd0000002-0000-4000-8000-000000000002', 'cards', 'Cell Biology', 'Organelles and membrane transport'),
              ('d0000012-0000-4000-8000-000000000012', ${demoUserId}, 'd0000002-0000-4000-8000-000000000002', 'cards', 'Genetics', 'DNA, inheritance, and transcription'),
              ('d0000021-0000-4000-8000-000000000021', ${demoUserId}, 'd0000003-0000-4000-8000-000000000003', 'cards', 'Data Structures', 'Core structures and operations'),
              ('d0000022-0000-4000-8000-000000000022', ${demoUserId}, 'd0000003-0000-4000-8000-000000000003', 'cards', 'Algorithms', 'Sorting, search, and complexity'),
              ('d0000023-0000-4000-8000-000000000023', ${demoUserId}, 'd0000003-0000-4000-8000-000000000003', NULL, 'Systems Project', 'Empty subdeck ready to become a container or card deck.')`;

            await transaction`
              INSERT INTO cards (card_id, deck_id, card_type, front, back) VALUES
              ('c0000011-0000-4000-8000-000000000011', 'd0000011-0000-4000-8000-000000000011', 'flashcard', 'What is the powerhouse of the cell?', 'The mitochondrion produces ATP through cellular respiration.'),
              ('c0000012-0000-4000-8000-000000000012', 'd0000011-0000-4000-8000-000000000011', 'flashcard', 'What does the Golgi apparatus do?', 'It modifies, sorts, and packages proteins and lipids.'),
              ('c0000013-0000-4000-8000-000000000013', 'd0000012-0000-4000-8000-000000000012', 'flashcard', 'What are the four DNA bases?', 'Adenine, thymine, guanine, and cytosine.'),
              ('c0000014-0000-4000-8000-000000000014', 'd0000012-0000-4000-8000-000000000012', 'mcq', 'Which molecule carries genetic instructions? A) ATP B) DNA C) Lipid D) Ribosome', 'B) DNA'),
              ('c0000021-0000-4000-8000-000000000021', 'd0000021-0000-4000-8000-000000000021', 'flashcard', 'What data structure uses FIFO ordering?', 'A queue uses first-in, first-out ordering.'),
              ('c0000022-0000-4000-8000-000000000022', 'd0000021-0000-4000-8000-000000000021', 'flashcard', 'What data structure uses LIFO ordering?', 'A stack uses last-in, first-out ordering.'),
              ('c0000023-0000-4000-8000-000000000023', 'd0000022-0000-4000-8000-000000000022', 'flashcard', 'What is the average time complexity of binary search?', 'O(log n) when the array is sorted.'),
              ('c0000024-0000-4000-8000-000000000024', 'd0000022-0000-4000-8000-000000000022', 'mcq', 'Which sort is typically O(n log n)? A) Bubble B) Merge C) Selection D) Insertion', 'B) Merge'),
              ('c0000031-0000-4000-8000-000000000031', 'd0000004-0000-4000-8000-000000000004', 'flashcard', 'What is retrieval practice?', 'Actively recalling information from memory to strengthen retention.'),
              ('c0000032-0000-4000-8000-000000000032', 'd0000004-0000-4000-8000-000000000004', 'flashcard', 'What is spacing effect?', 'Learning improves when study sessions are distributed over time.'),
              ('c0000033-0000-4000-8000-000000000033', 'd0000004-0000-4000-8000-000000000004', 'mcq', 'Which rating should delay review the most? A) Again B) Hard C) Good D) Easy', 'D) Easy'),
              ('c0000034-0000-4000-8000-000000000034', 'd0000004-0000-4000-8000-000000000004', 'methodology', 'Explain how spaced repetition differs from cramming. Include one practical example.', 'Methodology: define both approaches, contrast how review is distributed over time, then support the distinction with one concrete study example. Reference response: spaced repetition revisits material over increasing intervals, which improves long-term retention. Cramming compresses review into one short period and fades quickly. Example: reviewing biology terms over five days instead of rereading them once the night before.')`;

            await transaction`
              INSERT INTO review_state (
                card_id, user_id, due_at, last_reviewed_at, stability, difficulty,
                elapsed_days, scheduled_days, reps, lapses, state
              ) VALUES
              ('c0000011-0000-4000-8000-000000000011', ${demoUserId}, '2026-03-20 09:00:00', '2026-03-15 09:10:00', 3.9, 4.4, 5, 5, 4, 0, 'review'),
              ('c0000012-0000-4000-8000-000000000012', ${demoUserId}, '2026-03-22 08:30:00', '2026-03-20 08:35:00', 1.8, 5.2, 2, 2, 2, 0, 'review'),
              ('c0000013-0000-4000-8000-000000000013', ${demoUserId}, '2026-03-24 12:00:00', '2026-03-22 12:10:00', 1.0, 6.1, 2, 2, 1, 1, 'relearning'),
              ('c0000014-0000-4000-8000-000000000014', ${demoUserId}, '2026-03-29 10:00:00', '2026-03-21 10:00:00', 4.8, 4.9, 8, 8, 5, 0, 'review'),
              ('c0000021-0000-4000-8000-000000000021', ${demoUserId}, '2026-03-21 16:00:00', '2026-03-18 16:00:00', 2.7, 5.1, 3, 3, 3, 0, 'review'),
              ('c0000022-0000-4000-8000-000000000022', ${demoUserId}, '2026-03-25 09:30:00', '2026-03-22 09:35:00', 1.4, 5.8, 3, 3, 2, 1, 'review'),
              ('c0000023-0000-4000-8000-000000000023', ${demoUserId}, '2026-04-03 11:00:00', '2026-03-22 11:20:00', 6.1, 4.0, 12, 12, 7, 0, 'review'),
              ('c0000024-0000-4000-8000-000000000024', ${demoUserId}, '2026-03-27 13:00:00', '2026-03-21 13:00:00', 2.0, 5.4, 6, 6, 3, 0, 'review'),
              ('c0000031-0000-4000-8000-000000000031', ${demoUserId}, '2026-03-22 18:00:00', '2026-03-20 18:05:00', 1.7, 4.6, 2, 2, 2, 0, 'review'),
              ('c0000032-0000-4000-8000-000000000032', ${demoUserId}, '2026-03-31 08:00:00', '2026-03-22 08:00:00', 3.8, 4.3, 9, 9, 5, 0, 'review'),
              ('c0000033-0000-4000-8000-000000000033', ${demoUserId}, '2026-03-22 15:00:00', '2026-03-22 15:00:00', 0.9, 5.7, 1, 1, 1, 0, 'learning'),
              ('c0000034-0000-4000-8000-000000000034', ${demoUserId}, '2026-03-23 19:00:00', '2026-03-22 19:10:00', 1.3, 5.0, 1, 1, 1, 0, 'learning')`;

            await transaction`
              INSERT INTO review_events (
                card_id, user_id, rating, reviewed_at, previous_due_at, next_due_at,
                previous_stability, next_stability, previous_difficulty, next_difficulty, response_ms
              ) VALUES
              ('c0000011-0000-4000-8000-000000000011', ${demoUserId}, 'good', '2026-03-15 09:10:00', '2026-03-18 09:00:00', '2026-03-20 09:00:00', 3.1, 3.9, 4.7, 4.4, 7000),
              ('c0000012-0000-4000-8000-000000000012', ${demoUserId}, 'good', '2026-03-20 08:35:00', '2026-03-21 08:30:00', '2026-03-22 08:30:00', 1.2, 1.8, 5.5, 5.2, 9500),
              ('c0000013-0000-4000-8000-000000000013', ${demoUserId}, 'again', '2026-03-22 12:10:00', '2026-03-29 12:00:00', '2026-03-24 12:00:00', 1.8, 1.0, 5.8, 6.1, 14000),
              ('c0000021-0000-4000-8000-000000000021', ${demoUserId}, 'good', '2026-03-18 16:00:00', '2026-03-19 16:00:00', '2026-03-21 16:00:00', 2.0, 2.7, 5.4, 5.1, 10200),
              ('c0000023-0000-4000-8000-000000000023', ${demoUserId}, 'easy', '2026-03-22 11:20:00', '2026-03-26 11:00:00', '2026-04-03 11:00:00', 5.4, 6.1, 4.3, 4.0, 5200),
              ('c0000031-0000-4000-8000-000000000031', ${demoUserId}, 'good', '2026-03-20 18:05:00', '2026-03-21 18:00:00', '2026-03-22 18:00:00', 1.2, 1.7, 4.8, 4.6, 8200),
              ('c0000033-0000-4000-8000-000000000033', ${demoUserId}, 'hard', '2026-03-22 15:00:00', '2026-03-22 09:00:00', '2026-03-22 15:00:00', 0.6, 0.9, 5.5, 5.7, 11000)`;
        });

        const counts = await sql`
          SELECT
            (SELECT COUNT(*) FROM decks)::int AS deck_count,
            (SELECT COUNT(*) FROM cards)::int AS card_count,
            (SELECT COUNT(*) FROM review_state)::int AS review_state_count,
            (SELECT COUNT(*) FROM review_events)::int AS review_event_count
        `;

        return Response.json({
            message: 'Database reset and seeded for deck-kind demo.',
            login: {
                email: 'test@soki.com',
                password: '123456',
            },
            counts: counts[0],
            demo_decks: {
                empty: 'Hackathon Demo',
                container: ['Biology 101', 'Computer Science'],
                cards: ['Rapid Recall', 'Cell Biology', 'Algorithms'],
            },
        });
    } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
    }
}
