import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { api } from '../lib/api';
import { useAppDispatch, useAppSelector } from '../store';
import { rehydrate } from '../store/slices/projectSlice';
import { ProjectState } from '../types';

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
                // TODO: Implement more sophisticated merging strategy
                // For now, we simply replace the state with the server state
                // This might overwrite local unsaved changes if not careful
                dispatch(rehydrate(remoteProject as ProjectState));
            }
        };

        client.on('project.updated', handleProjectUpdate);

        return () => {
            client.off('project.updated', handleProjectUpdate);
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
