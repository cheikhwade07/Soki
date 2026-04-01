# Soki

Soki is a memory-focused study app built around active recall and spaced repetition. It turns lecture material into reviewable cards, organizes them into decks, and schedules future review with an FSRS-backed loop.

Live app:
- https://soki-eight.vercel.app/

Core flow:
- create decks
- add cards manually or generate them from a PDF
- review only due cards
- rate each review with `Again`, `Hard`, `Good`, or `Easy`
- schedule future reviews with an FSRS-backed review loop

## Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Auth: `next-auth`
- Database: Postgres / Neon
- Backend API: FastAPI in `Backend.py`
- AI generation: Gemini API
- Scheduling: `fsrs` Python library
- Runtime / deployment:
  - Node.js for the Next.js app
  - Vercel for frontend deployment
  - separate Python web service deployment for FastAPI

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
- [auth.ts](/C:/Users/seydi/OneDrive/Desktop/Winter%202026/MindHack/Soki/auth.ts)
  - Auth.js / NextAuth setup
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

Create your own `.env` locally. Do not use the maintainer's database or secrets.

Minimum local setup:

```env
POSTGRES_URL=postgresql://<your-user>:<your-password>@<your-host>/<your-db>?sslmode=require
AUTH_SECRET=<your-own-random-secret>
NEXTAUTH_URL=http://localhost:3000
BACKEND_API_URL=http://127.0.0.1:8000
GEMINI_API_KEY=<your-own-gemini-key>
```

Important:
- each developer should use their own Postgres database
- each developer should use their own auth secret
- each developer should use their own Gemini key
- do not commit real credentials
- if a key or password was exposed, rotate it immediately

## Database Setup

If you build the app locally, it should use **your own database**, not the maintainer's database.

Recommended options:
- create your own Neon project and copy its connection string into `POSTGRES_URL`
- or run a local Postgres instance and point `POSTGRES_URL` at it

Why:
- local `/seed` drops and recreates tables
- using someone else's database would overwrite their data
- a shared dev database creates auth and data conflicts

So yes: every user cloning the repo should set up their own Postgres database first.

## Local Run Process

### 1. Install frontend dependencies

```bash
pnpm install
```

### 2. Set up Python environment

If you do not already have `.venv`:

```bash
python -m venv .venv
```

Then install backend dependencies:

```bash
.\.venv\Scripts\python -m pip install -r requirements.txt
```

### 3. Create and fill `.env`

Add your own:
- `POSTGRES_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `BACKEND_API_URL`
- `GEMINI_API_KEY`

### 4. Start the app locally

This repo is set up so `pnpm dev` runs both services in parallel:

```bash
pnpm dev
```

That starts:
- Next.js frontend on `http://localhost:3000`
- FastAPI backend on `http://127.0.0.1:8000`

Swagger docs:
- `http://127.0.0.1:8000/docs`

### 5. Seed your local database

Once your local app is running, open:

```text
http://localhost:3000/seed?confirm=RESET_SOKI_DEMO_DATA
```

This drops existing app tables and recreates the demo dataset in **your own database**.

Safety note:
- `/seed` is destructive
- it drops and recreates the app tables in whatever database `POSTGRES_URL` points to
- the route now requires the explicit confirmation token `RESET_SOKI_DEMO_DATA`
- if you visit `/seed` without confirmation, the app will show a warning and the target database host instead of wiping data

## Production Deployment Notes

Frontend:
- deploy the Next.js app to Vercel

Backend:
- deploy `Backend.py` as a separate Python web service
- set its start command to:

```bash
uvicorn Backend:app --host 0.0.0.0 --port $PORT
```

Then point Vercel at the deployed backend:

```env
BACKEND_API_URL=https://your-fastapi-service.example.com
```

## Development Seed

`/seed` recreates:
- users
- decks
- cards
- review_state
- review_events

Demo users seeded locally:

```text
new@soki.com / 123456
power@soki.com / 123456
```

Safe usage:

```text
/seed?confirm=RESET_SOKI_DEMO_DATA
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
