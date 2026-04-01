import bcrypt from 'bcrypt';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });
const SEED_CONFIRMATION = 'RESET_SOKI_DEMO_DATA';

const newUserId = '410544b2-4001-4271-9855-fec4b6a6442a';
const powerUserId = '510544b2-5001-4271-9855-fec4b6a6555b';

function getDatabaseHost() {
    try {
        return new URL(process.env.POSTGRES_URL!).hostname;
    } catch {
        return 'unknown-host';
    }
}

export async function GET(request: Request) {
    if (process.env.NODE_ENV !== 'development') {
        return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== SEED_CONFIRMATION) {
        return Response.json(
            {
                warning: 'Seed is destructive and will drop all app tables in the configured database.',
                database_host: getDatabaseHost(),
                required_confirmation: SEED_CONFIRMATION,
                how_to_run: `/seed?confirm=${SEED_CONFIRMATION}`,
            },
            { status: 400 },
        );
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
              (${newUserId}, 'new@soki.com', ${hash}),
              (${powerUserId}, 'power@soki.com', ${hash})`;

            await transaction`
              INSERT INTO decks (deck_id, user_id, parent_deck_id, deck_kind, title, description) VALUES
              ('d1000001-0000-4000-8000-000000000001', ${newUserId}, NULL, NULL, 'Starter Inbox', 'Fresh deck ready to become a card deck or a container deck.'),
              ('d1000002-0000-4000-8000-000000000002', ${newUserId}, NULL, 'cards', 'First Week Review', 'New-user deck that showcases every supported card type.'),
              ('d1000003-0000-4000-8000-000000000003', ${newUserId}, NULL, 'container', 'Course Library', 'A new user container deck with organized study areas.'),
              ('d1000011-0000-4000-8000-000000000011', ${newUserId}, 'd1000003-0000-4000-8000-000000000003', 'cards', 'Biology Basics', 'Simple factual recall for a new learner.'),
              ('d1000012-0000-4000-8000-000000000012', ${newUserId}, 'd1000003-0000-4000-8000-000000000003', NULL, 'Programming Practice', 'Empty nested deck that still needs content.')`;

            await transaction`
              INSERT INTO cards (card_id, deck_id, card_type, front, back) VALUES
              ('c1000001-0000-4000-8000-000000000001', 'd1000002-0000-4000-8000-000000000002', 'flashcard', 'What is active recall?', 'Actively retrieving information from memory instead of passively rereading it.'),
              ('c1000002-0000-4000-8000-000000000002', 'd1000002-0000-4000-8000-000000000002', 'mcq', 'Which review rating pushes a card furthest out? A) Again B) Hard C) Good D) Easy', 'D) Easy'),
              ('c1000003-0000-4000-8000-000000000003', 'd1000002-0000-4000-8000-000000000002', 'methodology', 'Explain how you would compare mitosis and meiosis in a short-answer response.', 'Methodology: define both processes, compare purpose, number of divisions, and final cells produced, then close with one clear contrast. Reference response: mitosis creates two identical diploid cells for growth and repair, while meiosis creates four genetically different haploid cells for reproduction.'),
              ('c1000004-0000-4000-8000-000000000004', 'd1000011-0000-4000-8000-000000000011', 'flashcard', 'What is osmosis?', 'The movement of water across a selectively permeable membrane from low solute concentration to high solute concentration.')`;

            await transaction`
              INSERT INTO review_state (
                card_id, user_id, due_at, last_reviewed_at, stability, difficulty,
                elapsed_days, scheduled_days, reps, lapses, state
              ) VALUES
              ('c1000001-0000-4000-8000-000000000001', ${newUserId}, NOW() - INTERVAL '3 hours', NULL, 0, 5, 0, 0, 0, 0, 'new'),
              ('c1000002-0000-4000-8000-000000000002', ${newUserId}, NOW() - INTERVAL '90 minutes', NULL, 0, 5, 0, 0, 0, 0, 'new'),
              ('c1000003-0000-4000-8000-000000000003', ${newUserId}, NOW() + INTERVAL '1 day', NULL, 0, 5, 0, 0, 0, 0, 'new'),
              ('c1000004-0000-4000-8000-000000000004', ${newUserId}, NOW() + INTERVAL '2 days', NULL, 0, 5, 0, 0, 0, 0, 'new')`;

            await transaction`
              INSERT INTO decks (deck_id, user_id, parent_deck_id, deck_kind, title, description) VALUES
              ('d2000001-0000-4000-8000-000000000001', ${powerUserId}, NULL, 'container', 'Med School System', 'A mature account with a stable long-term study structure.'),
              ('d2000002-0000-4000-8000-000000000002', ${powerUserId}, NULL, 'cards', 'Daily Mixed Review', 'A high-traffic deck used almost every day.'),
              ('d2000011-0000-4000-8000-000000000011', ${powerUserId}, 'd2000001-0000-4000-8000-000000000001', 'cards', 'Cardiology', 'Power user factual and conceptual review deck.'),
              ('d2000012-0000-4000-8000-000000000012', ${powerUserId}, 'd2000001-0000-4000-8000-000000000001', 'cards', 'Pharmacology', 'Frequent mixed-card review deck.'),
              ('d2000013-0000-4000-8000-000000000013', ${powerUserId}, 'd2000001-0000-4000-8000-000000000001', 'cards', 'Case Method', 'Methodology-heavy deck for structured reasoning practice.')`;

            await transaction`
              INSERT INTO cards (card_id, deck_id, card_type, front, back) VALUES
              ('c2000001-0000-4000-8000-000000000001', 'd2000011-0000-4000-8000-000000000011', 'flashcard', 'What heart sound is produced by closure of the mitral and tricuspid valves?', 'S1.'),
              ('c2000002-0000-4000-8000-000000000002', 'd2000011-0000-4000-8000-000000000011', 'mcq', 'Which vessel carries oxygenated blood from the lungs to the heart? A) Pulmonary artery B) Pulmonary vein C) Superior vena cava D) Aorta', 'B) Pulmonary vein'),
              ('c2000003-0000-4000-8000-000000000003', 'd2000012-0000-4000-8000-000000000012', 'flashcard', 'What class of drug is lisinopril?', 'An ACE inhibitor.'),
              ('c2000004-0000-4000-8000-000000000004', 'd2000012-0000-4000-8000-000000000012', 'mcq', 'Which drug class is most associated with reducing gastric acid secretion? A) Beta blockers B) Proton pump inhibitors C) SSRIs D) NSAIDs', 'B) Proton pump inhibitors'),
              ('c2000005-0000-4000-8000-000000000005', 'd2000013-0000-4000-8000-000000000013', 'methodology', 'Outline how you would answer a clinical case asking for the most likely diagnosis and first management step.', 'Methodology: summarize the presentation, identify the most discriminating clues, rule out close alternatives, state the likely diagnosis, then give the immediate management priority. Reference response: begin with the key symptoms and vitals, compare them to the highest-risk causes, justify the best-fit diagnosis, and finish with the first safe intervention.'),
              ('c2000006-0000-4000-8000-000000000006', 'd2000002-0000-4000-8000-000000000002', 'flashcard', 'Why does spaced repetition improve retention?', 'It revisits information at increasing intervals near the point of forgetting.'),
              ('c2000007-0000-4000-8000-000000000007', 'd2000002-0000-4000-8000-000000000002', 'methodology', 'Describe how you would explain the difference between sensitivity and specificity in an exam answer.', 'Methodology: define each metric, tie each one to false negatives or false positives, and finish with a short example of when each matters. Reference response: sensitivity measures how well a test catches true positives, while specificity measures how well it excludes true negatives.')`;

            await transaction`
              INSERT INTO review_state (
                card_id, user_id, due_at, last_reviewed_at, stability, difficulty,
                elapsed_days, scheduled_days, reps, lapses, state
              ) VALUES
              ('c2000001-0000-4000-8000-000000000001', ${powerUserId}, NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 days', 6.8, 4.0, 5, 12, 10, 0, 'review'),
              ('c2000002-0000-4000-8000-000000000002', ${powerUserId}, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '4 days', 4.2, 4.8, 4, 7, 8, 1, 'review'),
              ('c2000003-0000-4000-8000-000000000003', ${powerUserId}, NOW() + INTERVAL '3 days', NOW() - INTERVAL '6 days', 7.5, 3.7, 6, 14, 11, 0, 'review'),
              ('c2000004-0000-4000-8000-000000000004', ${powerUserId}, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '2 days', 2.1, 5.5, 2, 2, 3, 1, 'learning'),
              ('c2000005-0000-4000-8000-000000000005', ${powerUserId}, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '1 day', 1.5, 5.2, 1, 1, 2, 0, 'learning'),
              ('c2000006-0000-4000-8000-000000000006', ${powerUserId}, NOW() + INTERVAL '8 days', NOW() - INTERVAL '8 days', 9.2, 3.2, 8, 21, 14, 0, 'review'),
              ('c2000007-0000-4000-8000-000000000007', ${powerUserId}, NOW() - INTERVAL '3 days', NOW() - INTERVAL '9 days', 5.1, 4.6, 9, 9, 9, 2, 'relearning')`;

            await transaction`
              INSERT INTO review_events (
                card_id, user_id, rating, reviewed_at, previous_due_at, next_due_at,
                previous_stability, next_stability, previous_difficulty, next_difficulty, response_ms
              ) VALUES
              ('c2000001-0000-4000-8000-000000000001', ${powerUserId}, 'good', NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day', 5.9, 6.8, 4.2, 4.0, 5400),
              ('c2000002-0000-4000-8000-000000000002', ${powerUserId}, 'hard', NOW() - INTERVAL '4 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 hours', 5.0, 4.2, 4.5, 4.8, 7100),
              ('c2000003-0000-4000-8000-000000000003', ${powerUserId}, 'easy', NOW() - INTERVAL '6 days', NOW() - INTERVAL '8 days', NOW() + INTERVAL '3 days', 6.2, 7.5, 4.0, 3.7, 4300),
              ('c2000004-0000-4000-8000-000000000004', ${powerUserId}, 'again', NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day', NOW() - INTERVAL '30 minutes', 3.4, 2.1, 5.1, 5.5, 9800),
              ('c2000005-0000-4000-8000-000000000005', ${powerUserId}, 'good', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', NOW() - INTERVAL '5 hours', 1.0, 1.5, 5.4, 5.2, 12100),
              ('c2000007-0000-4000-8000-000000000007', ${powerUserId}, 'again', NOW() - INTERVAL '9 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days', 6.3, 5.1, 4.3, 4.6, 13300)`;
        });

        const counts = await sql`
          SELECT
            (SELECT COUNT(*) FROM users)::int AS user_count,
            (SELECT COUNT(*) FROM decks)::int AS deck_count,
            (SELECT COUNT(*) FROM cards)::int AS card_count,
            (SELECT COUNT(*) FROM review_state)::int AS review_state_count,
            (SELECT COUNT(*) FROM review_events)::int AS review_event_count
        `;

        return Response.json({
            message: 'Database fully reset and reseeded with two demo users.',
            database_host: getDatabaseHost(),
            logins: [
                {
                    profile: 'new-user',
                    email: 'new@soki.com',
                    password: '123456',
                    focus: 'Shows empty deck flow, nested deck flow, and all three card types.',
                },
                {
                    profile: 'power-user',
                    email: 'power@soki.com',
                    password: '123456',
                    focus: 'Shows mature FSRS state, review history, overdue cards, and long-term usage analytics.',
                },
            ],
            counts: counts[0],
            showcase: {
                new_user: {
                    empty_deck: 'Starter Inbox',
                    all_card_types: 'First Week Review',
                    container_deck: 'Course Library',
                    nested_empty_deck: 'Programming Practice',
                },
                power_user: {
                    container_deck: 'Med School System',
                    due_review_deck: 'Daily Mixed Review',
                    mature_review_decks: ['Cardiology', 'Pharmacology', 'Case Method'],
                },
            },
        });
    } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
    }
}
