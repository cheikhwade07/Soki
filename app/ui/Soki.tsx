import { BrainCog } from 'lucide-react';
import { lusitana } from '@/app/ui/fonts';

export default function Soki() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <BrainCog className="h-11 w-11" />
      <p className="text-[44px]">Soki</p>
    </div>
  );
}
