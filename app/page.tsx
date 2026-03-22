import Soki from '@/app/ui/Soki';
import {ArrowRightIcon} from '@heroicons/react/24/outline';
import Link from 'next/link';
import {LogIn }from 'lucide-react'
import {lusitana} from "@/app/ui/fonts";

export default function Page() {
    return (
        <main className="flex min-h-screen flex-col ">

            <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-52">
                {<Soki/>}
            </div>
            <div className="flex flex-col h-screen">
                <div className=" rounded-lg bg-purple-400-50 px-50 py-10 ">
                    <p className={`${lusitana.className} text-xl text-gray-800 md:text-3xl md:leading-normal`}>
                        <strong>Welcome to Memory retrieval Assistant.</strong> This is a prototype for a Space
                        repetition software with the goal to help you learn through Memory recall {' '}
                        <a href="https://www.sciencedirect.com/science/article/pii/S2211124725000038"
                           className="text-blue-500">
                            Learn more about the topic here
                        </a>
                    </p>
                    <br/>
                    <br/>
                    <Link
                        href="/signup"
                        className="flex items-center gap-10 self-start rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
                    >
                        <span>Get Started</span> <ArrowRightIcon className="w-5 md:w-6"/>
                    </Link>
                    <br/>
                    <Link
                        href="/login"
                        className="flex items-center gap-10 self-start rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
                    >
                        <span>Log in</span> <LogIn className="w-5 md:w-6"/>
                    </Link>
                    <></>
                </div>
                <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">

                </div>
            </div>
        </main>
    );
}
