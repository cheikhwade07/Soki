'use server';

import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { z } from 'zod';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

function requireUserId(sessionUserId: string | undefined) {
    if (!sessionUserId) {
        throw new Error('Unauthorized');
    }

    return sessionUserId;
}

async function reconcileDeckKind(deckId: string, userId: string) {
    const counts = await sql<{ subdeck_count: number; card_count: number }[]>`
      SELECT
        (SELECT COUNT(*) FROM decks WHERE parent_deck_id = ${deckId})::int AS subdeck_count,
        (SELECT COUNT(*) FROM cards WHERE deck_id = ${deckId})::int AS card_count
    `;

    const { subdeck_count, card_count } = counts[0];
    const nextKind =
        subdeck_count > 0 ? 'container' : card_count > 0 ? 'cards' : null;

    await sql`
      UPDATE decks
      SET deck_kind = ${nextKind}
      WHERE deck_id = ${deckId}
        AND user_id = ${userId}
    `;
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function createDeckAction(formData: FormData) {
    const session = await auth();
    const userId = requireUserId(session?.user?.id);

    const parsed = z.object({
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        parentDeckId: z.string().trim().optional(),
    }).parse({
        title: formData.get('title'),
        description: formData.get('description') || undefined,
        parentDeckId: formData.get('parentDeckId') || undefined,
    });

    if (parsed.parentDeckId) {
        const parentDeck = await sql<{ deck_kind: 'container' | 'cards' | null }[]>`
          SELECT deck_kind
          FROM decks
          WHERE deck_id = ${parsed.parentDeckId}
            AND user_id = ${userId}
        `;

        if (parentDeck.length === 0) {
            throw new Error('Parent deck not found.');
        }

        if (parentDeck[0].deck_kind === 'cards') {
            throw new Error('This deck already stores cards and cannot contain subdecks.');
        }

        if (parentDeck[0].deck_kind === null) {
            await sql`
              UPDATE decks
              SET deck_kind = 'container'
              WHERE deck_id = ${parsed.parentDeckId}
                AND user_id = ${userId}
            `;
        }
    }

    const result = await sql<{ deck_id: string }[]>`
      INSERT INTO decks (user_id, parent_deck_id, deck_kind, title, description)
      VALUES (
        ${userId},
        ${parsed.parentDeckId || null},
        null,
        ${parsed.title},
        ${parsed.description || null}
      )
      RETURNING deck_id
    `;

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/decks');
    if (parsed.parentDeckId) {
        revalidatePath(`/dashboard/decks/${parsed.parentDeckId}`);
    }

    redirect(`/dashboard/decks/${result[0].deck_id}`);
}

export async function updateDeckAction(formData: FormData) {
    const session = await auth();
    const userId = requireUserId(session?.user?.id);

    const parsed = z.object({
        deckId: z.string().uuid(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
    }).parse({
        deckId: formData.get('deckId'),
        title: formData.get('title'),
        description: formData.get('description') || undefined,
    });

    await sql`
      UPDATE decks
      SET title = ${parsed.title},
          description = ${parsed.description || null}
      WHERE deck_id = ${parsed.deckId}
        AND user_id = ${userId}
    `;

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/decks');
    revalidatePath(`/dashboard/decks/${parsed.deckId}`);
}

export async function deleteDeckAction(formData: FormData) {
    const session = await auth();
    const userId = requireUserId(session?.user?.id);

    const deckId = z.string().uuid().parse(formData.get('deckId'));
    const redirectTo = z.string().optional().parse(formData.get('redirectTo') || undefined);

    const parentDeck = await sql<{ parent_deck_id: string | null }[]>`
      SELECT parent_deck_id
      FROM decks
      WHERE deck_id = ${deckId}
        AND user_id = ${userId}
    `;

    await sql`
      DELETE FROM decks
      WHERE deck_id = ${deckId}
        AND user_id = ${userId}
    `;

    if (parentDeck[0]?.parent_deck_id) {
        await reconcileDeckKind(parentDeck[0].parent_deck_id, userId);
        revalidatePath(`/dashboard/decks/${parentDeck[0].parent_deck_id}`);
        revalidatePath(`/dashboard/decks/${parentDeck[0].parent_deck_id}/edit`);
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/decks');
    redirect(redirectTo || '/dashboard/decks');
}

export async function createCardAction(formData: FormData) {
    const session = await auth();
    const userId = requireUserId(session?.user?.id);

    const parsed = z.object({
        deckId: z.string().uuid(),
        cardType: z.enum(['flashcard', 'mcq', 'methodology']).default('flashcard'),
        front: z.string().trim().min(1),
        back: z.string().trim().min(1),
    }).parse({
        deckId: formData.get('deckId'),
        cardType: formData.get('cardType') || 'flashcard',
        front: formData.get('front'),
        back: formData.get('back'),
    });

    const ownership = await sql<{ deck_id: string }[]>`
      SELECT deck_id
      FROM decks
      WHERE deck_id = ${parsed.deckId}
        AND user_id = ${userId}
    `;

    if (ownership.length === 0) {
        throw new Error('Deck not found.');
    }

    const deckKindResult = await sql<{ deck_kind: 'container' | 'cards' | null }[]>`
      SELECT deck_kind
      FROM decks
      WHERE deck_id = ${parsed.deckId}
        AND user_id = ${userId}
    `;

    if (deckKindResult[0].deck_kind === 'container') {
        throw new Error('This deck already stores subdecks and cannot contain cards.');
    }

    if (deckKindResult[0].deck_kind === null) {
        await sql`
          UPDATE decks
          SET deck_kind = 'cards'
          WHERE deck_id = ${parsed.deckId}
            AND user_id = ${userId}
        `;
    }

    const createdCard = await sql<{ card_id: string }[]>`
      INSERT INTO cards (deck_id, card_type, front, back)
      VALUES (${parsed.deckId}, ${parsed.cardType}, ${parsed.front}, ${parsed.back})
      RETURNING card_id
    `;

    await sql`
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
        NOW(),
        NULL,
        0,
        5,
        0,
        0,
        0,
        0,
        'new'
      )
    `;

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/calendar');
    revalidatePath(`/dashboard/decks/${parsed.deckId}`);
    revalidatePath(`/dashboard/decks/${parsed.deckId}/edit`);
}

export async function updateCardAction(formData: FormData) {
    const session = await auth();
    const userId = requireUserId(session?.user?.id);

    const parsed = z.object({
        cardId: z.string().uuid(),
        front: z.string().trim().min(1),
        back: z.string().trim().min(1),
        cardType: z.enum(['flashcard', 'mcq', 'methodology']).default('flashcard'),
        deckId: z.string().uuid(),
    }).parse({
        cardId: formData.get('cardId'),
        front: formData.get('front'),
        back: formData.get('back'),
        cardType: formData.get('cardType') || 'flashcard',
        deckId: formData.get('deckId'),
    });

    await sql`
      UPDATE cards c
      SET front = ${parsed.front},
          back = ${parsed.back},
          card_type = ${parsed.cardType},
          updated_at = NOW()
      FROM decks d
      WHERE c.card_id = ${parsed.cardId}
        AND c.deck_id = d.deck_id
        AND d.deck_id = ${parsed.deckId}
        AND d.user_id = ${userId}
    `;

    revalidatePath(`/dashboard/decks/${parsed.deckId}`);
    revalidatePath(`/dashboard/decks/${parsed.deckId}/edit`);
    revalidatePath('/dashboard/active_recall');
}

export async function deleteCardAction(formData: FormData) {
    const session = await auth();
    const userId = requireUserId(session?.user?.id);

    const parsed = z.object({
        cardId: z.string().uuid(),
        deckId: z.string().uuid(),
    }).parse({
        cardId: formData.get('cardId'),
        deckId: formData.get('deckId'),
    });

    await sql`
      DELETE FROM cards c
      USING decks d
      WHERE c.card_id = ${parsed.cardId}
        AND c.deck_id = d.deck_id
        AND d.deck_id = ${parsed.deckId}
        AND d.user_id = ${userId}
    `;

    await reconcileDeckKind(parsed.deckId, userId);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/calendar');
    revalidatePath(`/dashboard/decks/${parsed.deckId}`);
    revalidatePath(`/dashboard/decks/${parsed.deckId}/edit`);
}
