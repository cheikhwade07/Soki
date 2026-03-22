'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { lusitana } from '@/app/ui/fonts';
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@/app/ui/button';

export default function SignupForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setErrorMessage(data.error ?? 'Something went wrong.');
        return;
      }

      setSuccessMessage('Account created. Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 800);
    } catch {
      setErrorMessage('Something went wrong.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-3"
    >
      <div className="flex-1 rounded-[1.5rem] bg-slate-50 px-6 pb-5 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-3xl text-slate-900`}>
          Create your account.
        </h1>
        <p className="mb-5 text-sm leading-6 text-slate-600">
          Start building decks and turn your notes into active recall practice.
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
                placeholder="Create a password"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>
        <Button className="mt-6 w-full" aria-disabled={isPending} disabled={isPending}>
          {isPending ? 'Creating account...' : 'Get Started'}
          <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>
        <div
          className="mt-3 flex min-h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
          {successMessage && (
            <>
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-600">{successMessage}</p>
            </>
          )}
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-500 hover:text-blue-400">
            Log in
          </Link>
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Want to explore first?{' '}
          <Link href="/" className="font-medium text-slate-700 hover:text-slate-900">
            Back to home
          </Link>
        </p>
      </div>
    </form>
  );
}
