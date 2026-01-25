import { WebSocket, WebSocketServer } from 'ws';
import { ProjectManager } from '../project/state.js';
import { Project } from '@ai-video-editor/shared-types';

interface Message {
  type: string;
  payload: any;
}

export class WebSocketHandler {
  private wss: WebSocketServer;
  private projectManager: ProjectManager;

  constructor(wss: WebSocketServer, projectManager: ProjectManager) {
    this.wss = wss;
    this.projectManager = projectManager;

    this.wss.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as Message;
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

  private handleMessage(ws: WebSocket, message: Message) {
    switch (message.type) {
      case 'project.update':
        this.handleProjectUpdate(ws, message.payload);
        break;
      case 'copilot.message':
        this.handleCopilotMessage(ws, message.payload);
        break;
      case 'frames.request':
        // Handle frames request (Agent 08 - Vision?)
        // Placeholder
        console.log('Frames request received');
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleProjectUpdate(ws: WebSocket, payload: any) {
    // Expect payload to have changes. Ensure projectId is known.
    // If payload.projectId exists, use it. Or check payload.changes.id
    const projectId = payload.projectId || payload.changes?.id;
    const changes = payload.changes;

    if (!projectId || !changes) {
        console.error('Invalid project.update payload');
        return;
    }

    try {
        const updatedProject = this.projectManager.updateProject(projectId, changes);

        // Broadcast to all clients
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

  private handleCopilotMessage(ws: WebSocket, payload: any) {
    // Pass to LLM Orchestrator (Agent 05 - not ready yet)
    // For now, just echo or ignore.
    console.log('Copilot message received:', payload);

    // Send a placeholder response
    ws.send(JSON.stringify({
        type: 'copilot.response',
        payload: { content: "Backend received your message, but LLM Agent is not implemented yet.", done: true }
    }));
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
