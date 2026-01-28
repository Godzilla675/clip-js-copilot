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
    this.toolsCache = await this.fetchTools();
  }

  private async fetchTools(): Promise<Tool[]> {
      const clients = this.clientManager.getAllClients();

      const results = await Promise.all(
        Array.from(clients.entries()).map(async ([serverName, client]) => {
            try {
                const result = await client.listTools();
                for (const tool of result.tools) {
                    this.toolToServer.set(tool.name, serverName);
                    console.log(`Registered tool ${tool.name} from server ${serverName}`);
                }
                return result.tools;
            } catch (error) {
                console.error(`Failed to fetch tools from ${serverName}:`, error);
                return [];
            }
        })
      );

      return results.flat();
  }

  async getTools(): Promise<Tool[]> {
      if (this.toolsCache) {
          return this.toolsCache;
      }

      this.toolsCache = await this.fetchTools();
      return this.toolsCache;
  }

  getServerForTool(toolName: string): string | undefined {
    return this.toolToServer.get(toolName);
  }
}
