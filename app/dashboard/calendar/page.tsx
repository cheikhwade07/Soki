import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { fetchDeadlines } from '@/app/lib/data';
import { DeadlineCalendar } from '@/app/ui/dashboard/calendar';

export default async function Page() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect('/login');
    }

    const deadlines = await fetchDeadlines(userId);

    return (
        <div>
            <h1 className="text-xl font-bold mb-4">Calendar</h1>
            <DeadlineCalendar deadlines={deadlines} />
        </div>
    );
}