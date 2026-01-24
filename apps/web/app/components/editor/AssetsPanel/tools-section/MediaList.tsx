"use client";

import { listFiles, deleteFile, useAppSelector, storeFile, getFile } from '@/app/store';
import { setMediaFiles, setFilesID } from '@/app/store/slices/projectSlice';
import { MediaFile, UploadedFile } from '@/app/types';
import { useAppDispatch } from '@/app/store';
import AddMedia from '../AddButtons/AddMedia';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
export default function MediaList() {
    const { mediaFiles, filesID } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();
    const [files, setFiles] = useState<UploadedFile[]>([]);

    useEffect(() => {
        let mounted = true;

        const fetchFiles = async () => {
            try {
                const storedFilesArray: UploadedFile[] = [];

                for (const fileId of filesID || []) {
                    const file = await getFile(fileId);
                    if (file && mounted) {
                        storedFilesArray.push({
                            file: file,
                            id: fileId,
                        });
                    }
                }

                if (mounted) {
                    setFiles(storedFilesArray);
                }
            } catch (error) {
                toast.error("Error fetching files");
                console.error("Error fetching files:", error);
            }
        };

        fetchFiles();

        // Cleanup
        return () => {
            mounted = false;
        };
    }, [filesID]);

    const onDeleteMedia = async (id: string) => {
        const onUpdateMedia = mediaFiles.filter(f => f.fileId !== id);
        dispatch(setMediaFiles(onUpdateMedia));
        dispatch(setFilesID(filesID?.filter(f => f !== id) || []));
        await deleteFile(id);
    };

    return (
        <>
            {files.length > 0 && (
                <div className="space-y-4">
                    {files.map((mediaFile) => (
                        <div key={mediaFile.id} className="border border-gray-700 p-3 rounded bg-black bg-opacity-30 hover:bg-opacity-40 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <AddMedia fileId={mediaFile.id} />
                                    <span className="py-1 px-1 text-sm flex-1 truncate" title={mediaFile.file.name}>
                                        {mediaFile.file.name}
                                    </span>
                                </div>
                                <button
                                    onClick={() => onDeleteMedia(mediaFile.id)}
                                    className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                                    aria-label="Delete file"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}