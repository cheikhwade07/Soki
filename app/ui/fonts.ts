import { Inter, Lusitana, Noto_Serif_JP } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'] });

export const lusitana = Lusitana({
    weight: ['400', '700'],
    subsets: ['latin'],
});

export const notoSerifJp = Noto_Serif_JP({
    weight: ['700'],
    subsets: ['latin'],
});
