import { WebSocket, WebSocketServer } from 'ws';
import { ProjectManager } from '../project/state.js';
import { LLMOrchestrator } from '../llm/orchestrator.js';
import { toolRegistry, mcpClientManager } from '../mcp/index.js';
import { buildSystemPrompt } from '../llm/system-prompt.js';
import { Message, ToolCall, MessageToolResult } from '@ai-video-editor/shared-types';
import { ToolExecutor } from '../llm/types.js';

interface WSMessage {
  type: string;
  payload: any;
}

const LOCAL_TOOLS = [{
    name: 'add_clip',
    description: 'Add a clip to the project timeline. Requires assetId, trackId, and startTime.',
    inputSchema: {
        type: 'object',
        properties: {
            projectId: { type: 'string', description: 'The ID of the project' },
            assetId: { type: 'string', description: 'The ID of the asset to add' },
            trackId: { type: 'string', description: 'The ID of the track to add to' },
            startTime: { type: 'number', description: 'Start time in seconds on the timeline' },
            clipDuration: { type: 'number', description: 'Duration of the clip in seconds (optional, defaults to asset duration)' },
            sourceStart: { type: 'number', description: 'Start time in source media (optional, defaults to 0)' }
        },
        required: ['projectId', 'assetId', 'trackId', 'startTime']
    }
}, {
    name: 'add_asset_to_project',
    description: 'Add a downloaded asset to the project. Requires projectId and filePath.',
    inputSchema: {
        type: 'object',
        properties: {
            projectId: { type: 'string', description: 'The ID of the project' },
            filePath: { type: 'string', description: 'The local path of the downloaded file (returned by download_asset)' },
            type: { type: 'string', description: 'The type of asset (video, audio, image)' }
        },
        required: ['projectId', 'filePath']
    }
}];

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

  private async handleProjectUpdate(ws: WebSocket, payload: any) {
    const projectId = payload.projectId || payload.changes?.id;
    const changes = payload.changes;

    if (!projectId || !changes) {
        console.error('Invalid project.update payload');
        return;
    }

    try {
        const updatedProject = await this.projectManager.updateProject(projectId, changes);

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

  private async executeTool(toolName: string, args: any): Promise<any> {
    if (toolName === 'add_clip') {
        try {
            const { projectId, assetId, trackId, startTime, clipDuration, sourceStart } = args as any;
            const clip = await this.projectManager.addClip(projectId, assetId, trackId, startTime, clipDuration, sourceStart);

            const project = this.projectManager.getProject(projectId);
            if (project) {
                this.broadcast({
                    type: 'project.updated',
                    payload: { project }
                });
            }

            return { success: true, message: 'Clip added successfully', clip };
        } catch (error: any) {
             return { error: error.message };
        }
    } else if (toolName === 'add_asset_to_project') {
        try {
            const { projectId, filePath, type } = args as any;
            const asset = await this.projectManager.addAsset(projectId, filePath, type);

            const project = this.projectManager.getProject(projectId);
            if (project) {
                this.broadcast({
                    type: 'project.updated',
                    payload: { project }
                });
            }

            return { success: true, message: 'Asset added successfully', asset };
        } catch (error: any) {
             return { error: error.message };
        }
    } else {
        const serverName = toolRegistry.getServerForTool(toolName);
        if (!serverName) {
            return { error: 'Tool server not found' };
        }
        return await mcpClientManager.callTool(serverName, toolName, args);
    }
  }

  private async handleCopilotMessage(ws: WebSocket, payload: any) {
    const { content, projectId, model } = payload;

    try {
        const project = projectId ? this.projectManager.getProject(projectId) : undefined;
        const tools = await toolRegistry.getTools();
        const allTools = [...tools, ...LOCAL_TOOLS];
        const systemPrompt = buildSystemPrompt({ project, tools: allTools as any });

        const wsWithHistory = ws as any;
        if (!wsWithHistory.chatHistory) {
            wsWithHistory.chatHistory = [];
        }

        // Add user message
        wsWithHistory.chatHistory.push({ role: 'user', content });

        const fullMessages: Message[] = [
            { role: 'system', content: systemPrompt },
            ...wsWithHistory.chatHistory
        ];

        // Define a wrapper for tool execution that sends notifications
        const executeToolWithNotifications: ToolExecutor = async (toolName: string, args: any) => {
            ws.send(JSON.stringify({
                type: 'copilot.tool_call',
                payload: { tool: toolName, args }
            }));
            try {
                const result = await this.executeTool(toolName, args);
                ws.send(JSON.stringify({
                    type: 'copilot.tool_result',
                    payload: { tool: toolName, result }
                }));
                return result;
            } catch (error: any) {
                 const result = { error: error.message };
                 ws.send(JSON.stringify({
                    type: 'copilot.tool_result',
                    payload: { tool: toolName, result }
                 }));
                 return result;
            }
        };

        const stream = this.orchestrator.streamChat(fullMessages, allTools as any, executeToolWithNotifications, { model });
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

                // For providers returning toolCalls (Orchestrated), we still notify manually here
                // Note: If using Agentic provider (Copilot), this block is skipped, but executeToolWithNotifications handles it.
                // If using Orchestrated provider (Anthropic), this block runs.

                ws.send(JSON.stringify({
                    type: 'copilot.tool_call',
                    payload: { tool: toolName, args }
                }));

                try {
                    const result = await this.executeTool(toolName, args);

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

                    // Recursive call for next chunk in this turn (for Orchestrated providers)
                    // We also pass executeToolWithNotifications just in case
                    const nextStream = this.orchestrator.streamChat(nextMessages, allTools as any, executeToolWithNotifications, { model });
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

        // Start recursive loop for subsequent turns
        await this.runAgentLoop(ws, fullMessages, allTools, wsWithHistory, systemPrompt, 0, executeToolWithNotifications, model);

    } catch (error: any) {
        console.error('Copilot handling error:', error);
        ws.send(JSON.stringify({
            type: 'copilot.response',
            payload: { content: `Error: ${error.message}`, done: true }
        }));
    }
  }

  private async runAgentLoop(
      ws: WebSocket,
      messages: Message[],
      tools: any[],
      wsWithHistory: any,
      systemPrompt: string,
      depth: number = 0,
      executeTool?: ToolExecutor,
      model?: string
  ) {
      if (depth > 10) {
          ws.send(JSON.stringify({
              type: 'copilot.response',
              payload: { content: "\n[System] Tool recursion limit reached.", done: true }
          }));
          return;
      }

      // Pass executeTool (Agentic providers will use it)
      const stream = this.orchestrator.streamChat(messages, tools, executeTool, { model });

      let assistantContent = '';
      const collectedToolCalls: ToolCall[] = [];

      for await (const chunk of stream) {
          if (chunk.content) {
              assistantContent += chunk.content;
              ws.send(JSON.stringify({
                  type: 'copilot.response',
                  payload: { content: chunk.content, done: false }
              }));
          }

          if (chunk.toolCall) {
              collectedToolCalls.push(chunk.toolCall);

              // Notify frontend of tool call (Orchestrated providers)
              ws.send(JSON.stringify({
                  type: 'copilot.tool_call',
                  payload: { tool: chunk.toolCall.toolName, args: chunk.toolCall.args }
              }));
          }
      }

      // Add the assistant's turn to history
      const assistantMessage: Message = {
          role: 'assistant',
          content: assistantContent,
          toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined
      };

      wsWithHistory.chatHistory.push(assistantMessage);

      // If no tools, we are done
      if (collectedToolCalls.length === 0) {
          ws.send(JSON.stringify({
              type: 'copilot.response',
              payload: { content: '', done: true }
          }));
          return;
      }

      // Execute tools (Orchestrated providers)
      const toolResults: MessageToolResult[] = [];

      for (const toolCall of collectedToolCalls) {
          const { toolName, args, toolCallId } = toolCall;
          let result: any;
          let isError = false;

          try {
              if (toolName === 'add_clip') {
                  try {
                      const { projectId, assetId, trackId, startTime, clipDuration, sourceStart } = args as any;
                      const clip = await this.projectManager.addClip(projectId, assetId, trackId, startTime, clipDuration, sourceStart);
                      result = { success: true, message: 'Clip added successfully', clip };
                  } catch (error: any) {
                       result = { error: error.message };
                       isError = true;
                  }
              } else if (toolName === 'add_asset_to_project') {
                  try {
                      const { projectId, filePath, type } = args as any;
                      const asset = await this.projectManager.addAsset(projectId, filePath, type);
                      result = { success: true, message: 'Asset added successfully', asset };
                  } catch (error: any) {
                       result = { error: error.message };
                       isError = true;
                  }
              } else {
                  const serverName = toolRegistry.getServerForTool(toolName);
                  if (!serverName) {
                      result = { error: 'Tool server not found' };
                      isError = true;
                  } else {
                      result = await mcpClientManager.callTool(serverName, toolName, args);
                  }
              }
          } catch (err: any) {
              result = { error: err.message };
              isError = true;
          }

          // Send result to frontend
          ws.send(JSON.stringify({
              type: 'copilot.tool_result',
              payload: { tool: toolName, result }
          }));

          toolResults.push({
              toolCallId,
              toolName,
              result,
              isError
          });
      }

      // Add all results to history as a single user message (required for Anthropic parallel tool use)
      if (toolResults.length > 0) {
          wsWithHistory.chatHistory.push({
              role: 'user',
              content: '',
              toolResults
          });
      }

      // Recursively call for next turn
      const nextMessages: Message[] = [
          { role: 'system', content: systemPrompt },
          ...wsWithHistory.chatHistory
      ];

      await this.runAgentLoop(ws, nextMessages, tools, wsWithHistory, systemPrompt, depth + 1, executeTool, model);
  }

  public setOrchestrator(orchestrator: LLMOrchestrator) {
    this.orchestrator = orchestrator;
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
