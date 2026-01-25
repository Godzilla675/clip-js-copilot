import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { MCPClientManager } from "./client-manager.js";

export class ToolRegistry {
  private clientManager: MCPClientManager;
  private toolToServerMap: Map<string, string> = new Map();
  private cachedTools: Tool[] = [];

  constructor(clientManager: MCPClientManager) {
    this.clientManager = clientManager;
  }

  async initialize(): Promise<void> {
    await this.refreshTools();
  }

  async refreshTools(): Promise<void> {
    const allToolsWithServer = await this.clientManager.listAllTools();
    this.toolToServerMap.clear();
    this.cachedTools = [];

    for (const { serverName, tool } of allToolsWithServer) {
      this.toolToServerMap.set(tool.name, serverName);
      this.cachedTools.push(tool);
    }
    console.log(`Tool registry refreshed. Found ${this.cachedTools.length} tools.`);
  }

  getServerForTool(toolName: string): string | undefined {
    return this.toolToServerMap.get(toolName);
  }

  getTools(): Tool[] {
    return this.cachedTools;
  }
}
