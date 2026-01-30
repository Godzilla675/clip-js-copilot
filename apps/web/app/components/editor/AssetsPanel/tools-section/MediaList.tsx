"use client";

import { deleteFile, useAppSelector } from '@/app/store';
import { setMediaFiles, setFilesID, removeLibraryFile } from '@/app/store/slices/projectSlice';
import { useAppDispatch } from '@/app/store';
import AddMedia from '../AddButtons/AddMedia';
import React from 'react';
import { Trash2 } from 'lucide-react';

export default function MediaList() {
    const { mediaFiles, filesID, libraryFiles } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();

    const onDeleteMedia = async (id: string, fileId: string) => {
        // Remove from timeline clips that use this file
        const onUpdateMedia = mediaFiles.filter(f => f.fileId !== fileId);
        dispatch(setMediaFiles(onUpdateMedia));

        // Remove from library
        dispatch(removeLibraryFile(id));

        // Legacy: Remove from filesID
        dispatch(setFilesID(filesID?.filter(f => f !== fileId) || []));

        // Delete from IndexedDB
        await deleteFile(fileId);
    };

    return (
        <div className="space-y-4">
            {libraryFiles && libraryFiles.map((mediaFile) => (
                <div key={mediaFile.id} className="border border-gray-700 p-3 rounded bg-black bg-opacity-30 hover:bg-opacity-40 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <AddMedia fileId={mediaFile.fileId} />
                            <span className="py-1 px-1 text-sm flex-1 truncate" title={mediaFile.fileName}>
                                {mediaFile.fileName}
                            </span>
                        </div>
                        <button
                            onClick={() => onDeleteMedia(mediaFile.id, mediaFile.fileId)}
                            className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                            aria-label="Delete file"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))}
            {(!libraryFiles || libraryFiles.length === 0) && (
                <div className="text-gray-500 text-center py-4 text-sm">
                    No media files
                </div>
            )}
        </div>
    );
}
