'use client';

import {
  HomeIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import clsx from 'clsx';
import { BrainCircuit, Folders } from 'lucide-react';
import { usePathname } from 'next/navigation';

const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Decks', href: '/dashboard/decks', icon: Folders },
  { name: 'Review', href: '/dashboard/active_recall', icon: BrainCircuit },
  { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarIcon },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[52px] grow items-center justify-center gap-2 rounded-xl border border-transparent bg-white/70 p-3 text-sm font-medium text-slate-700 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-blue-600 md:flex-none md:justify-start md:px-4',
              {
                'border-sky-200 bg-sky-50 text-blue-600 shadow-sm': pathname === link.href,
              },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
