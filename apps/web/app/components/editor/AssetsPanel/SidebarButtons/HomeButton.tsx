'use client';
import { Home } from 'lucide-react';
import { useRouter } from 'next/navigation'
export default function HomeButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/')}
            className="bg-white border border-solid rounded border-transparent transition-colors flex flex-col items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
        >
            <Home size={30} className="text-gray-800" />
            <span className="text-xs">Home</span>
        </button>
    );
}
