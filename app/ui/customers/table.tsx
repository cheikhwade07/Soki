import { lusitana } from '@/app/ui/fonts';

export default async function CustomersTable() {
    return (
        <div className="w-full rounded-xl bg-gray-50 p-6 shadow-sm">
            <h1 className={`${lusitana.className} mb-2 text-xl md:text-2xl`}>
                Placeholder
            </h1>
            <p className="text-sm text-gray-600">
                This starter-template customer table is not part of the Soki study
                product and has been reduced to a safe placeholder.
            </p>
        </div>
    );
}
