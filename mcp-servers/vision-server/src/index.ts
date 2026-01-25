import { BaseMCPServer } from '@ai-video-editor/mcp-utils';
import { registerExtractFramesTool } from './tools/extract-frames.js';
import { registerAnalyzeFrameTool } from './tools/analyze-frame.js';
import { registerSceneDetectionTool } from './tools/scene-detection.js';
import { registerDescribeSegmentTool } from './tools/describe-segment.js';
import './setup-ffmpeg.js';

class VisionServer extends BaseMCPServer {
  constructor() {
    super('vision-server', '1.0.0');
  }

  registerTools(): void {
    registerExtractFramesTool(this.server);
    registerAnalyzeFrameTool(this.server);
    registerSceneDetectionTool(this.server);
    registerDescribeSegmentTool(this.server);
  }
}

const server = new VisionServer();
server.start().catch((error) => {
  console.error("Server failed to start", error);
  process.exit(1);
});
