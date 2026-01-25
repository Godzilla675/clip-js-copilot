import { BaseMCPServer } from "@ai-video-editor/mcp-utils";
import { ffmpegCommandTool } from "./tools/ffmpeg-command.js";
import { pythonScriptTool } from "./tools/python-script.js";

class CodeRunnerServer extends BaseMCPServer {
  constructor() {
    super("code-runner-server", "1.0.0");
  }

  registerTools(): void {
    this.server.tool(
      ffmpegCommandTool.name,
      ffmpegCommandTool.description,
      ffmpegCommandTool.inputSchema.shape,
      ffmpegCommandTool.handler
    );

    this.server.tool(
      pythonScriptTool.name,
      pythonScriptTool.description,
      pythonScriptTool.inputSchema.shape,
      pythonScriptTool.handler
    );
  }
}

const server = new CodeRunnerServer();
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
