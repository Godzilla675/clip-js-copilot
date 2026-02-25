'use client';
import { useAppSelector } from "@/app/store";
import { useEffect, useRef, useState } from "react";
import { setIsPlaying, setIsMuted, setCurrentTime, setMarkerTrack } from "@/app/store/slices/projectSlice";
import { useDispatch } from "react-redux";

interface GlobalKeyHandlerProps {
    handleDuplicate: () => void;
    handleSplit: () => void;
    handleDelete: () => void;
}

const KONAMI_SEQUENCE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];

const GlobalKeyHandler = ({ handleDuplicate, handleSplit, handleDelete }: GlobalKeyHandlerProps) => {
    const projectState = useAppSelector((state) => state.projectState);
    const dispatch = useDispatch();

    const { duration } = projectState;

    // Store latest state values in refs
    const isPlayingRef = useRef(projectState.isPlaying);
    const isMutedRef = useRef(projectState.isMuted);
    const currentTimeRef = useRef(projectState.currentTime);
    const enableMarkerTrackingRef = useRef(projectState.enableMarkerTracking);
    const konamiIndexRef = useRef(0);

    useEffect(() => {
        isPlayingRef.current = projectState.isPlaying;
        isMutedRef.current = projectState.isMuted;
        currentTimeRef.current = projectState.currentTime;
        enableMarkerTrackingRef.current = projectState.enableMarkerTracking;
    }, [projectState]);

    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        const handleClick = () => setHasInteracted(true);
        window.addEventListener('click', handleClick, { once: true });
        return () => window.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        if (!hasInteracted) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            if (isTyping) return;

            // Konami Code detection
            if (e.code === KONAMI_SEQUENCE[konamiIndexRef.current]) {
                konamiIndexRef.current++;
                if (konamiIndexRef.current === KONAMI_SEQUENCE.length) {
                    konamiIndexRef.current = 0;
                    const emojis = ['🎬','🎥','🎞️','🍿','⭐','🚀','🦖'];
                    for (let i = 0; i < 30; i++) {
                        const el = document.createElement('div');
                        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                        Object.assign(el.style, {
                            position: 'fixed', fontSize: '2rem', zIndex: '99999',
                            left: Math.random() * 100 + 'vw', top: '-2rem',
                            pointerEvents: 'none', transition: 'none',
                        });
                        document.body.appendChild(el);
                        const duration = 2000 + Math.random() * 2000;
                        el.animate([
                            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                            { transform: `translateY(105vh) rotate(${360 + Math.random()*720}deg)`, opacity: 0 },
                        ], { duration, easing: 'ease-in' });
                        setTimeout(() => el.remove(), duration);
                    }
                }
            } else {
                konamiIndexRef.current = e.code === KONAMI_SEQUENCE[0] ? 1 : 0;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    dispatch(setIsPlaying(!isPlayingRef.current));
                    break;
                case 'KeyM':
                    e.preventDefault();
                    dispatch(setIsMuted(!isMutedRef.current));
                    break;
                case 'KeyD':
                    e.preventDefault();
                    handleDuplicate();
                    break;
                case 'KeyS':
                    e.preventDefault();
                    handleSplit();
                    break;
                case 'Delete':
                    e.preventDefault();
                    handleDelete();
                    break;
                case 'KeyT':
                    e.preventDefault();
                    dispatch(setMarkerTrack(!enableMarkerTrackingRef.current));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (isPlayingRef.current) return;
                    const nextTime = currentTimeRef.current + .01 > duration ? 0 : currentTimeRef.current + .01;
                    dispatch(setCurrentTime(nextTime));
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (isPlayingRef.current) return;
                    const prevTime = currentTimeRef.current - .01 > duration ? 0 : currentTimeRef.current - .01;
                    dispatch(setCurrentTime(prevTime));
                    break;
                default:
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasInteracted, handleDelete, handleDuplicate, handleSplit, duration, dispatch]);

    return null;
};

export default GlobalKeyHandler;
