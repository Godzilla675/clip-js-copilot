export type MediaType = 'video' | 'audio' | 'image' | 'unknown';

export interface UploadedFile {
    id: string;
    file: File;
    type?: MediaType;
    src?: string;
}

export interface MediaFile {
    id: string;
    fileName: string;
    fileId: string;
    type: MediaType;
    startTime: number;  // within the source video
    src?: string;
    serverPath?: string; // Real file path on server for backend processing
    endTime: number;
    positionStart: number;  // position in the final video
    positionEnd: number;
    includeInMerge: boolean;
    playbackSpeed: number;
    volume: number;
    zIndex: number;

    // Optional visual settings
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    opacity?: number;

    // Effects
    crop?: { x: number; y: number; width: number; height: number };
}

export interface TextElement {
    id: string;
    text: string;                     // The actual text content
    includeInMerge?: boolean;

    // Timing
    positionStart: number;           // When text appears in final video
    positionEnd: number;             // When text disappears

    // Position & Size (canvas-based)
    x: number;
    y: number;
    width?: number;
    height?: number;

    // Styling
    font?: string;                   // Font family (e.g., 'Arial', 'Roboto')
    fontSize?: number;               // Font size in pixels
    fontWeight?: string;             // Font weight (e.g., 'normal', 'bold', '400')
    fontStyle?: string;              // Font style (e.g., 'normal', 'italic')
    textDecoration?: string;         // Text decoration (e.g., 'none', 'underline')
    textTransform?: string;          // Text transform (e.g., 'uppercase')
    letterSpacing?: number;          // Letter spacing in pixels
    lineHeight?: number;             // Line height (multiplier or px)

    color?: string;                  // Text color (hex or rgba)
    backgroundColor?: string;       // Background behind text
    align?: 'left' | 'center' | 'right'; // Horizontal alignment
    zIndex?: number;                 // Layering

    // Advanced Effects
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    outlineColor?: string;
    outlineWidth?: number;

    // Effects
    opacity?: number;                // Transparency (0 to 1)
    rotation?: number;               // Rotation in degrees
    fadeInDuration?: number;        // Seconds to fade in
    fadeOutDuration?: number;       // Seconds to fade out
    animation?: 'slide-in' | 'zoom' | 'bounce' | 'none'; // Optional animation

    // Runtime only (not persisted)
    visible?: boolean;              // Internal flag for rendering logic
}


export type ExportFormat = 'mp4' | 'webm' | 'gif' | 'mov';

export interface ExportConfig {
    resolution: string;
    quality: string;
    speed: string;
    fps: number;
    format: ExportFormat; // TODO: add this as an option
    includeSubtitles: boolean;
}

export type ActiveElement = 'media' | 'text' | 'export';


export interface LibraryFile {
    id: string;
    fileId: string;
    fileName: string;
    type: MediaType;
    src?: string;
    serverPath?: string;
    createdAt: string;
}

export interface ProjectState {
    id: string;
    libraryFiles: LibraryFile[];
    mediaFiles: MediaFile[];
    textElements: TextElement[];
    filesID?: string[],
    currentTime: number;
    isPlaying: boolean;
    isMuted: boolean;
    duration: number;
    zoomLevel: number;
    timelineZoom: number;
    enableMarkerTracking: boolean;
    projectName: string;
    createdAt: string;
    lastModified: string;
    activeSection: ActiveElement;
    activeElement: ActiveElement | null;
    activeElementIndex: number;

    resolution: { width: number; height: number };
    fps: number;
    aspectRatio: string;
    history: ProjectState[]; // stack for undo
    future: ProjectState[]; // stack for redo
    exportSettings: ExportConfig;
}

export const mimeToExt = {
    'video/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/webm': 'webm',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/x-matroska': 'mkv',
    'video/ogg': 'ogv',
    'audio/aac': 'aac',
    'audio/ogg': 'ogg',
    'audio/webm': 'weba',
    // TODO: Add more as needed
};