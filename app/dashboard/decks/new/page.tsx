"use client"
import {dropFiles} from '@/app/ui/dashboard/dropfile'
export default function Page() {
    return (
        <>
            <p>New Deck</p>
            <div className='flex flex-col'>
                <>Upload your document</>
                <>{dropFiles()}</>
            </div>
        </>

    )
}