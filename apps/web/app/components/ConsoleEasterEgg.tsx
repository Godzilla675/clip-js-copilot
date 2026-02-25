'use client';
import { useEffect } from 'react';

export default function ConsoleEasterEgg() {
    useEffect(() => {
        const art = [
            '%c🎬 ClipJS — Copilot AI Video Editor',
            'font-size:20px;font-weight:bold;color:#6366f1;',
        ];
        console.log(art[0], art[1]);
        console.log(
            '%c' +
            '    _____ _ _       _  _____ \n' +
            '   / ____| (_)     | |/ ____|\n' +
            '  | |    | |_ _ __ | | (___  \n' +
            '  | |    | | | \'_ \\| |\\___ \\ \n' +
            '  | |____| | | |_) | |____) |\n' +
            '   \\_____|_|_| .__/| |_____/ \n' +
            '             | |  |_|        \n' +
            '             |_|   🦖        ',
            'color:#a78bfa;font-family:monospace;'
        );
        console.log(
            '%cPsst... you found a hidden message! Try the Konami Code in the editor 🎮',
            'color:#9ca3af;font-style:italic;font-size:11px;'
        );
    }, []);
    return null;
}
