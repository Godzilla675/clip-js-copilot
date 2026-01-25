import express from 'express';
import { toolRegistry, mcpClientManager } from '../mcp/index.js';

export const createToolsRouter = (): express.Router => {
  const router = express.Router();

  router.get('/', (req, res) => {
    const tools = toolRegistry.getTools();
    res.json(tools);
  });

  router.post('/:name', async (req, res) => {
    const { name } = req.params;
    const args = req.body;

    const serverName = toolRegistry.getServerForTool(name);
    if (!serverName) {
      return res.status(404).json({ error: `Tool ${name} not found` });
    }

    try {
      const result = await mcpClientManager.callTool(serverName, name, args);
      res.json(result);
    } catch (error: any) {
      console.error(`Error executing tool ${name}:`, error);
      res.status(500).json({ error: error.message || 'Tool execution failed' });
    }
  });

  return router;
};
