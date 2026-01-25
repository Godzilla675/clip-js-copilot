import { MCPClientManager } from "./client-manager.js";
import { ToolRegistry } from "./tool-registry.js";
import { serverConfigs } from "./server-configs.js";

export const mcpClientManager = new MCPClientManager();
export const toolRegistry = new ToolRegistry(mcpClientManager);

export { MCPClientManager, ToolRegistry, serverConfigs };

export const initMCP = async () => {
    console.log("Initializing MCP Client...");
    // Connect to servers
    for (const [name, config] of Object.entries(serverConfigs)) {
        await mcpClientManager.connectToServer(name, config.command, config.args);
    }

    // Initialize registry
    await toolRegistry.initialize();
    console.log("MCP Client initialized.");
}
