import { Timeline } from './timeline';
import { Asset } from './asset';

export interface ProjectSettings {
  width: number;
  height: number;
  fps: number;
}

export interface Project {
  id: string;
  name: string;
  created: string; // ISO date
  modified: string;
  settings: ProjectSettings;
  timeline: Timeline;
  assets: Asset[];
}
