import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import Soki from '@/app/ui/Soki';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from '@/auth';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-2 flex h-20 items-end justify-start rounded-[1.5rem] border border-blue-100 bg-[linear-gradient(145deg,rgba(15,23,42,0.98)_0%,rgba(29,78,216,0.92)_55%,rgba(125,211,252,0.78)_100%)] p-4 shadow-[0_22px_45px_rgba(15,23,42,0.12)] md:h-40"
        href="/"
      >
        <div className="w-32 text-white md:w-40">
          <Soki />
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 rounded-[1.5rem] border border-white/70 bg-white/65 p-2 shadow-[0_22px_40px_rgba(15,23,42,0.05)] backdrop-blur md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-[1rem] bg-[linear-gradient(180deg,rgba(239,246,255,0.62)_0%,rgba(248,250,252,0.38)_100%)] md:block"></div>
        <form
            action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
            }}>
          <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-xl border border-transparent bg-white/70 p-3 text-sm font-medium text-slate-700 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
            <PowerIcon className="w-6" />
            <div className="hidden md:block">Sign Out</div>
          </button>
        </form>
      </div>
    </div>
  );
}
