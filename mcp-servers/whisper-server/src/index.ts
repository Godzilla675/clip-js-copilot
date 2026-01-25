import { BaseMCPServer } from '@ai-video-editor/mcp-utils';
import { registerTranscribeTool } from './tools/transcribe.js';
import { registerSilenceTool } from './tools/silence.js';
import { registerSubtitlesTool } from './tools/subtitles.js';

class WhisperServer extends BaseMCPServer {
  constructor() {
    super("whisper-server", "0.1.0");
  }

  registerTools(): void {
    registerTranscribeTool(this.server as any);
    registerSilenceTool(this.server as any);
    registerSubtitlesTool(this.server as any);
  }
}

const server = new WhisperServer();
server.start().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
