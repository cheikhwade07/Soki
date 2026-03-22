'use client';

import { lusitana } from '@/app/ui/fonts';
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@/app/ui/button';
import { useActionState } from 'react';
import { authenticate } from '@/app/lib/action'
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [errorMessage, formAction, isPending] = useActionState(
      authenticate,
      undefined,
  );

  return (
      <form action={formAction} className="space-y-3">
        <div className="flex-1 rounded-[1.5rem] bg-slate-50 px-6 pb-5 pt-8">
          <h1 className={`${lusitana.className} mb-3 text-3xl text-slate-900`}>
            Log in to continue.
          </h1>
          <p className="mb-5 text-sm leading-6 text-slate-600">
            Access your decks, active recall sessions, and scheduled review queue.
          </p>
          <div className="w-full">
            <div>
              <label
                  className="mb-3 mt-5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-700"
                  htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <input
                    className="peer block w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 text-sm outline-2 placeholder:text-gray-400"
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    required
                />
                <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
            </div>
            <div className="mt-4">
              <label
                  className="mb-3 mt-5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-700"
                  htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                    className="peer block w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 text-sm outline-2 placeholder:text-gray-400"
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    required
                    minLength={6}
                />
                <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
            </div>
          </div>
          <input type="hidden" name="redirectTo" value={callbackUrl} />
          <Button className="mt-4 w-full" aria-disabled={isPending}>
            Log in <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
          </Button>
          <div
              className="flex h-8 items-end space-x-1"
              aria-live="polite"
              aria-atomic="true"
          >
            {errorMessage && (
                <>
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-500">{errorMessage}</p>
                </>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>
              Need an account?{' '}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
            <Link href="/" className="font-medium text-slate-500 hover:text-slate-900">
              Back to home
            </Link>
          </div>
        </div>
      </form>
  );
}
