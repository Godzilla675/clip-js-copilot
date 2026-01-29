import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { api } from '../lib/api';
import { useAppDispatch, useAppSelector } from '../store';
import { rehydrate, addLibraryFile, updateTimelineClip } from '../store/slices/projectSlice';
import { MediaFile, MediaType, ProjectState } from '../types';
import { categorizeFile } from '../utils/utils';
import { storeFile } from '../store';

export const useProject = () => {
    const dispatch = useAppDispatch();
    const project = useAppSelector((state) => state.projectState);
    const { client, isConnected, send } = useWebSocket();

    // Listen for updates from the server
    useEffect(() => {
        const handleProjectUpdate = (payload: any) => {
            console.log('Received project update:', payload);
            const { project: remoteProject } = payload;

            // Check if the update is for the current project
            // Note: remoteProject might be partial or full.
            // Assuming full state for now based on 'rehydrate' usage.
            if (remoteProject && remoteProject.id === project.id) {
                // Synchronization Logic: Convert Backend Project (tracks/assets) to Frontend State (mediaFiles)
                if (remoteProject.assets && remoteProject.timeline && remoteProject.timeline.tracks) {
                    const newMediaFiles: MediaFile[] = [];
                    const assetsMap = new Map<string, any>(remoteProject.assets.map((a: any) => [a.id, a]));
                    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

                    remoteProject.timeline.tracks.forEach((track: any) => {
                         if (track.type === 'video' || track.type === 'audio') {
                             track.clips.forEach((clip: any) => {
                                 const asset = assetsMap.get(clip.assetId);
                                 if (asset) {
                                     // Construct Src URL
                                     const filename = asset.path.split(/[/\\]/).pop();
                                     const src = `${BACKEND_URL}/assets/${filename}`;

                                     newMediaFiles.push({
                                         id: clip.id,
                                         fileName: asset.name,
                                         fileId: asset.id, // Using asset ID as file ID
                                         type: asset.type as MediaType,
                                         startTime: clip.sourceStart || 0,
                                         endTime: (clip.sourceStart || 0) + clip.duration,
                                         positionStart: clip.startTime,
                                         positionEnd: clip.startTime + clip.duration,
                                         src: src,
                                         includeInMerge: true,
                                         playbackSpeed: 1,
                                         volume: 100,
                                         zIndex: 0,
                                         x: 0, y: 0, width: 1920, height: 1080,
                                         rotation: 0, opacity: 1,
                                         crop: { x: 0, y: 0, width: 1920, height: 1080 }
                                     });
                                 }
                             });
                         }
                    });

                    // Update remoteProject with converted mediaFiles
                    remoteProject.mediaFiles = newMediaFiles;
                }

                // TODO: Implement more sophisticated merging strategy
                // For now, we simply replace the state with the server state
                // This might overwrite local unsaved changes if not careful
                dispatch(rehydrate(remoteProject as ProjectState));
            }
        };

        const handleAssetCreated = async (payload: any) => {
            console.log('Asset created:', payload);
            const { fileName, filePath, projectId } = payload;
            if (projectId && projectId !== project.id) return;

            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
                const response = await fetch(`${backendUrl}/api/upload/${fileName}/download`);
                if (!response.ok) {
                    console.warn('Could not download created asset:', fileName);
                    return;
                }
                const blob = await response.blob();
                const file = new File([blob], fileName, { type: blob.type });
                const fileId = crypto.randomUUID();

                await storeFile(file, fileId);

                dispatch(addLibraryFile({
                    id: crypto.randomUUID(),
                    fileId: fileId,
                    fileName: fileName,
                    type: categorizeFile(blob.type),
                    src: URL.createObjectURL(file), // For immediate display
                    serverPath: filePath,
                    createdAt: new Date().toISOString()
                }));
            } catch (e) {
                console.error('Error handling asset.created:', e);
            }
        };

        const handleTimelineClipUpdated = async (payload: any) => {
            console.log('Timeline clip updated:', payload);
            const { originalFilePath, newFilePath, projectId } = payload;
            if (projectId && projectId !== project.id) return;

            const fileName = newFilePath.split(/[\\/]/).pop();
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
                const response = await fetch(`${backendUrl}/api/upload/${fileName}/download`);
                if (!response.ok) {
                    console.warn('Could not download updated clip asset:', fileName);
                    return;
                }

                const blob = await response.blob();
                const file = new File([blob], fileName, { type: blob.type });
                const fileId = crypto.randomUUID();
                await storeFile(file, fileId);

                const objectUrl = URL.createObjectURL(file);
                const vid = document.createElement('video');
                vid.src = objectUrl;

                await new Promise((resolve) => {
                    vid.onloadedmetadata = () => resolve(true);
                    vid.onerror = () => resolve(false);
                });

                dispatch(updateTimelineClip({
                    originalServerPath: originalFilePath,
                    newServerPath: newFilePath,
                    newFileName: fileName,
                    newSrc: objectUrl,
                    newDuration: vid.duration
                }));

                // Also add to library
                dispatch(addLibraryFile({
                    id: crypto.randomUUID(),
                    fileId: fileId,
                    fileName: fileName,
                    type: categorizeFile(blob.type),
                    src: objectUrl,
                    serverPath: newFilePath,
                    createdAt: new Date().toISOString()
                }));

            } catch (e) {
                console.error('Error handling timeline.clip.updated:', e);
            }
        };

        client.on('project.updated', handleProjectUpdate);
        client.on('asset.created', handleAssetCreated);
        client.on('timeline.clip.updated', handleTimelineClipUpdated);

        return () => {
            client.off('project.updated', handleProjectUpdate);
            client.off('asset.created', handleAssetCreated);
            client.off('timeline.clip.updated', handleTimelineClipUpdated);
        };
    }, [client, project.id, dispatch]);

    const syncProject = useCallback(async (id: string) => {
        try {
            const remoteProject = await api.project.get(id);
            if (remoteProject) {
                dispatch(rehydrate(remoteProject as ProjectState));
            }
        } catch (error) {
            console.error('Failed to sync project:', error);
        }
    }, [dispatch]);

    const saveProject = useCallback(async () => {
        try {
            if (isConnected) {
                send('project.update', { projectId: project.id, changes: project });
            } else {
                await api.project.update(project.id, project);
            }
        } catch (error) {
            console.error('Failed to save project:', error);
        }
    }, [isConnected, send, project]);

    return {
        syncProject,
        saveProject,
        isConnected
    };
};
