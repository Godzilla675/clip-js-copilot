import { Player, PlayerRef } from "@remotion/player";
import Composition from "./sequence/composition";
import { useAppSelector, useAppDispatch } from "@/app/store";
import { useRef, useState, useEffect } from "react";
import { setIsPlaying } from "@/app/store/slices/projectSlice";
import { useDispatch } from "react-redux";

const fps = 30;

export const PreviewPlayer = () => {
    const projectState = useAppSelector((state) => state.projectState);
    const { duration, currentTime, isPlaying, isMuted } = projectState;
    const playerRef = useRef<PlayerRef>(null);
    const dispatch = useDispatch();

    // update frame when current time with marker
    useEffect(() => {
        const frame = Math.round(currentTime * fps);
        if (playerRef.current && !isPlaying) {
            playerRef.current.pause();
            playerRef.current.seekTo(frame);
        }
    }, [currentTime, isPlaying]);

    useEffect(() => {
        const player = playerRef.current;
        if (!player) return;

        const onPlay = () => dispatch(setIsPlaying(true));
        const onPause = () => dispatch(setIsPlaying(false));

        player.addEventListener("play", onPlay);
        player.addEventListener("pause", onPause);
        return () => {
            player.removeEventListener("play", onPlay);
            player.removeEventListener("pause", onPause);
        };
    }, [dispatch]);

    // to control with keyboard
    useEffect(() => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.mute();
        } else {
            playerRef.current.unmute();
        }
    }, [isMuted]);

    return (
        <Player
            ref={playerRef}
            component={Composition}
            inputProps={{}}
            durationInFrames={Math.floor(duration * fps) + 1}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={fps}
            style={{ width: "100%", height: "100%" }}
            controls
            clickToPlay={false}
        />
    )
};