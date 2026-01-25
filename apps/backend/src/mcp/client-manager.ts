import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();

  async connectToServer(name: string, command: string, args: string[]): Promise<void> {
    try {
      console.log(`Connecting to MCP server ${name} with command: ${command} ${args.join(' ')}`);
      const transport = new StdioClientTransport({
        command,
        args,
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
      // We don't throw here to allow other servers to connect
    }
  }

  async disconnectServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      try {
        await client.close();
      } catch (e) {
        console.error(`Error closing connection to ${name}:`, e);
      }
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

  async listAllTools(): Promise<{ serverName: string; tool: Tool }[]> {
    const allTools: { serverName: string; tool: Tool }[] = [];
    for (const [name, client] of this.clients.entries()) {
      try {
        const result = await client.listTools();
        allTools.push(...result.tools.map((t) => ({ serverName: name, tool: t })));
      } catch (e) {
        console.error(`Failed to list tools for ${name}:`, e);
      }
    }
    return allTools;
  }

  async callTool(serverName: string, toolName: string, args: Record<string, unknown>): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server ${serverName} not connected`);
    }
    return await client.callTool({
      name: toolName,
      arguments: args,
    });
  }

  getClient(name: string): Client | undefined {
    return this.clients.get(name);
  }
}
