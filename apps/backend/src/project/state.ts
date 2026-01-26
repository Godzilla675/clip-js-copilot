import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectSettings, Clip } from '@ai-video-editor/shared-types';
import { config } from '../config.js';
import { HistoryManager } from './history.js';

export class ProjectManager {
  private projects: Map<string, Project> = new Map();
  private histories: Map<string, HistoryManager> = new Map();
  private projectDir: string;

  constructor(projectDir?: string) {
    this.projectDir = projectDir || config.projectDir;
  }

  createProject(name: string, settings: ProjectSettings): Project {
    const id = uuidv4();
    const now = new Date().toISOString();
    const project: Project = {
      id,
      name,
      created: now,
      modified: now,
      settings,
      timeline: {
        duration: 0,
        tracks: [
            { id: uuidv4(), type: 'video', name: 'Video 1', clips: [], muted: false, visible: true },
            { id: uuidv4(), type: 'audio', name: 'Audio 1', clips: [], muted: false, visible: true }
        ],
        markers: []
      },
      assets: []
    };

    this.projects.set(id, project);
    this.histories.set(id, new HistoryManager());

    // Save to disk
    this.saveProject(project);

    return project;
  }

  async loadProject(projectIdOrPath: string): Promise<Project> {
    // Check if it's an ID we already have loaded
    if (this.projects.has(projectIdOrPath)) {
        return this.projects.get(projectIdOrPath)!;
    }

    let projectPath = projectIdOrPath;
    // If it looks like an ID (UUID) or just a name, try to find it in project dir
    if (!path.isAbsolute(projectIdOrPath) && !projectIdOrPath.endsWith('.json')) {
        projectPath = path.join(this.projectDir, `${projectIdOrPath}.json`);
    } else if (!path.isAbsolute(projectIdOrPath)) {
        projectPath = path.join(this.projectDir, projectIdOrPath);
    }

    try {
      const data = await fs.promises.readFile(projectPath, 'utf-8');
      const project = JSON.parse(data) as Project;

      this.projects.set(project.id, project);
      if (!this.histories.has(project.id)) {
          this.histories.set(project.id, new HistoryManager());
      }

      return project;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Project file not found: ${projectPath}`);
      }
      throw error;
    }
  }

  saveProject(project: Project): void {
    const filePath = path.join(this.projectDir, `${project.id}.json`);

    // Ensure directory exists
    if (!fs.existsSync(this.projectDir)) {
        fs.mkdirSync(this.projectDir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(project, null, 2));
  }

  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  updateProject(id: string, updates: Partial<Project>): Project {
    const project = this.projects.get(id);
    if (!project) {
        throw new Error(`Project ${id} not found`);
    }

    const history = this.histories.get(id);
    if (history) {
        history.push(project);
    }

    const updatedProject: Project = {
        ...project,
        ...updates,
        modified: new Date().toISOString()
    };

    this.projects.set(id, updatedProject);
    this.saveProject(updatedProject);

    return updatedProject;
  }

  addClip(
    projectId: string,
    assetId: string,
    trackId: string,
    startTime: number,
    clipDuration?: number,
    sourceStart: number = 0
  ): Clip {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found in project`);
    }

    const track = project.timeline.tracks.find(t => t.id === trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found in project`);
    }

    // Default duration to asset duration if not provided, or 5s if image/unknown
    const duration = clipDuration || asset.duration || 5;

    const clip: Clip = {
      id: uuidv4(),
      assetId,
      trackId,
      startTime,
      duration,
      sourceStart,
      sourceEnd: sourceStart + duration,
      effects: [],
      transform: { x: 0, y: 0, scale: 1, rotation: 0 }
    };

    // Create a deep copy of the track to modify
    const updatedTrack = { ...track, clips: [...track.clips, clip] };

    // Sort clips by start time? Optional but good practice.
    updatedTrack.clips.sort((a, b) => a.startTime - b.startTime);

    // Update project
    const updatedTracks = project.timeline.tracks.map(t =>
      t.id === trackId ? updatedTrack : t
    );

    // Calculate new duration
    const newDuration = Math.max(
      project.timeline.duration,
      startTime + duration
    );

    const updates: Partial<Project> = {
      timeline: {
        ...project.timeline,
        duration: newDuration,
        tracks: updatedTracks
      }
    };

    this.updateProject(projectId, updates);

    return clip;
  }

  undo(id: string): Project | undefined {
    const project = this.projects.get(id);
    const history = this.histories.get(id);
    if (!project || !history) return undefined;

    const prev = history.undo(project);
    if (prev) {
        this.projects.set(id, prev);
        this.saveProject(prev);
        return prev;
    }
    return undefined;
  }

  redo(id: string): Project | undefined {
    const project = this.projects.get(id);
    const history = this.histories.get(id);
    if (!project || !history) return undefined;

    const next = history.redo(project);
    if (next) {
        this.projects.set(id, next);
        this.saveProject(next);
        return next;
    }
    return undefined;
  }
}
