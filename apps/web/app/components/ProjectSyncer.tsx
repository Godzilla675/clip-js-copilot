'use client';
import { useProjectSync } from '../hooks/useProject';

export function ProjectSyncer() {
    useProjectSync();
    return null;
}
