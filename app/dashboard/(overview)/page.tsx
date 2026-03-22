import { lusitana } from '@/app/ui/fonts';

export default async function Page() {
    return (
        <main>
            <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
                Dashboard
            </h1>
            <p className="max-w-2xl text-sm text-gray-600">
                Soki is still in MVP setup. Use Decks to manage study material,
                upload source PDFs, and prepare for the review flow.
            </p>
        </main>
    );
}
