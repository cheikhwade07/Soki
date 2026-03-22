# Soki

Soki is a study app built around active recall and spaced repetition.

Core flow:
- create decks
- add cards manually or generate them from a PDF
- review only due cards
- rate each review with `Again`, `Hard`, `Good`, or `Easy`
- schedule future reviews with an FSRS-backed review loop

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Auth: `next-auth`
- Database: Postgres / Neon
- Backend: FastAPI in `Backend.py`
- AI generation: Gemini API
- Scheduling: `fsrs` Python library

## Current Product Shape

- Nested deck management with `deck_kind`
  - a deck can become a container deck or a card deck
- Card types
  - `flashcard`
  - `mcq`
  - `methodology`
- Deck-specific review
- Calendar with day / week / month views
- PDF upload -> backend generation -> card persistence
- Review state + review event logging

## Project Structure

- [app](/C:/Users/seydi/OneDrive/Desktop/Winter%202026/MindHack/Soki/app)
  - Next.js app, routes, UI, API bridges
- [Backend.py](/C:/Users/seydi/OneDrive/Desktop/Winter%202026/MindHack/Soki/Backend.py)
  - FastAPI backend for PDF parsing, AI generation, and FSRS review updates
- [app/lib/data.ts](/C:/Users/seydi/OneDrive/Desktop/Winter%202026/MindHack/Soki/app/lib/data.ts)
  - database reads
- [app/lib/action.ts](/C:/Users/seydi/OneDrive/Desktop/Winter%202026/MindHack/Soki/app/lib/action.ts)
  - server actions for deck/card management
- [app/api/generate-cards/route.ts](/C:/Users/seydi/OneDrive/Desktop/Winter%202026/MindHack/Soki/app/api/generate-cards/route.ts)
  - Next.js bridge from frontend upload to FastAPI backend
- [app/api/review-card/route.ts](/C:/Users/seydi/OneDrive/Desktop/Winter%202026/MindHack/Soki/app/api/review-card/route.ts)
  - Next.js bridge from review UI to FSRS backend update
- [app/seed/route.ts](/C:/Users/seydi/OneDrive/Desktop/Winter%202026/MindHack/Soki/app/seed/route.ts)
  - development-only reset/seed endpoint

## Environment Variables

Set these in `.env`:

```env
POSTGRES_URL=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
BACKEND_API_URL=http://127.0.0.1:8000
GEMINI_API_KEY=...
```

Important:
- do not commit real credentials
- if a Gemini key was exposed, rotate it

## Run Locally

### 1. Install frontend dependencies

```bash
pnpm install
```

### 2. Set up Python environment

If you do not already have `.venv`:

```bash
python -m venv .venv
```

Install backend packages:

```bash
.\.venv\Scripts\python -m pip install fastapi "uvicorn[standard]" pymupdf fsrs google-genai python-multipart
```

### 3. Start the FastAPI backend

```bash
.\.venv\Scripts\python -m uvicorn Backend:app --host 127.0.0.1 --port 8000
```

### 4. Start the Next.js frontend

```bash
pnpm dev
```

Frontend:
- `http://localhost:3000`

Backend:
- `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`

## Development Seed

In development, reset and seed the database with:

```text
/seed
```

This recreates:
- users
- decks
- cards
- review_state
- review_events

Demo login:

```text
test@soki.com
123456
```

## Main Flows

### Create and manage decks

- create a deck
- choose whether it becomes a container deck or card deck
- add nested decks or cards
- edit and delete decks/cards

### Generate cards from PDF

- open a card deck
- upload a PDF
- Next.js sends the file to FastAPI
- FastAPI parses sections and batches Gemini generation
- generated cards are inserted into Postgres
- `review_state` rows are created immediately

### Review cards

- open global review or deck-specific review
- review due cards only
- rate a card
- backend runs FSRS update
- app updates `review_state`
- app writes a `review_events` log row

## Notes

- The PDF generation pipeline currently favors flashcards.
- The landing page, auth screens, dashboard, deck flow, calendar, and review loop are all wired.
- The browser build may show a `baseline-browser-mapping` warning. It is non-blocking.

## Recommended Submission Demo Path

1. Seed the app
2. Log in
3. Open a deck
4. Generate cards from a PDF
5. Open review
6. Rate a few cards
7. Show calendar -> review handoff
8. Show deck-specific review
