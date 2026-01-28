import { MCPClientManager } from './client-manager.js';
import { ToolRegistry } from './tool-registry.js';
import { serverConfigs } from './server-configs.js';
import { loadCustomServers } from './config-loader.js';

export const mcpClientManager = new MCPClientManager();
export const toolRegistry = new ToolRegistry(mcpClientManager);

export async function initMCP() {
  console.log('Initializing MCP connections...');

  const customServers = loadCustomServers();
  const allServers = { ...serverConfigs, ...customServers };

  // Connect to all configured servers in parallel
  await Promise.all(
    Object.entries(allServers).map(async ([name, config]) => {
      try {
        const conf = config as { command: string; args: string[]; env?: Record<string, string> };
        await mcpClientManager.connectServer(name, conf.command, conf.args, conf.env);
      } catch (error) {
        console.error(`Failed to connect to ${name} MCP server:`, error);
      }
    })
  );

  // Initialize registry (discover tools)
  await toolRegistry.initialize();

  console.log('MCP initialization complete');
}

export { MCPClientManager, ToolRegistry };
