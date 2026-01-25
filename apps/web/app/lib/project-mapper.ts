import { ProjectState } from '../types';
import { Project, Track, Clip, Asset } from '@ai-video-editor/shared-types';
import { v4 as uuidv4 } from 'uuid';

export function frontendToBackend(frontend: ProjectState): Project {
    const assets: Asset[] = [];
    const assetMap = new Map<string, string>(); // fileId -> assetId

    // 1. Collect Assets from MediaFiles
    frontend.mediaFiles.forEach(file => {
        if (!assetMap.has(file.fileId)) {
            const assetId = uuidv4();
            assetMap.set(file.fileId, assetId);
            assets.push({
                id: assetId,
                name: file.fileName,
                path: file.src || '',
                type: file.type === 'video' || file.type === 'audio' || file.type === 'image' ? file.type : 'video',
                duration: file.endTime - file.startTime,
            });
        }
    });

    // 2. Build Tracks
    const videoTrack: Track = {
        id: 'track-video-1',
        type: 'video',
        name: 'Video',
        clips: [],
        muted: false,
        visible: true
    };

    const audioTrack: Track = {
        id: 'track-audio-1',
        type: 'audio',
        name: 'Audio',
        clips: [],
        muted: false,
        visible: true
    };

    frontend.mediaFiles.forEach(file => {
        const assetId = assetMap.get(file.fileId) || '';
        const clip: Clip = {
            id: file.id,
            assetId: assetId,
            trackId: file.type === 'audio' ? audioTrack.id : videoTrack.id,
            startTime: file.positionStart,
            duration: file.positionEnd - file.positionStart,
            sourceStart: file.startTime,
            sourceEnd: file.endTime,
            effects: [],
            volume: file.volume,
            opacity: file.opacity,
            speed: file.playbackSpeed,
            transform: {
                x: file.x || 0,
                y: file.y || 0,
                scale: 1,
                rotation: file.rotation || 0
            }
        };

        if (file.type === 'audio') {
            audioTrack.clips.push(clip);
        } else {
            videoTrack.clips.push(clip);
        }
    });

    const textTrack: Track = {
        id: 'track-text-1',
        type: 'text',
        name: 'Text',
        clips: [],
        muted: false,
        visible: true
    };

    frontend.textElements.forEach(text => {
        const clip: Clip = {
            id: text.id,
            assetId: '', // No asset for text
            trackId: textTrack.id,
            startTime: text.positionStart,
            duration: text.positionEnd - text.positionStart,
            sourceStart: 0,
            sourceEnd: text.positionEnd - text.positionStart,
            effects: [],
            text: text.text,
            transform: {
                x: text.x,
                y: text.y,
                scale: 1,
                rotation: text.rotation || 0
            }
        };
        textTrack.clips.push(clip);
    });

    return {
        id: frontend.id,
        name: frontend.projectName,
        created: frontend.createdAt,
        modified: frontend.lastModified,
        settings: {
            width: frontend.resolution.width,
            height: frontend.resolution.height,
            fps: frontend.fps
        },
        timeline: {
            duration: frontend.duration,
            tracks: [videoTrack, audioTrack, textTrack],
            markers: []
        },
        assets: assets
    };
}
