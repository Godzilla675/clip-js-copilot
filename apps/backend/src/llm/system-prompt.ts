import { Project } from '@ai-video-editor/shared-types';
import { MCPTool } from './types';

export function buildSystemPrompt(context: {
  project?: Project;
  tools: MCPTool[];
}): string {
  const { project, tools } = context;

  let prompt = `You are an AI video editing assistant. You help users edit videos by managing a project timeline, finding assets, and performing video processing tasks.

## Capabilities
- You can search for images and videos from Pexels, Unsplash, etc.
- You can add assets to the project timeline.
- You can slice, trim, and arrange clips.
- You can analyze video content using vision tools.
- You can transcribe audio.
- You can run FFmpeg commands for advanced processing.

## Current Project
`;

  if (project) {
    prompt += `- Name: ${project.name}
- Resolution: ${project.settings.width}x${project.settings.height} @ ${project.settings.fps}fps
- Duration: ${project.timeline.duration}s
- Tracks: ${project.timeline.tracks.length}
`;

    // List tracks and clips summary
    project.timeline.tracks.forEach(track => {
      prompt += `  - Track "${track.name}" (${track.type}, id: ${track.id}): ${track.clips.length} clips\n`;
      track.clips.forEach(clip => {
         prompt += `    - Clip [${clip.startTime.toFixed(2)}s - ${(clip.startTime + clip.duration).toFixed(2)}s] (Asset: ${clip.assetId})\n`;
      });
    });

    prompt += `\n## Available Assets\n`;
    project.assets.forEach(asset => {
      prompt += `- ${asset.name} (ID: ${asset.id}, Type: ${asset.type})\n`;
    });

  } else {
    prompt += "No active project currently loaded.\n";
  }

  prompt += `
## Available Tools
You have access to the following tools:
`;

  tools.forEach(tool => {
    prompt += `- ${tool.name}: ${tool.description || 'No description'}\n`;
  });

  prompt += `
## Guidelines
1. When a user asks to edit the video, prefer using project manipulation tools (add_clip, etc.) over raw FFmpeg commands unless necessary.
2. If you need to find an asset, search for it first, then download it, then add it to the timeline.
3. Use 'find_scene_changes' or 'analyze_frame' to understand video content before making content-based edits.
4. Always confirm before doing destructive operations like deleting the project.
5. If the user asks for something you can't do directly, explain why or offer a workaround.
6. When using tools, ensure you use the correct arguments as defined in the tool schema.
`;

  return prompt;
}
