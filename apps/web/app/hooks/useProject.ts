import { useEffect, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketProvider';
import { useAppSelector } from '../store/index';
import { frontendToBackend } from '../lib/project-mapper';

export const useProjectSync = () => {
    const { client, isConnected } = useWebSocket();

    const project = useAppSelector(state => state.projectState);
    const lastSyncedProject = useRef<string>('');

    // Initialize lastSyncedProject to avoid sending initial state immediately if not needed
    // or maybe we DO want to sync on connect?

    useEffect(() => {
        if (isConnected && lastSyncedProject.current === '') {
             lastSyncedProject.current = JSON.stringify(project);
        }
    }, [isConnected, project]);

    // Send updates
    useEffect(() => {
        if (!client || !isConnected) return;

        const currentString = JSON.stringify(project);

        // Simple debounce could be added here, but relying on useEffect execution
        if (currentString !== lastSyncedProject.current) {
            // Convert to shared format
            const backendProject = frontendToBackend(project);

            client.send('project.update', {
                projectId: project.id,
                changes: backendProject
            });

            lastSyncedProject.current = currentString;
        }
    }, [project, client, isConnected]);
};
