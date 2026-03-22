'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowPathRoundedSquareIcon,
  ArrowRightIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { lusitana, notoSerifJp } from '@/app/ui/fonts';
//import Image from 'next/image';
import {Brain} from 'lucide-react'


const studyCards = [
  {
    title: 'Spaced Repetition',
    body: 'Improves long-term retention by reinforcing memory at optimal intervals.',
  },
  {
    title: 'Active Recall',
    body: 'Testing yourself strengthens memory more than rereading notes.',
  },
  {
    title: 'Efficient Learning',
    body: 'Study what matters most, when it matters most.',
  },
];

const studyFlowSteps = [
  {
    title: 'Upload Notes',
    description: 'Upload your notes or study material',
    Icon: ArrowUpTrayIcon,
  },
  {
    title: 'AI Creates Plan',
    description: 'AI analyzes and builds a personalized study plan',
    Icon: SparklesIcon,
  },
  {
    title: 'Smart Review',
    description: 'Review material at optimal times using spaced repetition',
    Icon: ArrowPathRoundedSquareIcon,
  },
];

export default function Page() {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const targetProgressRef = useRef(0);
  const animatedProgressRef = useRef(0);

  const toggleCard = (cardName: string) => {
    setFlippedCards((current) => ({
      ...current,
      [cardName]: !current[cardName],
    }));
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let frameId = 0;

    const animate = () => {
      const delta = targetProgressRef.current - animatedProgressRef.current;
      animatedProgressRef.current += delta * 0.18;

      if (Math.abs(delta) < 0.0008) {
        animatedProgressRef.current = targetProgressRef.current;
      }

      setScrollProgress(animatedProgressRef.current);
      frameId = window.requestAnimationFrame(animate);
    };

    const handleScroll = () => {
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const nextProgress = Math.min(1, window.scrollY / maxScroll);
      targetProgressRef.current = nextProgress;
      setIsScrolling(true);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => setIsScrolling(false), 360);
    };

    handleScroll();
    frameId = window.requestAnimationFrame(animate);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(frameId);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col ">
      <div className="relative z-10 flex shrink-0 items-start justify-between border-b border-slate-300/80 bg-white px-2 py-0 shadow-[0_12px_28px_rgba(15,23,42,0.22)] md:px-3 md:py-0">
        <div className="flex items-center justify-start gap-2 md:gap-3">
          <Brain className="h-7 w-7 text-blue-900 md:h-9 md:w-9" />
          <span
            className={`${notoSerifJp.className} text-xl font-bold tracking-[0.01em] text-blue-900 md:text-3xl`}
          >
            SOKI
          </span>
        </div>
        <details className="relative mr-1 self-center">
          <summary className="flex cursor-pointer list-none flex-col gap-1 rounded-md px-2 py-0.5 transition-colors hover:bg-slate-100">
            <span className="h-1 w-7 rounded-full bg-blue-800" />
            <span className="h-1 w-7 rounded-full bg-blue-800" />
            <span className="h-1 w-7 rounded-full bg-blue-800" />
          </summary>
          <div className="absolute right-0 top-full z-10 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-lg">
            <div className="space-y-2">
              <Link
                href="/#about"
                className="block rounded-md px-3 py-2 transition-colors hover:bg-slate-50"
              >
                <p className="font-medium text-slate-900">About us</p>
              </Link>
              <Link
                href="/signup"
                className="block rounded-md px-3 py-2 transition-colors hover:bg-slate-50"
              >
                <p className="font-medium text-slate-900">Get started</p>
              </Link>
            </div>
          </div>
        </details>
      </div>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(221,232,249,0.82)_0%,rgba(232,239,251,0.72)_48%,rgba(240,245,252,0.9)_100%)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute right-[22%] -top-[12%] h-[138%] w-24 -rotate-[14deg] bg-[linear-gradient(180deg,rgba(191,219,254,0.04)_0%,rgba(191,219,254,0.16)_48%,rgba(191,219,254,0.08)_100%)]"
            style={{
              transform: `translateY(${scrollProgress * 34}px) rotate(-14deg)`,
              willChange: 'transform',
            }}
          />
          <div
            className="absolute right-[26%] -top-[12%] h-[138%] w-10 -rotate-[14deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(219,234,254,0.22)_50%,rgba(219,234,254,0.08)_100%)]"
            style={{
              transform: `translateY(${scrollProgress * 26}px) rotate(-14deg)`,
              willChange: 'transform',
            }}
          />
          <div
            className="absolute -right-12 -top-[8%] h-[128%] w-28 -rotate-[14deg] bg-[linear-gradient(180deg,rgba(191,219,254,0.06)_0%,rgba(191,219,254,0.2)_45%,rgba(148,163,184,0.1)_100%)]"
            style={{
              transform: `translateY(${scrollProgress * 42}px) rotate(-14deg)`,
              willChange: 'transform',
            }}
          />
          <div
            className="absolute right-10 -top-[10%] h-[132%] w-16 -rotate-[14deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(219,234,254,0.34)_50%,rgba(191,219,254,0.12)_100%)]"
            style={{
              transform: `translateY(${scrollProgress * 28}px) rotate(-14deg)`,
              willChange: 'transform',
            }}
          />
          <svg
            viewBox="0 0 1440 1200"
            preserveAspectRatio="none"
            className="h-full w-full opacity-50"
          >
            <rect width="1440" height="1200" fill="url(#bgGlow)" />
            <g
              opacity={0.92 - scrollProgress * 0.08}
              style={{
                transform: `translate(${scrollProgress * -118}px, ${scrollProgress * 92}px) scale(${1 + scrollProgress * 0.12})`,
                transformOrigin: 'center',
                willChange: 'transform, opacity',
              }}
            >
              <path
                d="M-420 246 C -186 42, 64 12, 308 166 L 930 814 C 1020 910, 1120 1016, 1242 1200 L 1386 1200 C 1244 988, 1136 872, 1040 770 L 382 66 C 144 -176, -106 -154, -420 138 Z"
                fill="rgba(30,58,138,0.14)"
              />
              <path
                d="M-372 270 C -148 90, 52 84, 280 218 L 888 842 C 974 934, 1072 1034, 1186 1200 L 1296 1200 C 1168 1012, 1064 898, 970 798 L 338 126 C 112 -108, -86 -106, -372 170 Z"
                fill="rgba(30,64,175,0.1)"
              />
              <path
                d="M-330 298 C -104 138, 70 144, 258 254 L 848 848 C 928 934, 1016 1032, 1122 1200 L 1202 1200 C 1080 1008, 984 896, 894 800 L 322 182 C 132 -10, -24 -4, -330 194 Z"
                fill="rgba(37,99,235,0.08)"
              />
              <path
                d="M744 -94 C 646 8, 648 134, 762 246 L 1176 654 C 1264 742, 1342 850, 1414 1200 L 1498 1200 C 1430 786, 1324 656, 1182 542 L 810 174 C 712 76, 704 -8, 774 -94 Z"
                fill="rgba(30,58,138,0.14)"
              />
              <path
                d="M792 -110 C 708 -24, 714 90, 810 190 L 1226 620 C 1312 710, 1394 822, 1470 1200 L 1542 1200 C 1466 772, 1360 632, 1224 514 L 860 148 C 776 64, 772 -16, 830 -110 Z"
                fill="rgba(30,64,175,0.1)"
              />
              <path
                d="M838 -118 C 772 -34, 780 70, 872 164 L 1288 588 C 1370 676, 1456 794, 1534 1200 L 1596 1200 C 1514 746, 1406 594, 1278 476 L 922 120 C 846 44, 844 -24, 886 -118 Z"
                fill="rgba(59,130,246,0.07)"
              />
              <path
                d="M980 -40 C 1106 88, 1110 192, 986 312 C 930 368, 900 418, 900 472 C 900 522, 930 576, 992 642 L 1370 1044 C 1428 1106, 1474 1170, 1510 1200 L 1610 1200 C 1554 1158, 1490 1092, 1412 1008 L 1044 612 C 988 552, 962 506, 962 468 C 962 428, 988 382, 1040 330 C 1188 184, 1180 62, 1052 -40 Z"
                fill="rgba(15,78,160,0.12)"
              />
              <path
                d="M1028 -58 C 1142 54, 1146 164, 1038 274 C 984 330, 956 382, 956 438 C 956 492, 986 548, 1048 612 L 1428 1018 C 1492 1084, 1548 1146, 1602 1200 L 1678 1200 C 1598 1132, 1518 1050, 1450 980 L 1092 592 C 1032 528, 1010 486, 1010 446 C 1010 410, 1036 364, 1084 314 C 1216 176, 1210 72, 1098 -58 Z"
                fill="rgba(30,58,138,0.1)"
              />
            </g>
            <g
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
              style={{
                transform: `translate(${scrollProgress * 78}px, ${scrollProgress * 58}px)`,
                transformOrigin: 'center',
                willChange: 'transform',
              }}
            >
              <path d="M-138 128 C 8 -6, 168 -4, 312 150 L 888 798 C 974 890, 1076 1002, 1196 1200" stroke="rgba(59,130,246,0.08)" />
              <path d="M-92 186 C 38 74, 172 82, 292 210 L 848 800 C 930 888, 1020 992, 1134 1200" stroke="rgba(96,165,250,0.07)" />
              <path d="M792 -110 C 708 -24, 714 90, 810 190 L 1226 620 C 1312 710, 1394 822, 1470 1200" stroke="rgba(59,130,246,0.06)" />
              <path d="M838 -118 C 772 -34, 780 70, 872 164 L 1288 588 C 1370 676, 1456 794, 1534 1200" stroke="rgba(96,165,250,0.05)" />
            </g>
            <g
              fill="none"
              stroke="rgba(191,219,254,0.22)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              opacity={0.56 + scrollProgress * 0.12}
              style={{
                transform: `translate(${scrollProgress * -86}px, ${scrollProgress * 64}px)`,
                transformOrigin: 'center',
                willChange: 'transform, opacity',
              }}
            >
              <path d="M-120 214 C 76 24, 228 2, 386 164 L 928 770 C 1012 854, 1110 924, 1290 980" />
              <path d="M744 -94 C 646 8, 648 134, 762 246 L 1176 654 C 1302 784, 1398 930, 1474 1200" />
              <path d="M980 -40 C 1106 88, 1110 192, 986 312 C 930 368, 900 418, 900 472 C 900 522, 930 576, 992 642" />
            </g>
            <g
              opacity={0.72 - scrollProgress * 0.18}
              style={{
                transform: `translate(${scrollProgress * 92}px, ${scrollProgress * -58}px) scale(${1 - scrollProgress * 0.1})`,
                transformOrigin: 'center',
                willChange: 'transform, opacity',
              }}
            >
              <path
                d="M-120 804 C 18 694, 156 694, 282 808 L 556 1056 C 642 1134, 706 1184, 782 1200 L 646 1200 C 576 1176, 510 1130, 434 1060 L 186 802 C 80 706, -4 702, -120 772 Z"
                fill="rgba(30,58,138,0.18)"
              />
              <path
                d="M-92 832 C 26 738, 144 738, 254 838 L 522 1082 C 594 1146, 648 1186, 712 1200 L 614 1200 C 556 1178, 504 1140, 446 1088 L 190 832 C 96 746, 18 744, -92 802 Z"
                fill="rgba(30,64,175,0.16)"
              />
              <path
                d="M-62 862 C 38 784, 132 786, 228 872 L 492 1112 C 548 1162, 592 1190, 646 1200 L 568 1200 C 518 1180, 474 1148, 424 1102 L 176 862 C 96 790, 36 790, -62 836 Z"
                fill="rgba(59,130,246,0.12)"
              />
            </g>
            <g
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              opacity={0.55 + scrollProgress * 0.24}
              style={{
                transform: `translate(${scrollProgress * -68}px, ${scrollProgress * 94}px)`,
                transformOrigin: 'center',
                willChange: 'transform, opacity',
              }}
            >
              <path
                d="M-92 802 C 26 708, 144 708, 254 808 L 522 1050 C 606 1126, 666 1174, 738 1200"
                stroke="rgba(96,165,250,0.18)"
              />
              <path
                d="M-62 836 C 38 758, 132 760, 228 846 L 492 1088 C 564 1152, 618 1188, 680 1200"
                stroke="rgba(191,219,254,0.28)"
              />
            </g>
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M-138 128 C 8 -6, 168 -4, 312 150 L 888 798 C 974 890, 1076 1002, 1196 1200"
                className={`hero-signal-line hero-signal-delay-1${isScrolling ? ' hero-signal-active' : ''}`}
                stroke="rgba(255,255,255,0.98)"
                strokeWidth="2.2"
                pathLength="100"
              />
              <path
                d="M792 -110 C 708 -24, 714 90, 810 190 L 1226 620 C 1308 704, 1382 804, 1448 930"
                className={`hero-signal-line hero-signal-delay-2${isScrolling ? ' hero-signal-active' : ''}`}
                stroke="rgba(255,255,255,0.94)"
                strokeWidth="2"
                pathLength="100"
              />
              <path
                d="M-92 802 C 26 708, 144 708, 254 808 L 522 1050 C 606 1126, 666 1174, 738 1200"
                className={`hero-signal-line hero-signal-delay-3${isScrolling ? ' hero-signal-active' : ''}`}
                stroke="rgba(255,255,255,0.94)"
                strokeWidth="1.9"
                pathLength="100"
              />
            </g>
            <defs>
              <radialGradient id="bgGlow" cx="50%" cy="50%" r="78%">
                <stop offset="0%" stopColor="#f4f8ff" />
                <stop offset="65%" stopColor="#eaf1fb" />
                <stop offset="100%" stopColor="#dbe8f9" />
              </radialGradient>
            </defs>
          </svg>
        </div>
        <section className="relative px-4 py-10 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="inline-flex items-center rounded-full border border-blue-200/80 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 shadow-[0_14px_36px_rgba(37,99,235,0.08)]">
              Built for students
            </div>
            <div className="mt-8 grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
              <div>
                <h1
                  className={`${lusitana.className} max-w-4xl text-5xl font-semibold tracking-tight text-blue-950 [text-shadow:0_4px_12px_rgba(148,163,184,0.28)] md:text-7xl`}
                >
                  Study smarter. Remember longer. Perform better.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 md:text-xl md:leading-9">
                  <strong>SOKI</strong> helps students retain what they learn with
                  active recall, spaced repetition, and short daily review
                  sessions that target the right material at the right time.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(37,99,235,0.26)] transition-colors hover:bg-blue-500"
                  >
                    <span>Start Training</span> <ArrowRightIcon className="w-4" />
                  </Link>
                  <Link
                    href="/#how-it-works"
                    className="inline-flex items-center rounded-xl border border-blue-200/80 bg-white/75 px-6 py-3 text-sm font-medium text-blue-800 shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition-colors hover:border-blue-300 hover:bg-white"
                  >
                    How it works
                  </Link>
                </div>
              </div>
              <div className="relative mx-auto w-full max-w-[34rem] lg:ml-auto lg:mr-0 lg:max-w-[31rem] lg:translate-x-12">
                <div className="absolute inset-x-10 top-12 h-32 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="relative rounded-[2rem] border border-blue-200/80 bg-[linear-gradient(180deg,rgba(252,254,255,0.95)_0%,rgba(233,240,250,0.95)_100%)] p-5 shadow-[0_30px_90px_rgba(37,99,235,0.18)]">
                  <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-4">
                    {studyFlowSteps.map((step, index) => {
                      const { Icon } = step;

                      return (
                        <div
                          key={step.title}
                          className="flex w-full max-w-sm flex-col items-center gap-6 md:w-auto md:max-w-none md:flex-row"
                        >
                          <div className="w-full rounded-[1.6rem] border border-blue-100/80 bg-[linear-gradient(180deg,rgba(248,251,255,0.98)_0%,rgba(236,243,252,0.96)_100%)] p-5 text-center shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_20px_42px_rgba(37,99,235,0.14)] md:w-[9.75rem]">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                              <Icon className="h-6 w-6" />
                            </div>
                            <h3 className="mt-3 text-[1.02rem] font-semibold text-slate-900">
                              {step.title}
                            </h3>
                            <p className="mt-2 text-[0.8rem] leading-5 text-slate-600">
                              {step.description}
                            </p>
                          </div>

                          {index < studyFlowSteps.length - 1 && (
                            <>
                              <div className="flex flex-col items-center gap-2 md:hidden">
                                <div className="h-8 w-px bg-gradient-to-b from-blue-200 to-slate-300" />
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-5 w-5 rotate-90 text-blue-400"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M5 12h14" />
                                  <path d="m13 6 6 6-6 6" />
                                </svg>
                              </div>

                              <div className="hidden items-center gap-2 md:flex">
                                <div className="h-px w-8 bg-gradient-to-r from-blue-200 to-slate-300" />
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-5 w-5 text-blue-400"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M5 12h14" />
                                  <path d="m13 6 6 6-6 6" />
                                </svg>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="relative px-4 pb-28 pt-20 md:px-8 md:pb-36 md:pt-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Everything in one study flow
              </p>
              <h2
                className={`${notoSerifJp.className} mt-4 text-3xl font-semibold text-blue-950 md:text-5xl`}
              >
                The format students actually need
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Today's Plan", 'See what is due, what topic you are in, and how long the session will take.'],
                ['Active Recall', 'Answer first, then check yourself so memory gets stronger with each review.'],
                ['Spaced Repetition', 'Bring back material at the point where forgetting would normally begin.'],
                ['Efficient Learning', 'Prioritize the cards that matter most instead of rereading everything.'],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-[1.75rem] border border-blue-100/80 bg-white/75 p-6 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-sm"
                >
                  <p className={`${notoSerifJp.className} text-2xl font-semibold text-blue-950`}>
                    {title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="about" className="relative px-4 pb-28 md:px-8 md:pb-36">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="rounded-[2.25rem] border border-blue-200/80 bg-[linear-gradient(180deg,rgba(248,251,255,0.96)_0%,rgba(231,239,250,0.94)_100%)] p-6 shadow-[0_26px_60px_rgba(37,99,235,0.14)]">
              <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.75rem] border border-[rgba(171,194,226,0.95)] bg-[linear-gradient(180deg,rgba(244,248,253,0.98)_0%,rgba(231,239,250,0.97)_100%)] p-7 shadow-[0_22px_50px_rgba(37,99,235,0.12)]">
                  <p
                    className={`${notoSerifJp.className} text-base font-semibold tracking-[0.08em] text-blue-700`}
                  >
                    Today&apos;s Plan
                  </p>
                  <div className="mt-5 space-y-3 text-slate-700">
                    <p
                      className={`${notoSerifJp.className} flex items-center gap-3 text-xl font-semibold text-slate-900`}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(251,191,36,0.2)] text-amber-600">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                        </svg>
                      </span>
                      12 flashcards due
                    </p>
                    <div className={`${notoSerifJp.className} ml-11 space-y-2 text-base leading-7`}>
                      <p>
                        Topic: <span className="font-semibold text-slate-900">Circuit Analysis</span>
                      </p>
                      <p>
                        Estimated time: <span className="font-semibold text-slate-900">18 min</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="rounded-[1.75rem] border border-blue-100/80 bg-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                      Why it works
                    </p>
                    <div className="mt-5 space-y-4">
                      {[
                        ['Recall first', 'Strengthen retrieval before checking notes'],
                        ['Review on time', 'Catch memory before it drops away'],
                        ['Study efficiently', 'Prioritize what is most likely to be forgotten'],
                      ].map(([title, body]) => (
                        <div key={title} className="rounded-2xl bg-slate-50/90 p-4">
                          <p className={`${notoSerifJp.className} text-lg font-semibold text-slate-900`}>
                            {title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.75rem] border border-blue-100/80 bg-blue-600 p-5 text-white shadow-[0_22px_46px_rgba(37,99,235,0.22)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                      Study smarter
                    </p>
                    <p className={`${notoSerifJp.className} mt-3 text-3xl font-semibold`}>
                      Stop forgetting what you learn.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-blue-50">
                      Spaced repetition reinforces material right before it fades, turning quick review into long-term memory.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Study support
              </p>
              <h2
                className={`${notoSerifJp.className} mt-4 text-3xl font-semibold text-blue-950 [text-shadow:0_4px_12px_rgba(148,163,184,0.3)] md:text-5xl`}
              >
                Keep every important study signal in one place
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 md:text-lg md:leading-8">
                Your daily plan, due cards, progress, and recall quality should sit in one clean workspace. That is what makes short review sessions actually sustainable.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  'Daily sessions built around due reviews',
                  'Fast topic-based recall to reveal weak spots',
                  'Clear progress tracking to maintain momentum',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="grid grid-cols-[2.5rem_1fr] items-start gap-4 rounded-2xl border border-blue-100/80 bg-white/70 px-4 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
                  >
                    <div className={`${notoSerifJp.className} flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-700`}>
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm text-slate-700 md:text-base">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="relative px-4 pb-28 md:px-8 md:pb-36">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Memory curve
              </p>
              <h2
                className={`${notoSerifJp.className} mt-4 text-3xl font-semibold text-blue-950 md:text-5xl`}
              >
                See why review timing matters
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 md:text-lg md:leading-8">
                Without review, recall drops quickly over time. Repetition at the
                right moment lifts retention back up and flattens the decline.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm md:p-6">
              <svg
                viewBox="0 0 900 420"
                className="h-auto w-full"
                role="img"
                aria-label="Forgetting curve graph"
              >
                <g style={{ fontFamily: notoSerifJp.style.fontFamily }}>
                <line x1="90" y1="42" x2="90" y2="350" stroke="#a8b7cb" strokeWidth="2" />
                <line x1="90" y1="350" x2="860" y2="350" stroke="#a8b7cb" strokeWidth="2" />
                <path
                  d="M110 92 C 200 122, 270 182, 340 252 S 490 330, 840 344"
                  fill="none"
                  stroke="#8b9bb6"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M110 92 C 175 112, 235 150, 280 205"
                  fill="none"
                  stroke="#4d79c7"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M280 205 C 335 155, 380 130, 440 112 C 505 132, 565 165, 620 220"
                  fill="none"
                  stroke="#4d79c7"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M620 220 C 670 175, 720 145, 780 122 C 820 135, 846 155, 850 182"
                  fill="none"
                  stroke="#4d79c7"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <line x1="280" y1="350" x2="280" y2="170" stroke="#6b93d6" strokeWidth="2.5" strokeDasharray="8 8" />
                <line x1="620" y1="350" x2="620" y2="186" stroke="#6b93d6" strokeWidth="2.5" strokeDasharray="8 8" />
                <circle cx="280" cy="205" r="7" fill="#4d79c7" />
                <circle cx="620" cy="220" r="7" fill="#4d79c7" />
                <text x="0" y="58" fill="#334155" fontSize="20">Memory</text>
                <text x="810" y="390" fill="#334155" fontSize="20">Time</text>
                <text x="140" y="76" fill="#7b8da9" fontSize="18">No review</text>
                <text x="488" y="80" fill="#4d79c7" fontSize="18">Spaced repetition</text>
                <text x="246" y="160" fill="#5f86cb" fontSize="16">Review 1</text>
                <text x="586" y="176" fill="#5f86cb" fontSize="16">Review 2</text>
                </g>
              </svg>
            </div>
          </div>
        </section>
        <section className="relative px-4 pb-24 pt-2 md:px-8 md:pb-32 md:pt-6">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Core methods
              </p>
              <h2
                className={`${notoSerifJp.className} mt-4 text-3xl font-semibold text-blue-950 md:text-5xl`}
              >
                Study smarter, perform better.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700 md:text-xl md:leading-9">
                <strong>Focus on what matters.</strong>
                <br />
                Review the right material at the right time to retain more and
                perform better.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {studyCards.map((card) => {
                const isFlipped = flippedCards[card.title] ?? false;

                return (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => toggleCard(card.title)}
                    className="group h-64 w-full [perspective:1400px]"
                    aria-pressed={isFlipped}
                  >
                    <div
                      className="relative h-full w-full rounded-[2rem] transition-transform duration-700 [transform-style:preserve-3d]"
                      style={{
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] border border-[rgba(108,149,212,0.98)] bg-[linear-gradient(180deg,rgba(189,212,242,0.98)_0%,rgba(214,229,248,0.97)_52%,rgba(244,249,255,0.99)_100%)] p-7 text-center shadow-[0_28px_72px_rgba(37,99,235,0.18),0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur-md [backface-visibility:hidden] transition-colors duration-300 group-hover:border-[rgba(78,129,206,1)]">
                        <div className="max-w-[14rem]">
                          <h3
                            className={`${notoSerifJp.className} text-3xl font-semibold text-blue-950`}
                          >
                            {card.title}
                          </h3>
                        </div>
                        <div className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(112,153,213,0.82)] bg-[rgba(236,243,252,0.96)] text-blue-700 shadow-[0_12px_26px_rgba(37,99,235,0.16)]">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M8 7H5a2 2 0 0 0-2 2v3" />
                            <path d="M16 17h3a2 2 0 0 0 2-2v-3" />
                            <path d="M16 7h3a2 2 0 0 1 2 2v3" />
                            <path d="M8 17H5a2 2 0 0 1-2-2v-3" />
                            <path d="m9 9 3-3 3 3" />
                            <path d="m15 15-3 3-3-3" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] border border-blue-200/80 bg-[linear-gradient(160deg,rgba(29,78,216,0.94)_0%,rgba(37,99,235,0.9)_52%,rgba(96,165,250,0.85)_100%)] p-7 text-center shadow-[0_30px_76px_rgba(37,99,235,0.26),0_14px_28px_rgba(15,23,42,0.12)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <p
                          className={`${notoSerifJp.className} max-w-[15rem] text-xl leading-9 text-blue-50 md:text-2xl md:leading-10`}
                        >
                          {card.body}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        <footer className="relative mt-auto border-t border-slate-300/80 bg-white/75 px-4 py-6 shadow-[0_-12px_28px_rgba(15,23,42,0.18)] backdrop-blur-sm md:px-8">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2 md:gap-3">
            <Brain className="h-7 w-7 text-blue-900 md:h-9 md:w-9" />
            <span
              className={`${notoSerifJp.className} text-xl font-bold tracking-[0.01em] text-blue-900 md:text-3xl`}
            >
              SOKI
            </span>
          </div>
          <p className="mt-1 max-w-md text-sm leading-6 text-slate-600 md:text-base">
            SOKI helps learners remember more with spaced repetition and active recall.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            @2026 SOKI. All rights reserved.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Made by{' '}
            <Link
              href="https://www.linkedin.com/in/tin-mainiawklang-6a6a363a2/"
              className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-4 transition-colors hover:text-blue-800"
              target="_blank"
              rel="noreferrer"
            >
              Martin Mainiawklang
            </Link>
            ,{' '}
            <Link
              href="https://www.linkedin.com/in/seydi-c/"
              className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-4 transition-colors hover:text-blue-800"
              target="_blank"
              rel="noreferrer"
            >
              Seydi Cheikh Wade
            </Link>
            , and{' '}
            <Link
              href="https://www.linkedin.com/in/sean-baldaia-4670aa3b8/"
              className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-4 transition-colors hover:text-blue-800"
              target="_blank"
              rel="noreferrer"
            >
              Sean Baldaia
            </Link>
          </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
