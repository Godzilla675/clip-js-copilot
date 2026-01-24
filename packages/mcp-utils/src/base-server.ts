import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * Base class for MCP servers.
 * Provides common functionality for initialization, tool registration, and startup.
 */
export abstract class BaseMCPServer {
  protected server: McpServer;
  protected name: string;
  protected version: string;

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
    this.server = new McpServer({
      name,
      version,
    });
  }

  /**
   * Implement this method to register tools with the server.
   * Use this.server.tool(...) to register tools.
   */
  abstract registerTools(): void;

  /**
   * Starts the server using Stdio transport.
   */
  async start(): Promise<void> {
    this.registerTools();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${this.name} MCP Server running on stdio`);
  }
}
