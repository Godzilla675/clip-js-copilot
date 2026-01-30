"use client";

import { listFiles, useAppDispatch, useAppSelector } from "../../../../store";
import { setMediaFiles, setFilesID, addLibraryFile } from "../../../../store/slices/projectSlice";
import { storeFile } from "../../../../store";
import { categorizeFile } from "../../../../utils/utils";
import { UploadCloud } from 'lucide-react';
import { api } from "../../../../lib/api";

export default function AddMedia() {
    const { mediaFiles, filesID } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        const updatedFiles = [...filesID || []];
        for (const file of newFiles) {
            const fileId = crypto.randomUUID();
            await storeFile(file, fileId);

            // Upload to backend
            let serverPath: string | undefined;
            try {
                const uploadResult = await api.upload.file(file);
                serverPath = uploadResult.filePath;
                console.log('File uploaded to server:', serverPath);
            } catch (error) {
                console.warn('Failed to upload to backend:', error);
            }

            updatedFiles.push(fileId);

            dispatch(addLibraryFile({
                id: crypto.randomUUID(),
                fileId: fileId,
                fileName: file.name,
                type: categorizeFile(file.type),
                src: URL.createObjectURL(file), // For immediate display
                serverPath: serverPath,
                createdAt: new Date().toISOString()
            }));
        }
        dispatch(setFilesID(updatedFiles));
        e.target.value = "";
    };

    return (
        <div
        >
            <label
                htmlFor="file-upload"
                className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
            >
                <UploadCloud size={12} className="text-black" />
                <span className="text-xs">Add Media</span>
            </label>
            <input
                type="file"
                accept="video/*,audio/*,image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
            />
        </div>
    );
}
