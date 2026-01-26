import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MCPClientManager } from './client-manager.js';

export class ToolRegistry {
  private clientManager: MCPClientManager;
  private toolToServer: Map<string, string>; // toolName -> serverName

  constructor(clientManager: MCPClientManager) {
    this.clientManager = clientManager;
    this.toolToServer = new Map();
  }

  async initialize(): Promise<void> {
    console.log('Initializing ToolRegistry...');
    const clients = this.clientManager.getAllClients();

    await Promise.all(
      Array.from(clients.entries()).map(async ([serverName, client]) => {
        try {
            const result = await client.listTools();
            for (const tool of result.tools) {
                this.toolToServer.set(tool.name, serverName);
                console.log(`Registered tool ${tool.name} from server ${serverName}`);
            }
        } catch (error) {
            console.error(`Failed to fetch tools from ${serverName}:`, error);
        }
      })
    );
  }

  async getTools(): Promise<Tool[]> {
      const clients = this.clientManager.getAllClients();

      const results = await Promise.all(
        Array.from(clients.entries()).map(async ([serverName, client]) => {
            try {
                const result = await client.listTools();
                // Update map
                for (const tool of result.tools) {
                    this.toolToServer.set(tool.name, serverName);
                }
                return result.tools;
            } catch (e) {
                console.error(`Error listing tools for ${serverName}`, e);
                return [];
            }
        })
      );

      return results.flat();
  }

  getServerForTool(toolName: string): string | undefined {
    return this.toolToServer.get(toolName);
  }
}
