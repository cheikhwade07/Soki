import { auth } from '@/auth';
import { fetchReviewQueue } from '@/app/lib/data';
import { ReviewSession } from '@/app/ui/dashboard/review-session';
import { redirect } from 'next/navigation';

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ cardId?: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect('/login');
    }

    const params = await searchParams;
    const queue = await fetchReviewQueue(userId);

    return <ReviewSession queue={queue} initialCardId={params?.cardId} />;
}
