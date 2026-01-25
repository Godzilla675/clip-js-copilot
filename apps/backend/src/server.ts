// Placeholder server entry point created by Agent 05
// Agent 04 will implement the full server.
console.log('Backend server placeholder. Agent 04 has not yet implemented the core server.');
console.log('LLM Orchestrator is available at src/llm/');

import express from 'express';
const app = express();
const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('AI Video Editor Backend (Placeholder)');
});

// Start if run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Placeholder server running on port ${port}`);
  });
}

export default app;
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { config } from './config.js';
import { ProjectManager } from './project/state.js';
import { WebSocketHandler } from './websocket/handler.js';
import { createProjectRouter } from './routes/project.js';

export class Server {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private projectManager: ProjectManager;
  private wsHandler: WebSocketHandler;
  private port: number;

  constructor(port?: number, projectDir?: string) {
    this.port = port || config.port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.projectManager = new ProjectManager(projectDir);
    this.wsHandler = new WebSocketHandler(this.wss, this.projectManager);

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors({
        origin: 'http://localhost:3000', // Frontend URL
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }));
    this.app.use(express.json());
  }

  private setupRoutes() {
    this.app.use('/api/project', createProjectRouter(this.projectManager));

    this.app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });
  }

  public start() {
    this.server.listen(this.port, () => {
      console.log(`Backend server running on port ${this.port}`);
      console.log(`WebSocket server ready`);
    });
  }

  // Helper for testing
  public getApp() {
      return this.app;
  }

  public stop() {
      this.server.close();
  }
}
