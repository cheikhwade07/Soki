// Placeholder data for Soki Learning App
// Use this to seed your database for development

const users = [
  {
    user_id: '410544b2-4001-4271-9855-fec4b6a6442a',
    email: 'user@soki.com',
    password: '123456', // Will be hashed by seed script
  },
];

const decks = [
  {
    deck_id: 'a1b2c3d4-0001-4000-8000-000000000001',
    user_id: users[0].user_id,
    parent_deck_id: null,
    title: 'Biology 101',
    description: 'Introductory biology course',
  },
  {
    deck_id: 'a1b2c3d4-0002-4000-8000-000000000002',
    user_id: users[0].user_id,
    parent_deck_id: null,
    title: 'Computer Science',
    description: 'Data structures and algorithms',
  },
  // Subdecks under Biology 101
  {
    deck_id: 'a1b2c3d4-0003-4000-8000-000000000003',
    user_id: users[0].user_id,
    parent_deck_id: 'a1b2c3d4-0001-4000-8000-000000000001',
    title: 'Cell Biology',
    description: 'Chapter 1 — Cells and organelles',
  },
  {
    deck_id: 'a1b2c3d4-0004-4000-8000-000000000004',
    user_id: users[0].user_id,
    parent_deck_id: 'a1b2c3d4-0001-4000-8000-000000000001',
    title: 'Genetics',
    description: 'Chapter 2 — DNA and heredity',
  },
];

const cards = [
  // Cards in Cell Biology subdeck
  {
    card_id: 'b1b2c3d4-0001-4000-8000-000000000001',
    deck_id: 'a1b2c3d4-0003-4000-8000-000000000003',
    card_type: 'flashcard',
    front: 'What is the powerhouse of the cell?',
    back: 'The mitochondria',
  },
  {
    card_id: 'b1b2c3d4-0002-4000-8000-000000000002',
    deck_id: 'a1b2c3d4-0003-4000-8000-000000000003',
    card_type: 'flashcard',
    front: 'What does the Golgi apparatus do?',
    back: 'It modifies, sorts, and packages proteins for secretion or use within the cell.',
  },
  {
    card_id: 'b1b2c3d4-0003-4000-8000-000000000003',
    deck_id: 'a1b2c3d4-0003-4000-8000-000000000003',
    card_type: 'mcq',
    front: 'Which organelle contains digestive enzymes? A) Ribosome B) Lysosome C) Nucleus D) Mitochondria',
    back: 'B) Lysosome',
  },
  // Cards in Genetics subdeck
  {
    card_id: 'b1b2c3d4-0004-4000-8000-000000000004',
    deck_id: 'a1b2c3d4-0004-4000-8000-000000000004',
    card_type: 'flashcard',
    front: 'What are the four DNA bases?',
    back: 'Adenine (A), Thymine (T), Guanine (G), Cytosine (C)',
  },
  {
    card_id: 'b1b2c3d4-0005-4000-8000-000000000005',
    deck_id: 'a1b2c3d4-0004-4000-8000-000000000004',
    card_type: 'flashcard',
    front: 'What is a codon?',
    back: 'A sequence of three nucleotides that codes for a specific amino acid.',
  },
];

const deadlines = [
  {
    deadline_id: 'c1b2c3d4-0001-4000-8000-000000000001',
    user_id: users[0].user_id,
    deck_id: 'a1b2c3d4-0001-4000-8000-000000000001',
    title: 'Biology Midterm',
    due_date: '2026-04-15',
  },
  {
    deadline_id: 'c1b2c3d4-0002-4000-8000-000000000002',
    user_id: users[0].user_id,
    deck_id: 'a1b2c3d4-0002-4000-8000-000000000002',
    title: 'CS Assignment 3',
    due_date: '2026-04-01',
  },
  {
    deadline_id: 'c1b2c3d4-0003-4000-8000-000000000003',
    user_id: users[0].user_id,
    deck_id: null,
    title: 'Study group meeting',
    due_date: '2026-03-25',
  },
];

export { users, decks, cards, deadlines };