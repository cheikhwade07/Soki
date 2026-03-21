import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col ">
      <div className="flex shrink-0 items-start justify-start border-b border-slate-300/90 px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.12)] md:px-6 md:py-4">
        <Image
          src="/new_logo.svg"
          alt="MindHack logo"
          width={760}
          height={760}
          className="h-20 w-auto object-contain md:h-28"
          priority
        />
      </div>
      <div className="flex flex-col h-screen">
        <div className=" rounded-lg bg-purple-400-50 px-50 py-10 ">
          <p
            className={`${lusitana.className} text-xl text-gray-800 md:text-3xl md:leading-normal`}
          >
            <strong>Welcome to Memory retrieval Assistant.</strong> This is a prototype for a Space repetition software with the goal to help you learn through Memory recall  {' '}
            <a href="https://www.sciencedirect.com/science/article/pii/S2211124725000038" className="text-blue-500">
              Learn more about the topic here
            </a>
          </p>
          <br />
          <br />
          <Link
            href="/dashboard"
            className="flex items-center gap-10 self-start rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
          >
            <span>Start Now</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
          <></>
        </div>
        <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
        </div>
      </div>
    </main>
  );
}
