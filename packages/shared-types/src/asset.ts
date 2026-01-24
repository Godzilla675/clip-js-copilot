import { Transcript } from './transcript';

export type AssetType = 'video' | 'audio' | 'image';

export interface Asset {
  id: string;
  name: string;
  path: string;
  type: AssetType;
  duration?: number;
  resolution?: { width: number; height: number };
  thumbnailPath?: string;
  transcript?: Transcript;
}
