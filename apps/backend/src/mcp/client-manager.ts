import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export class MCPClientManager {
  private clients: Map<string, Client>;

  constructor() {
    this.clients = new Map();
  }

  async connectServer(name: string, command: string, args: string[], env?: Record<string, string>): Promise<void> {
    try {
      console.log(`Connecting to MCP server ${name} with command: ${command} ${args.join(' ')}`);
      const transport = new StdioClientTransport({
        command,
        args,
        env: env ? { ...(process.env as Record<string, string>), ...env } : undefined
      });

      const client = new Client(
        {
          name: "ai-video-editor-backend",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);
      this.clients.set(name, client);
      console.log(`Connected to MCP server: ${name}`);
    } catch (error) {
      console.error(`Failed to connect to MCP server ${name}:`, error);
      throw error;
    }
  }

  async disconnectServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.close();
      this.clients.delete(name);
      console.log(`Disconnected from MCP server: ${name}`);
    }
  }

  async listTools(serverName: string): Promise<Tool[]> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not connected`);
    }
    const result = await client.listTools();
    return result.tools;
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
      const client = this.clients.get(serverName);
      if (!client) {
          throw new Error(`Server ${serverName} not connected`);
      }

      const result = await client.callTool({
          name: toolName,
          arguments: args,
      });

      return result;
  }

  getClient(name: string): Client | undefined {
      return this.clients.get(name);
  }

  getAllClients(): Map<string, Client> {
      return this.clients;
  }
}
