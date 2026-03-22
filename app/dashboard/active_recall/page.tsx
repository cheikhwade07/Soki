import { auth } from '@/auth';
import { fetchDeckById, fetchReviewQueue } from '@/app/lib/data';
import { ReviewSession } from '@/app/ui/dashboard/review-session';
import { notFound, redirect } from 'next/navigation';

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ cardId?: string; deckId?: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect('/login');
    }

    const params = await searchParams;
    const deckId = params?.deckId;

    if (deckId) {
        const deck = await fetchDeckById(deckId, userId);

        if (!deck) {
            notFound();
        }
    }

    const queue = await fetchReviewQueue(userId, deckId);

    return <ReviewSession queue={queue} initialCardId={params?.cardId} />;
}
