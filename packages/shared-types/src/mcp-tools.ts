export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface VideoInfo {
  duration: number;
  resolution: { width: number; height: number };
  fps: number;
  codec: string;
}

import { TranscriptSegment } from './transcript';

export interface TranscriptResult {
  segments: TranscriptSegment[];
  language: string;
}

export interface SearchResultItem {
  url: string;
  thumbnail: string;
  title: string;
}

export interface SearchResult {
  items: SearchResultItem[];
}
