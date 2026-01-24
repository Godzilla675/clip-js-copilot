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

const GlobalKeyHandler = ({ handleDuplicate, handleSplit, handleDelete }: GlobalKeyHandlerProps) => {
    const projectState = useAppSelector((state) => state.projectState);
    const dispatch = useDispatch();

    const { duration } = projectState;

    // Store latest state values in refs
    const isPlayingRef = useRef(projectState.isPlaying);
    const isMutedRef = useRef(projectState.isMuted);
    const currentTimeRef = useRef(projectState.currentTime);
    const enableMarkerTrackingRef = useRef(projectState.enableMarkerTracking);

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
