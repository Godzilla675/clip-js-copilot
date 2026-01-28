import { Router } from 'express';
import { LLMOrchestrator } from '../llm/orchestrator';
import { ProjectManager } from '../project/state';
import { toolRegistry, mcpClientManager } from '../mcp/index';
import { buildSystemPrompt } from '../llm/system-prompt';
import { Message } from '@ai-video-editor/shared-types';

export function createCopilotRouter(
  orchestrator: LLMOrchestrator,
  projectManager: ProjectManager
): Router {
  const router = Router();

  router.get('/models', async (req, res) => {
    try {
      const models = await orchestrator.getModels();
      res.json(models);
    } catch (error: any) {
      console.error('Failed to fetch models:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/chat', async (req, res) => {
    try {
      const { content, projectId, model } = req.body;

      const project = projectId ? projectManager.getProject(projectId) : undefined;

      // Get tools (MCP Tool definitions)
      const tools = await toolRegistry.getTools();

      // Build system prompt
      const systemPrompt = buildSystemPrompt({
          project,
          // Cast tools if types mismatch slightly (SDK Tool vs MCPTool)
          tools: tools as any
      });

      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content }
      ];

      const executeTool = async (name: string, args: any) => {
        const serverName = toolRegistry.getServerForTool(name);
        if (serverName) {
          return await mcpClientManager.callTool(serverName, name, args);
        } else {
          throw new Error(`Tool '${name}' not found.`);
        }
      };

      let currentResult = await orchestrator.chat(messages, tools as any, executeTool, { model });
      let iterations = 0;
      const MAX_ITERATIONS = 5;

      while (currentResult.toolCalls && currentResult.toolCalls.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;

        // Append assistant response
        messages.push({
          role: 'assistant',
          content: currentResult.content,
          toolCalls: currentResult.toolCalls
        });

        // Execute tools
        for (const call of currentResult.toolCalls) {
           const toolName = call.toolName;
           const toolCallId = call.toolCallId;

           try {
             const serverName = toolRegistry.getServerForTool(toolName);
             if (serverName) {
               console.log(`Executing tool ${toolName} on server ${serverName} with args:`, call.args);
               const toolResult = await mcpClientManager.callTool(serverName, toolName, call.args);

               messages.push({
                 role: 'user',
                 content: `Tool '${toolName}' result: ${JSON.stringify(toolResult)}`,
                 toolResults: [{
                    toolCallId,
                    toolName,
                    result: toolResult
                 }]
               });
             } else {
               messages.push({
                 role: 'user',
                 content: `Tool '${toolName}' not found.`,
                 toolResults: [{
                    toolCallId,
                    toolName,
                    result: { error: `Tool '${toolName}' not found.` },
                    isError: true
                 }]
               });
             }
           } catch (error: any) {
             console.error(`Tool execution failed: ${toolName}`, error);
             messages.push({
                 role: 'user',
                 content: `Tool '${toolName}' failed: ${error.message}`,
                 toolResults: [{
                    toolCallId,
                    toolName,
                    result: { error: error.message },
                    isError: true
                 }]
             });
           }
        }

        // Call LLM again
        currentResult = await orchestrator.chat(messages, tools as any, undefined, { model });
      }

      res.json({ content: currentResult.content });

    } catch (error: any) {
      console.error('Copilot chat error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
