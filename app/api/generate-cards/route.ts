import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });
const DAILY_UPLOAD_LIMIT = 5;

async function ensureGenerationUploadsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS generation_uploads (
      generation_upload_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      deck_id UUID NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

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
  const detail = payload?.detail;

  if (typeof detail === 'string' && detail) {
    return detail;
  }

  if (detail && typeof detail === 'object') {
    const summary = typeof detail.error === 'string' ? detail.error : 'Failed to generate cards.';
    const parsedCount =
      typeof detail.parsed_section_count === 'number'
        ? ` Parsed sections: ${detail.parsed_section_count}.`
        : '';
    const failedCount =
      typeof detail.failed_section_count === 'number'
        ? ` Failed sections: ${detail.failed_section_count}.`
        : '';
    const firstFailure =
      Array.isArray(detail.failures) && detail.failures.length > 0
        ? ` First issue: ${detail.failures[0].title}: ${detail.failures[0].error}`
        : '';

    return `${summary}${parsedCount}${failedCount}${firstFailure}`.trim();
  }

  if (typeof payload?.error === 'string' && payload.error) {
    return payload.error;
  }

  if (typeof payload?.raw === 'string' && payload.raw) {
    return payload.raw;
  }

  return 'Failed to generate cards.';
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_API_URL;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!backendUrl) {
      return Response.json({ error: 'BACKEND_API_URL is not configured.' }, { status: 500 });
    }

    if (!geminiApiKey) {
      return Response.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const formData = await request.formData();
    const deckId = String(formData.get('deckId') ?? '');
    const file = formData.get('file');

    if (!deckId) {
      return Response.json({ error: 'Missing deckId.' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return Response.json({ error: 'Missing file.' }, { status: 400 });
    }

    await ensureGenerationUploadsTable();

    const deckResult = await sql<{ deck_id: string; deck_kind: 'container' | 'cards' | null }[]>`
      SELECT deck_id, deck_kind
      FROM decks
      WHERE deck_id = ${deckId}
        AND user_id = ${userId}
    `;

    if (deckResult.length === 0) {
      return Response.json({ error: 'Deck not found.' }, { status: 404 });
    }

    if (deckResult[0].deck_kind === 'container') {
      return Response.json({ error: 'This deck stores decks and cannot accept cards.' }, { status: 400 });
    }

    const uploadCountResult = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM generation_uploads
      WHERE user_id = ${userId}
        AND created_at >= date_trunc('day', NOW())
    `;

    const uploadsToday = Number(uploadCountResult[0]?.count ?? '0');

    if (uploadsToday >= DAILY_UPLOAD_LIMIT) {
      return Response.json(
        {
          error:
            'Daily upload limit reached. Uploads are currently limited to 5 per day while the generation system is still in beta.',
        },
        { status: 429 },
      );
    }

    const backendForm = new FormData();
    backendForm.append('file', file);
    backendForm.append('api_key', geminiApiKey);

    let backendResponse: Response;

    try {
      backendResponse = await fetch(`${backendUrl}/generate-cards`, {
        method: 'POST',
        body: backendForm,
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

    const backendPayload = await readJsonSafely(backendResponse);

    if (!backendResponse.ok) {
      return Response.json(
        {
          error: extractBackendError(backendPayload),
        },
        { status: backendResponse.status },
      );
    }

    const cards = Array.isArray(backendPayload?.cards) ? backendPayload.cards : [];

    if (cards.length === 0) {
      return Response.json({ error: 'No cards were generated.' }, { status: 400 });
    }

    await sql.begin(async (transaction) => {
      if (deckResult[0].deck_kind === null) {
        await transaction`
          UPDATE decks
          SET deck_kind = 'cards'
          WHERE deck_id = ${deckId}
            AND user_id = ${userId}
        `;
      }

      for (const card of cards) {
        const createdCard = await transaction<{ card_id: string }[]>`
          INSERT INTO cards (deck_id, card_type, front, back)
          VALUES (
            ${deckId},
            ${card.card_type ?? 'flashcard'},
            ${card.front ?? ''},
            ${card.back ?? ''}
          )
          RETURNING card_id
        `;

        const reviewState = card.review_state ?? {};

        await transaction`
          INSERT INTO review_state (
            card_id,
            user_id,
            due_at,
            last_reviewed_at,
            stability,
            difficulty,
            elapsed_days,
            scheduled_days,
            reps,
            lapses,
            state
          ) VALUES (
            ${createdCard[0].card_id},
            ${userId},
            ${reviewState.due ? new Date(reviewState.due) : new Date()},
            ${reviewState.last_review ? new Date(reviewState.last_review) : null},
            ${reviewState.stability ?? 0},
            ${reviewState.difficulty ?? 5},
            0,
            0,
            0,
            0,
            ${mapFsrsState(reviewState.state)}
          )
        `;
      }

      await transaction`
        INSERT INTO generation_uploads (user_id, deck_id, file_name)
        VALUES (${userId}, ${deckId}, ${file.name})
      `;
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/calendar');
    revalidatePath('/dashboard/decks');
    revalidatePath(`/dashboard/decks/${deckId}`);
    revalidatePath(`/dashboard/decks/${deckId}/edit`);

    return Response.json({
      message: 'Cards generated and saved.',
      count: cards.length,
      uploadsRemainingToday: DAILY_UPLOAD_LIMIT - uploadsToday - 1,
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
