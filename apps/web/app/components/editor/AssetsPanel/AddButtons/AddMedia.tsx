"use client";

import { getFile, useAppDispatch, useAppSelector } from "../../../../store";
import { setMediaFiles } from "../../../../store/slices/projectSlice";
import { categorizeFile } from "../../../../utils/utils";
import Image from 'next/image';
import toast from 'react-hot-toast';
import { MediaType } from "../../../../types";

const getMediaDuration = (file: File, type: MediaType): Promise<number> => {
    return new Promise((resolve) => {
        if (type === 'image') {
            resolve(5); // Default 5 seconds for images
            return;
        }

        if (type === 'unknown') {
            resolve(30); // Default 30 seconds for unknown types
            return;
        }

        const url = URL.createObjectURL(file);
        const element = type === 'video' ? document.createElement('video') : document.createElement('audio');
        element.preload = 'metadata';
        element.src = url;

        element.onloadedmetadata = () => {
             // Ensure duration is finite and valid
             const duration = (isFinite(element.duration) && element.duration > 0) ? element.duration : 30;
             resolve(duration);
             URL.revokeObjectURL(url);
        };

        element.onerror = () => {
             resolve(30); // fallback
             URL.revokeObjectURL(url);
        };
    });
};

export default function AddMedia({ fileId }: { fileId: string }) {
    const { mediaFiles } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();

    const handleFileChange = async () => {
        const updatedMedia = [...mediaFiles];

        const file = await getFile(fileId);

        if (!file) {
            toast.error("File not found");
            return;
        }

        const mediaId = crypto.randomUUID();
        const type = categorizeFile(file.type);
        const duration = await getMediaDuration(file, type);

        if (fileId) {
            const relevantClips = mediaFiles.filter(clip => clip.type === type);
            const lastEnd = relevantClips.length > 0
                ? Math.max(...relevantClips.map(f => f.positionEnd))
                : 0;

            updatedMedia.push({
                id: mediaId,
                fileName: file.name,
                fileId: fileId,
                startTime: 0,
                endTime: duration,
                src: URL.createObjectURL(file),
                positionStart: lastEnd,
                positionEnd: lastEnd + duration,
                includeInMerge: true,
                x: 0,
                y: 0,
                width: 1920,
                height: 1080,
                rotation: 0,
                opacity: 100,
                crop: { x: 0, y: 0, width: 1920, height: 1080 },
                playbackSpeed: 1,
                volume: 100,
                type: type,
                zIndex: 0,
            });
        }
        dispatch(setMediaFiles(updatedMedia));
        toast.success('Media added successfully.');
    };

    return (
        <div
        >
            <label
                className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-col items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium sm:text-base py-2 px-2"
            >
                <Image
                    alt="Add Project"
                    className="Black"
                    height={12}
                    width={12}
                    src="https://www.svgrepo.com/show/513803/add.svg"
                />
                {/* <span className="text-xs">Add Media</span> */}
                <button
                    onClick={handleFileChange}
                >
                </button>
            </label>
        </div>
    );
}
