
// app/dashboard/decks/page.tsx — show all top-level decks
import { auth } from '@/auth';
import { fetchDecks } from '@/app/lib/data';
import { redirect } from 'next/navigation';
import { DeckList } from'@/app/ui/dashboard/deck';
import {FolderPlus, LogIn} from 'lucide-react'
import Link from "next/link";

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
            <div className="flex items-center justify-between mb-4  ">
                <h1 className="text-xl font-bold mb-4 text-blue-500">My Decks</h1>
                <Link
                    href="/dashboard/decks/new"
                    className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
                >
                    <FolderPlus/>
                </Link>
            </div>

            <DeckList decks={decks} />
        </div>
    );
}