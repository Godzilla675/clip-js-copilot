import { BaseMCPServer } from '@ai-video-editor/mcp-utils';
import { searchImagesTool } from './tools/search-images.js';
import { searchVideosTool } from './tools/search-videos.js';
import { searchAudioTool } from './tools/search-audio.js';
import { downloadAssetTool } from './tools/download.js';
import { checkConfig } from './config.js';

class AssetServer extends BaseMCPServer {
  constructor() {
    super('asset-server', '0.1.0');
    checkConfig();
  }

  registerTools(): void {
    this.server.tool(
      searchImagesTool.name,
      searchImagesTool.description,
      searchImagesTool.parameters.shape,
      searchImagesTool.handler
    );

    this.server.tool(
      searchVideosTool.name,
      searchVideosTool.description,
      searchVideosTool.parameters.shape,
      searchVideosTool.handler
    );

    this.server.tool(
      searchAudioTool.name,
      searchAudioTool.description,
      searchAudioTool.parameters.shape,
      searchAudioTool.handler
    );

    this.server.tool(
      downloadAssetTool.name,
      downloadAssetTool.description,
      downloadAssetTool.parameters.shape,
      downloadAssetTool.handler
    );
  }
}

const server = new AssetServer();
server.start().catch(console.error);
