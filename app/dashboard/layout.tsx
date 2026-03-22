import SideNav from '@/app/ui/dashboard/sidenav';

export default function Layout({ children }: { children: React.ReactNode }) {

    return (
        <div className="flex h-screen flex-col bg-[radial-gradient(circle_at_top,rgba(219,234,254,0.95),rgba(239,246,255,0.88)_34%,rgba(248,250,252,1)_72%)] md:flex-row md:overflow-hidden">
            <div className="w-full flex-none md:w-64">
                <SideNav />
            </div>
            <div className="grow p-6 md:overflow-y-auto md:p-10">
                <div className="mx-auto max-w-7xl">{children}</div>
            </div>
        </div>
    );
}
