import React, { useRef, useCallback, useMemo } from "react";
import Moveable, { OnScale, OnDrag, OnResize, OnRotate } from "react-moveable";
import { useAppSelector, useAppDispatch } from "@/app/store";
import { setActiveElement, setActiveElementIndex, setMediaFiles, updateMediaFile } from "@/app/store/slices/projectSlice";
import { memo, useEffect, useState } from "react";
import Image from "next/image";
import Header from "../Header";
import { MediaFile } from "@/app/types";
import { debounce, throttle } from "lodash";

export default function AudioTimeline() {
    const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const { mediaFiles, textElements, activeElement, activeElementIndex, timelineZoom } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();
    const moveableRef = useRef<Record<string, Moveable | null>>({});


    // this affect the performance cause of too much re-renders

    // const onUpdateMedia = (id: string, updates: Partial<MediaFile>) => {
    //     dispatch(setMediaFiles(mediaFiles.map(media =>
    //         media.id === id ? { ...media, ...updates } : media
    //     )));
    // };

    const mediaFileIndices = useMemo(() => {
        const indices = new Map<string, number>();
        mediaFiles.forEach((file, index) => {
            indices.set(file.id, index);
        });
        return indices;
    }, [mediaFiles]);

    const onUpdateMedia = useMemo(() =>
        throttle((id: string, updates: Partial<MediaFile>) => {
            dispatch(updateMediaFile({ id, updates }));
        }, 100), [dispatch]
    );

    const handleClick = (element: string, id: string) => {
        if (element === 'media') {
            const actualIndex = mediaFileIndices.get(id);
            if (actualIndex !== undefined) {
                if (activeElement !== 'media') {
                    dispatch(setActiveElement('media'));
                }
                if (activeElementIndex !== actualIndex) {
                    dispatch(setActiveElementIndex(actualIndex));
                }
            }
        }
    };

    const handleDrag = (clip: MediaFile, target: HTMLElement, left: number) => {
        // no negative left
        const constrainedLeft = Math.max(left, 0);
        const newPositionStart = constrainedLeft / timelineZoom;
        onUpdateMedia(clip.id, {
            positionStart: newPositionStart,
            positionEnd: (newPositionStart - clip.positionStart) + clip.positionEnd,
            endTime: Math.max((newPositionStart - clip.positionStart) + clip.endTime, clip.endTime)
        })

        target.style.left = `${constrainedLeft}px`;
    };

    const handleRightResize = (clip: MediaFile, target: HTMLElement, width: number) => {
        const newPositionEnd = width / timelineZoom;

        onUpdateMedia(clip.id, {
            positionEnd: clip.positionStart + newPositionEnd,
            endTime: Math.max(clip.positionStart + newPositionEnd, clip.endTime)
        })
    };

    const handleLeftResize = (clip: MediaFile, target: HTMLElement, width: number) => {
        const visualRightEdge = (clip.positionStart + (clip.positionEnd - clip.positionStart) / clip.playbackSpeed);
        let newPositionStart = visualRightEdge - (width / timelineZoom);

        newPositionStart = Math.max(newPositionStart, 0);

        const minStartBasedOnMedia = clip.positionStart - (clip.startTime / clip.playbackSpeed);
        newPositionStart = Math.max(newPositionStart, minStartBasedOnMedia);

        const finalDelta = newPositionStart - clip.positionStart;
        const newStartTime = clip.startTime + finalDelta * clip.playbackSpeed;

        const newVisualWidth = (visualRightEdge - newPositionStart) * timelineZoom;
        const newPositionEnd = newPositionStart + (visualRightEdge - newPositionStart) * clip.playbackSpeed;

        onUpdateMedia(clip.id, {
            positionStart: newPositionStart,
            startTime: newStartTime,
            positionEnd: newPositionEnd
        });

        target.style.left = `${newPositionStart * timelineZoom}px`;
        target.style.width = `${newVisualWidth}px`;
    };

    useEffect(() => {
        for (const clip of mediaFiles) {
            moveableRef.current[clip.id]?.updateRect();
        }
    }, [timelineZoom]);

    return (
        <div >
            {mediaFiles
                .filter(clip => clip.type === 'audio')
                .map((clip) => (
                    <div key={clip.id} className="bg-green-500">
                        <div
                            key={clip.id}
                            ref={(el: HTMLDivElement | null) => {
                                if (el) {
                                    targetRefs.current[clip.id] = el;
                                }
                            }}
                            onClick={() => handleClick('media', clip.id)}
                            className={`absolute border border-gray-500 border-opacity-50 rounded-md top-2 h-12 rounded bg-[#27272A] text-white text-sm flex items-center justify-center cursor-pointer ${activeElement === 'media' && mediaFiles[activeElementIndex].id === clip.id ? 'bg-[#3F3F46] border-blue-500' : ''}`}
                            style={{
                                left: `${clip.positionStart * timelineZoom}px`,
                                width: `${(clip.positionEnd / clip.playbackSpeed - clip.positionStart / clip.playbackSpeed) * timelineZoom}px`,
                                zIndex: clip.zIndex,
                            }}
                        >
                            {/* <MoveableTimeline /> */}
                            <Image
                                alt="Audio"
                                className="h-7 w-7 min-w-6 mr-2 flex-shrink-0"
                                height={30}
                                width={30}
                                src="https://www.svgrepo.com/show/532708/music.svg"
                            />
                            <span className="truncate text-x">{clip.fileName}</span>

                        </div>
                        <Moveable
                            ref={(el: Moveable | null) => {
                                if (el) {
                                    moveableRef.current[clip.id] = el;
                                }
                            }}
                            target={targetRefs.current[clip.id] || null}
                            container={null}
                            renderDirections={activeElement === 'media' && mediaFiles[activeElementIndex].id === clip.id ? ['w', 'e'] : []}
                            draggable={true}
                            throttleDrag={0}
                            rotatable={false}
                            onDragStart={({ target, clientX, clientY }) => {
                            }}
                            onDrag={({
                                target,
                                beforeDelta, beforeDist,
                                left,
                                right,
                                delta, dist,
                                transform,
                            }: OnDrag) => {
                                handleClick('media', clip.id)
                                handleDrag(clip, target as HTMLElement, left);
                            }}
                            onDragEnd={({ target, isDrag, clientX, clientY }) => {
                            }}

                            /* resizable*/
                            resizable={true}
                            throttleResize={0}
                            onResizeStart={({ target, clientX, clientY }) => {
                            }}
                            onResize={({
                                target, width,
                                delta, direction,
                            }: OnResize) => {
                                if (direction[0] === 1) {
                                    handleClick('media', clip.id)
                                    delta[0] && (target!.style.width = `${width}px`);
                                    handleRightResize(clip, target as HTMLElement, width);
                                }
                                else if (direction[0] === -1) {
                                    handleClick('media', clip.id)
                                    handleLeftResize(clip, target as HTMLElement, width);
                                }
                            }}
                            onResizeEnd={({ target, isDrag, clientX, clientY }) => {
                            }}
                        />
                    </div>

                ))}
        </div>
    );
}
