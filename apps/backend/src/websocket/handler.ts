import { WebSocket, WebSocketServer } from 'ws';
import { ProjectManager } from '../project/state.js';
import { LLMOrchestrator } from '../llm/orchestrator.js';
import { toolRegistry, mcpClientManager } from '../mcp/index.js';
import { buildSystemPrompt } from '../llm/system-prompt.js';
import { Message } from '@ai-video-editor/shared-types';

interface WSMessage {
  type: string;
  payload: any;
}

export class WebSocketHandler {
  private wss: WebSocketServer;
  private projectManager: ProjectManager;
  private orchestrator: LLMOrchestrator;

  constructor(wss: WebSocketServer, projectManager: ProjectManager, orchestrator: LLMOrchestrator) {
    this.wss = wss;
    this.projectManager = projectManager;
    this.orchestrator = orchestrator;

    this.wss.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as WSMessage;
          this.handleMessage(ws, message);
        } catch (err) {
          console.error('Failed to parse message', err);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WSMessage) {
    switch (message.type) {
      case 'project.update':
        this.handleProjectUpdate(ws, message.payload);
        break;
      case 'copilot.message':
        this.handleCopilotMessage(ws, message.payload);
        break;
      case 'frames.request':
        console.log('Frames request received');
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleProjectUpdate(ws: WebSocket, payload: any) {
    const projectId = payload.projectId || payload.changes?.id;
    const changes = payload.changes;

    if (!projectId || !changes) {
        console.error('Invalid project.update payload');
        return;
    }

    try {
        const updatedProject = this.projectManager.updateProject(projectId, changes);

        this.broadcast({
            type: 'project.updated',
            payload: { project: updatedProject }
        });
    } catch (error) {
        console.error('Error updating project:', error);
        ws.send(JSON.stringify({
            type: 'error',
            payload: { message: error instanceof Error ? error.message : 'Unknown error' }
        }));
    }
  }

  private async handleCopilotMessage(ws: WebSocket, payload: any) {
    const { content, projectId } = payload;

    try {
        const project = projectId ? this.projectManager.getProject(projectId) : undefined;

        const tools = await toolRegistry.getTools();
        const systemPrompt = buildSystemPrompt({ project, tools: tools as any });

        const wsWithHistory = ws as any;
        if (!wsWithHistory.chatHistory) {
            wsWithHistory.chatHistory = [];
        }

        wsWithHistory.chatHistory.push({ role: 'user', content });

        const fullMessages: Message[] = [
            { role: 'system', content: systemPrompt },
            ...wsWithHistory.chatHistory
        ];

        const stream = this.orchestrator.streamChat(fullMessages, tools as any);
        let assistantContent = '';

        for await (const chunk of stream) {
            if (chunk.content) {
                assistantContent += chunk.content;
                ws.send(JSON.stringify({
                    type: 'copilot.response',
                    payload: { content: chunk.content, done: false }
                }));
            }

            if (chunk.toolCall && chunk.toolCall.toolName && chunk.toolCall.args) {
                const toolName = chunk.toolCall.toolName;
                const args = chunk.toolCall.args;

                ws.send(JSON.stringify({
                    type: 'copilot.tool_call',
                    payload: { tool: toolName, args }
                }));

                try {
                    const serverName = toolRegistry.getServerForTool(toolName);
                    let result: any = { error: 'Tool server not found' };

                    if (serverName) {
                        result = await mcpClientManager.callTool(serverName, toolName, args);
                    }

                    ws.send(JSON.stringify({
                        type: 'copilot.tool_result',
                        payload: { tool: toolName, result }
                    }));

                    if (assistantContent) {
                        wsWithHistory.chatHistory.push({ role: 'assistant', content: assistantContent });
                        assistantContent = '';
                    }

                    wsWithHistory.chatHistory.push({
                        role: 'assistant',
                        content: `Requesting tool: ${toolName}`
                    });

                    wsWithHistory.chatHistory.push({
                            role: 'user',
                            content: `Tool '${toolName}' result: ${JSON.stringify(result)}`
                    });

                    // Trigger next turn
                    const nextMessages: Message[] = [
                        { role: 'system', content: systemPrompt },
                        ...wsWithHistory.chatHistory
                    ];

                    const nextStream = this.orchestrator.streamChat(nextMessages, tools as any);
                        for await (const nextChunk of nextStream) {
                            if (nextChunk.content) {
                                assistantContent += nextChunk.content;
                                ws.send(JSON.stringify({
                                    type: 'copilot.response',
                                    payload: { content: nextChunk.content, done: false }
                                }));
                            }
                        }

                } catch (err: any) {
                    ws.send(JSON.stringify({
                        type: 'copilot.response',
                        payload: { content: `\nError executing tool: ${err.message}`, done: false }
                    }));
                }
            }
        }

        if (assistantContent) {
            wsWithHistory.chatHistory.push({ role: 'assistant', content: assistantContent });
        }

        ws.send(JSON.stringify({
            type: 'copilot.response',
            payload: { content: '', done: true }
        }));

    } catch (error: any) {
        console.error('Copilot handling error:', error);
        ws.send(JSON.stringify({
            type: 'copilot.response',
            payload: { content: `Error: ${error.message}`, done: true }
        }));
    }
  }

  private broadcast(message: any) {
    const data = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}
