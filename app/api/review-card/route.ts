import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

function mapFsrsState(state: string | null | undefined) {
  switch ((state ?? '').toLowerCase()) {
    case 'learning':
      return 'learning';
    case 'review':
      return 'review';
    case 'relearning':
      return 'relearning';
    default:
      return 'new';
  }
}

async function readJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function extractBackendError(payload: any) {
  if (typeof payload?.detail === 'string' && payload.detail) {
    return payload.detail;
  }

  if (typeof payload?.error === 'string' && payload.error) {
    return payload.error;
  }

  if (typeof payload?.raw === 'string' && payload.raw) {
    return payload.raw;
  }

  return 'Failed to review card.';
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_API_URL;

    if (!backendUrl) {
      return Response.json({ error: 'BACKEND_API_URL is not configured.' }, { status: 500 });
    }

    const body = await request.json();
    const cardId = String(body?.cardId ?? '');
    const rating = String(body?.rating ?? '').toLowerCase();
    const responseMs = typeof body?.responseMs === 'number' ? Math.max(0, Math.round(body.responseMs)) : null;

    if (!cardId) {
      return Response.json({ error: 'Missing cardId.' }, { status: 400 });
    }

    if (!['again', 'hard', 'good', 'easy'].includes(rating)) {
      return Response.json({ error: 'Invalid rating.' }, { status: 400 });
    }

    const rows = await sql<{
      card_id: string;
      deck_id: string;
      due_at: string;
      last_reviewed_at: string | null;
      stability: number;
      difficulty: number;
      elapsed_days: number;
      scheduled_days: number;
      reps: number;
      lapses: number;
      state: 'new' | 'learning' | 'review' | 'relearning';
    }[]>`
      SELECT
        rs.card_id,
        c.deck_id,
        rs.due_at,
        rs.last_reviewed_at,
        rs.stability,
        rs.difficulty,
        rs.elapsed_days,
        rs.scheduled_days,
        rs.reps,
        rs.lapses,
        rs.state
      FROM review_state rs
      JOIN cards c ON rs.card_id = c.card_id
      JOIN decks d ON c.deck_id = d.deck_id
      WHERE rs.card_id = ${cardId}
        AND rs.user_id = ${userId}
        AND d.user_id = ${userId}
    `;

    if (rows.length === 0) {
      return Response.json({ error: 'Card not found.' }, { status: 404 });
    }

    const current = rows[0];
    const backendPayload = {
      card_id: current.card_id,
      rating,
      response_ms: responseMs,
      review_state: {
        stability: current.stability,
        difficulty: current.difficulty,
        due: new Date(current.due_at).toISOString(),
        state: current.state,
        last_review: current.last_reviewed_at ? new Date(current.last_reviewed_at).toISOString() : null,
      },
    };

    let backendResponse: Response;

    try {
      backendResponse = await fetch(`${backendUrl}/review-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPayload),
      });
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error
              ? `Could not reach backend: ${error.message}`
              : 'Could not reach backend.',
        },
        { status: 502 },
      );
    }

    const backendResult = await readJsonSafely(backendResponse);

    if (!backendResponse.ok) {
      return Response.json({ error: extractBackendError(backendResult) }, { status: backendResponse.status });
    }

    const reviewState = backendResult?.review_state;
    const reviewLog = backendResult?.review_log;

    if (!reviewState?.due || !reviewState?.state) {
      return Response.json({ error: 'Backend returned an invalid review result.' }, { status: 502 });
    }

    const reviewedAt = reviewLog?.review_datetime ? new Date(reviewLog.review_datetime) : new Date();
    const nextDueAt = new Date(reviewState.due);
    const previousLastReview = current.last_reviewed_at ? new Date(current.last_reviewed_at) : null;
    const elapsedDays = previousLastReview
      ? Math.max(0, Math.round((reviewedAt.getTime() - previousLastReview.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const scheduledDays = Math.max(0, Math.round((nextDueAt.getTime() - reviewedAt.getTime()) / (1000 * 60 * 60 * 24)));
    const lapses = rating === 'again' ? current.lapses + 1 : current.lapses;

    await sql.begin(async (transaction) => {
      await transaction`
        UPDATE review_state
        SET
          due_at = ${nextDueAt},
          last_reviewed_at = ${reviewedAt},
          stability = ${reviewState.stability ?? current.stability},
          difficulty = ${reviewState.difficulty ?? current.difficulty},
          elapsed_days = ${elapsedDays},
          scheduled_days = ${scheduledDays},
          reps = ${current.reps + 1},
          lapses = ${lapses},
          state = ${mapFsrsState(reviewState.state)},
          updated_at = NOW()
        WHERE card_id = ${cardId}
          AND user_id = ${userId}
      `;

      await transaction`
        INSERT INTO review_events (
          card_id,
          user_id,
          rating,
          reviewed_at,
          previous_due_at,
          next_due_at,
          previous_stability,
          next_stability,
          previous_difficulty,
          next_difficulty,
          response_ms
        ) VALUES (
          ${cardId},
          ${userId},
          ${rating},
          ${reviewedAt},
          ${new Date(current.due_at)},
          ${nextDueAt},
          ${current.stability},
          ${reviewState.stability ?? current.stability},
          ${current.difficulty},
          ${reviewState.difficulty ?? current.difficulty},
          ${responseMs}
        )
      `;
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/calendar');
    revalidatePath('/dashboard/active_recall');
    revalidatePath(`/dashboard/decks/${current.deck_id}`);
    revalidatePath(`/dashboard/decks/${current.deck_id}/edit`);

    return Response.json({
      message: 'Review saved.',
      cardId,
      review_state: {
        due_at: nextDueAt.toISOString(),
        last_reviewed_at: reviewedAt.toISOString(),
        stability: reviewState.stability ?? current.stability,
        difficulty: reviewState.difficulty ?? current.difficulty,
        elapsed_days: elapsedDays,
        scheduled_days: scheduledDays,
        reps: current.reps + 1,
        lapses,
        state: mapFsrsState(reviewState.state),
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected server error.',
      },
      { status: 500 },
    );
  }
}
