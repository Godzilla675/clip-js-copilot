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
    registerGetVideoInfo(this.server);
    registerTrimVideo(this.server);
    registerConcatVideos(this.server);
    registerAudioTools(this.server);
    registerTextOverlayTool(this.server);
    registerFilterTool(this.server);
    registerSpeedTool(this.server);
    registerExportTool(this.server);
  }
}

const server = new FFmpegServer();
server.start().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
