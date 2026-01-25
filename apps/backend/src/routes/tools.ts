import { Router } from 'express';
import { mcpClientManager, toolRegistry } from '../mcp/index.js';

export function createToolsRouter(): Router {
  const router = Router();

  // List all available tools
  router.get('/', async (req, res) => {
    try {
      const tools = await toolRegistry.getTools();
      res.json({ tools });
    } catch (error) {
      console.error('Error listing tools:', error);
      res.status(500).json({ error: 'Failed to list tools' });
    }
  });

  // Invoke a tool manually
  router.post('/:server/:tool', async (req, res) => {
      const { server, tool } = req.params;
      const args = req.body;

      try {
          const result = await mcpClientManager.callTool(server, tool, args);
          res.json(result);
      } catch (error: any) {
          console.error(`Error invoking tool ${tool} on ${server}:`, error);
          res.status(500).json({ error: error.message || 'Tool execution failed' });
      }
  });

  return router;
}
