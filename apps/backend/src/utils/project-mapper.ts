import { Project, Asset, Clip, Track, Timeline } from '@ai-video-editor/shared-types';

export function mapProjectStateToProject(projectState: any): Project {
    const assets: Asset[] = (projectState.libraryFiles || []).map((f: any) => ({
        id: f.id,
        name: f.fileName,
        path: f.serverPath || f.src || '',
        type: f.type,
        duration: 0
    }));

    // Create lookup for fileId -> assetId
    // libraryFile.fileId is the content ID shared with mediaFile.fileId
    const fileIdToAssetId = new Map<string, string>();
    (projectState.libraryFiles || []).forEach((f: any) => {
        if (f.fileId) {
            fileIdToAssetId.set(f.fileId, f.id);
        }
    });

    const videoClips: Clip[] = (projectState.mediaFiles || []).map((m: any) => {
        const assetId = fileIdToAssetId.get(m.fileId) || m.fileId;

        return {
            id: m.id,
            assetId: assetId,
            trackId: 'video-track-1',
            startTime: m.positionStart,
            duration: m.positionEnd - m.positionStart,
            sourceStart: m.startTime,
            sourceEnd: m.endTime,
            effects: [],
            transform: {
                x: m.x || 0,
                y: m.y || 0,
                scale: m.width ? 1 : 1, // Approximation
                rotation: m.rotation || 0
            }
        };
    });

    const videoTrack: Track = {
        id: 'video-track-1',
        type: 'video',
        name: 'Main Video',
        clips: videoClips,
        muted: projectState.isMuted || false,
        visible: true
    };

    const textClips: Clip[] = (projectState.textElements || []).map((t: any) => ({
        id: t.id,
        assetId: 'text-asset',
        trackId: 'text-track-1',
        startTime: t.positionStart,
        duration: t.positionEnd - t.positionStart,
        sourceStart: 0,
        sourceEnd: t.positionEnd - t.positionStart,
        effects: [],
        text: t.text,
        transform: {
            x: t.x,
            y: t.y,
            scale: 1,
            rotation: t.rotation || 0
        }
    }));

    const textTrack: Track = {
        id: 'text-track-1',
        type: 'text',
        name: 'Text',
        clips: textClips,
        muted: false,
        visible: true
    };

    const timeline: Timeline = {
        duration: projectState.duration || 0,
        tracks: [videoTrack, textTrack],
        markers: []
    };

    return {
        id: projectState.id,
        name: projectState.projectName,
        created: projectState.createdAt,
        modified: projectState.lastModified,
        settings: {
            width: projectState.resolution?.width || 1920,
            height: projectState.resolution?.height || 1080,
            fps: projectState.fps || 30
        },
        timeline,
        assets
    };
}
