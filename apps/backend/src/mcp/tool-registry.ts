import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MCPClientManager } from './client-manager.js';

export class ToolRegistry {
  private clientManager: MCPClientManager;
  private toolToServer: Map<string, string>; // toolName -> serverName
  private toolsCache: Tool[] | null = null;

  constructor(clientManager: MCPClientManager) {
    this.clientManager = clientManager;
    this.toolToServer = new Map();
  }

  async initialize(): Promise<void> {
    console.log('Initializing ToolRegistry...');
    await this.refreshTools();
  }

  private async refreshTools(): Promise<Tool[]> {
    const clients = this.clientManager.getAllClients();

    const results = await Promise.all(
      Array.from(clients.entries()).map(async ([serverName, client]) => {
        try {
          const result = await client.listTools();
          for (const tool of result.tools) {
            this.toolToServer.set(tool.name, serverName);
          }
          console.log(`Registered ${result.tools.length} tools from server ${serverName}`);
          return result.tools;
        } catch (error) {
          console.error(`Failed to fetch tools from ${serverName}:`, error);
          return [];
        }
      })
    );

    const allTools = results.flat();
    this.toolsCache = allTools;
    return allTools;
  }

  async getTools(): Promise<Tool[]> {
    if (this.toolsCache) {
      return this.toolsCache;
    }
    return this.refreshTools();
  }

  getServerForTool(toolName: string): string | undefined {
    return this.toolToServer.get(toolName);
  }
}
