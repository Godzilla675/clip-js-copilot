export interface Clip {
  id: string;
  assetId: string;
  trackId: string;
  startTime: number;
  duration: number;
  sourceStart: number;
  sourceEnd: number;
  effects: any[];
  volume?: number;
  opacity?: number;
  speed?: number;
  transform?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  text?: string;
}

export interface Track {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image';
  name: string;
  clips: Clip[];
  muted: boolean;
  visible: boolean;
}

export interface Marker {
  time: number;
  label: string;
}

export interface Timeline {
  duration: number;
  tracks: Track[];
  markers: Marker[];
}
