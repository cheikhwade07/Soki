import { auth } from '@/auth';
import { createDeckAction } from '@/app/lib/action';
import { BackButton } from '@/app/ui/back-button';
import { redirect } from 'next/navigation';

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ parentDeckId?: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect('/login');
    }

    const params = await searchParams;
    const parentDeckId = params?.parentDeckId;
    const isNestedDeck = Boolean(parentDeckId);

    return (
        <section className="max-w-3xl space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-blue-500">
                    {isNestedDeck ? 'Create Deck' : 'Create Deck'}
                    </h1>
                    <p className="text-sm text-gray-600">
                        {isNestedDeck
                            ? 'This deck will be created immediately inside the selected deck.'
                            : 'Top-level decks are created immediately and become the main containers for cards and nested decks.'}
                    </p>
                </div>
                <BackButton />
            </div>

            <form action={createDeckAction} className="space-y-4 rounded-2xl bg-gray-50 p-6 shadow-sm">
                <input type="hidden" name="parentDeckId" value={parentDeckId ?? ''} />
                <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                    </label>
                    <input
                        id="title"
                        name="title"
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                        placeholder={isNestedDeck ? 'e.g. Midterm Practice' : 'e.g. Biology 101'}
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                        placeholder="Optional deck description"
                    />
                </div>
                <button
                    type="submit"
                    className="rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white hover:bg-blue-400"
                >
                    {isNestedDeck ? 'Create Deck' : 'Create Deck'}
                </button>
            </form>
        </section>
    );
}
