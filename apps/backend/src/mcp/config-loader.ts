import fs from 'fs';
import path from 'path';

export interface CustomMCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

export interface MCPConfig {
  mcpServers: Record<string, CustomMCPServerConfig>;
}

const getRootDir = () => {
    // fast check if we are in apps/backend
    if (process.cwd().endsWith('backend')) {
        return path.resolve(process.cwd(), '../..');
    }
    return process.cwd();
};

export const ROOT_DIR = getRootDir();

export function loadCustomServers(): Record<string, { command: string, args: string[], env?: Record<string, string> }> {
  const configPath = path.resolve(ROOT_DIR, 'mcp.config.json');

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(fileContent) as MCPConfig;

    if (!config.mcpServers) {
        return {};
    }

    const servers: Record<string, { command: string, args: string[], env?: Record<string, string> }> = {};

    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        if (serverConfig.disabled) continue;

        servers[name] = {
            command: serverConfig.command,
            args: serverConfig.args,
            env: serverConfig.env
        };
    }

    console.log(`Loaded ${Object.keys(servers).length} custom MCP servers from ${configPath}`);
    return servers;

  } catch (error) {
    console.error('Failed to load mcp.config.json:', error);
    return {};
  }
}
