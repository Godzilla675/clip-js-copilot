'use client'
import Link from "next/link";
import ThemeSwitch from "../buttons/ThemeSwitch";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";

export default function Header() {
    const pathname = usePathname();
    const [clickCount, setClickCount] = useState(0);
    const [showEgg, setShowEgg] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    if (pathname.startsWith("/projects/")) {
        return null;
    }

    const handleLogoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const next = clickCount + 1;
        setClickCount(next);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (next >= 7) {
            setClickCount(0);
            setShowEgg(true);
            setTimeout(() => setShowEgg(false), 4000);
        } else {
            timerRef.current = setTimeout(() => setClickCount(0), 2000);
        }
    };

    return (
        <header className="bg-black border-b border-gray-800 shadow-sm">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <span
                        onClick={handleLogoClick}
                        className="text-3xl dark:text-gray-100 cursor-pointer select-none"
                    >
                        ClipJS
                    </span>
                </div>
                {showEgg && (
                    <span className="text-xs text-gray-500 animate-pulse" style={{ letterSpacing: '0.15em' }}>
                        🦖 You found a secret! Built with 💜 by the ClipJS team
                    </span>
                )}
                <nav className="flex items-center">
                    <ul className="flex space-x-2 mr-2">
                        <li>
                            <Link
                                href="/"
                                className="text-md text-white hover:text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/projects"
                                className="text-md text-white hover:text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                Projects
                            </Link>
                        </li>
                    </ul>
                    {/* <ThemeSwitch /> */}
                </nav>
            </div>
        </header>
    );
}
