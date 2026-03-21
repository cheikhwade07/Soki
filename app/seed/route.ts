import bcrypt from 'bcrypt';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET() {
    try {
        // Drop everything and start fresh
        await sql`DROP TABLE IF EXISTS deadlines`;
        await sql`DROP TABLE IF EXISTS cards`;
        await sql`DROP TABLE IF EXISTS decks`;
        await sql`DROP TABLE IF EXISTS users`;

        await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

        await sql`
      CREATE TABLE users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      )`;

        await sql`
      CREATE TABLE decks (
        deck_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        parent_deck_id UUID REFERENCES decks(deck_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT now()
      )`;

        await sql`
      CREATE TABLE cards (
        card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deck_id UUID NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
        card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('flashcard', 'mcq')),
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      )`;

        await sql`
      CREATE TABLE deadlines (
        deadline_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        deck_id UUID REFERENCES decks(deck_id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        due_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      )`;

        // Hash password properly
        const hash = await bcrypt.hash('123456', 10);

        // User
        await sql`
      INSERT INTO users (user_id, email, password_hash) VALUES
      ('410544b2-4001-4271-9855-fec4b6a6442a', 'test@soki.com', ${hash})`;

        // Top-level decks
        await sql`
      INSERT INTO decks (deck_id, user_id, parent_deck_id, title, description) VALUES
      ('d0000001-0000-4000-8000-000000000001', '410544b2-4001-4271-9855-fec4b6a6442a', NULL, 'Biology 101', 'Introductory biology'),
      ('d0000002-0000-4000-8000-000000000002', '410544b2-4001-4271-9855-fec4b6a6442a', NULL, 'Computer Science', 'Data structures and algorithms')`;

        // Subdecks
        await sql`
      INSERT INTO decks (deck_id, user_id, parent_deck_id, title, description) VALUES
      ('d0000003-0000-4000-8000-000000000003', '410544b2-4001-4271-9855-fec4b6a6442a', 'd0000001-0000-4000-8000-000000000001', 'Cell Biology', 'Cells and organelles'),
      ('d0000004-0000-4000-8000-000000000004', '410544b2-4001-4271-9855-fec4b6a6442a', 'd0000001-0000-4000-8000-000000000001', 'Genetics', 'DNA and heredity')`;

        // Cards
        await sql`
      INSERT INTO cards (deck_id, card_type, front, back) VALUES
      ('d0000003-0000-4000-8000-000000000003', 'flashcard', 'What is the powerhouse of the cell?', 'The mitochondria'),
      ('d0000003-0000-4000-8000-000000000003', 'flashcard', 'What does the Golgi apparatus do?', 'Modifies, sorts, and packages proteins'),
      ('d0000003-0000-4000-8000-000000000003', 'mcq', 'Which organelle has digestive enzymes? A) Ribosome B) Lysosome C) Nucleus D) Mitochondria', 'B) Lysosome'),
      ('d0000004-0000-4000-8000-000000000004', 'flashcard', 'What are the four DNA bases?', 'Adenine, Thymine, Guanine, Cytosine'),
      ('d0000004-0000-4000-8000-000000000004', 'flashcard', 'What is a codon?', 'A sequence of three nucleotides coding for an amino acid'),
      ('d0000002-0000-4000-8000-000000000002', 'flashcard', 'What is O(n log n)?', 'Time complexity of efficient sorting like mergesort'),
      ('d0000002-0000-4000-8000-000000000002', 'mcq', 'Which data structure uses FIFO? A) Stack B) Queue C) Tree D) Graph', 'B) Queue')`;

        // Deadlines
        await sql`
      INSERT INTO deadlines (user_id, deck_id, title, due_date) VALUES
      ('410544b2-4001-4271-9855-fec4b6a6442a', 'd0000001-0000-4000-8000-000000000001', 'Biology Midterm', '2026-04-15'),
      ('410544b2-4001-4271-9855-fec4b6a6442a', 'd0000002-0000-4000-8000-000000000002', 'CS Assignment 3', '2026-04-01'),
      ('410544b2-4001-4271-9855-fec4b6a6442a', NULL, 'Study group meeting', '2026-03-25')`;

        return Response.json({ message: 'Database seeded successfully' });
    } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
    }
}