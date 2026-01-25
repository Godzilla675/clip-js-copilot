import { MCPClientManager } from './client-manager.js';
import { ToolRegistry } from './tool-registry.js';
import { serverConfigs } from './server-configs.js';

export const mcpClientManager = new MCPClientManager();
export const toolRegistry = new ToolRegistry(mcpClientManager);

export async function initMCP() {
  console.log('Initializing MCP connections...');

  // Connect to all configured servers
  for (const [name, config] of Object.entries(serverConfigs)) {
    try {
      await mcpClientManager.connectServer(name, config.command, config.args);
    } catch (error) {
      console.error(`Failed to connect to ${name} MCP server:`, error);
    }
  }

  // Initialize registry (discover tools)
  await toolRegistry.initialize();

  console.log('MCP initialization complete');
}

export { MCPClientManager, ToolRegistry };
