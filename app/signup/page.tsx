import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, BrainCogIcon, Sparkles } from 'lucide-react';
import SignupForm from '@/app/ui/signup-form';

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(219,234,254,0.95),rgba(239,246,255,0.88)_36%,rgba(248,250,252,1)_72%)] px-4 py-8 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.05fr)_460px] lg:items-center">
        <section className="hidden rounded-[2rem] border border-blue-100 bg-white/70 p-10 shadow-[0_30px_70px_rgba(15,23,42,0.08)] backdrop-blur lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium uppercase tracking-[0.2em] text-blue-700">
            <Sparkles className="h-4 w-4" />
            Start stronger
          </div>
          <h1 className="mt-6 text-5xl font-semibold leading-tight text-slate-900">
            Create your account and start building a real study system.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Organize decks, generate cards from material, and turn review into a repeatable routine instead of a last-minute scramble.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-900">Upload and generate</p>
              <p className="mt-2 text-sm text-slate-600">Convert lecture material into cards without breaking your workflow.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-900">Review what is due</p>
              <p className="mt-2 text-sm text-slate-600">Study sessions stay focused on what actually needs attention.</p>
            </div>
          </div>
        </section>

        <div className="relative mx-auto flex w-full max-w-[460px] flex-col space-y-4">
          <div className="flex items-center justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex h-24 w-full items-center rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(15,23,42,1)_0%,rgba(37,99,235,0.92)_50%,rgba(125,211,252,0.8)_100%)] p-5 md:h-32">
              <div className="flex items-center gap-3 text-white">
                <BrainCogIcon className="h-8 w-8 md:h-10 md:w-10" />
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-blue-100">Soki</p>
                  <p className="text-lg font-semibold md:text-xl">Create account</p>
                </div>
              </div>
            </div>
            <div className="mt-5">
              <Suspense>
                <SignupForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
