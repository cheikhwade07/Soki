import { BrainCogIcon } from 'lucide-react';
import { Suspense } from 'react';
import { BackButton } from '@/app/ui/back-button';
import SignupForm from '@/app/ui/signup-form';

export default function SignupPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[440px] flex-col space-y-2.5 p-4 md:-mt-20">
        <div className="flex justify-end">
          <BackButton />
        </div>
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            <BrainCogIcon />
          </div>
        </div>
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  );
}
