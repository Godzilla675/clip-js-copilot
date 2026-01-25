import { BaseMCPServer } from '@ai-video-editor/mcp-utils';
import { registerGetVideoInfo } from './tools/info.js';
import { registerTrimVideo } from './tools/trim.js';
import { registerConcatVideos } from './tools/concat.js';
import { registerAudioTools } from './tools/audio.js';
import { registerTextOverlayTool } from './tools/text-overlay.js';
import { registerFilterTool } from './tools/filters.js';
import { registerSpeedTool } from './tools/speed.js';
import { registerExportTool } from './tools/export.js';

class FFmpegServer extends BaseMCPServer {
  constructor() {
    super('ffmpeg-server', '0.0.1');
  }

  registerTools(): void {
    registerGetVideoInfo(this.server as any);
    registerTrimVideo(this.server as any);
    registerConcatVideos(this.server as any);
    registerAudioTools(this.server as any);
    registerTextOverlayTool(this.server as any);
    registerFilterTool(this.server as any);
    registerSpeedTool(this.server as any);
    registerExportTool(this.server as any);
  }
}

const server = new FFmpegServer();
server.start().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
