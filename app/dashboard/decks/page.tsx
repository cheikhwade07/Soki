
// app/dashboard/decks/page.tsx — show all top-level decks
import { auth } from '@/auth';
import { fetchDecks } from '@/app/lib/data';
import { redirect } from 'next/navigation';
import { DeckList } from'@/app/ui/dashboard/deck';

export default async function Page() {
    const session = await auth();
    console.log("SESSION:", JSON.stringify(session));
    const userId = session?.user?.id;
    console.log("USER ID:", userId);

    if (!userId) {
        console.log("No userId, redirecting");
        redirect('/login');
    }

    const decks = await fetchDecks(userId);

    return (
        <div>
            <h1 className="text-xl font-bold mb-4">My Decks</h1>
            <DeckList decks={decks} />
        </div>
    );
}