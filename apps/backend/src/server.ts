import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { config } from './config.js';
import { ProjectManager } from './project/state.js';
import { WebSocketHandler } from './websocket/handler.js';
import { createProjectRouter } from './routes/project.js';
import { createToolsRouter } from './routes/tools.js';
import { createCopilotRouter } from './routes/copilot.js';
import { initMCP } from './mcp/index.js';
import { LLMOrchestrator } from './llm/orchestrator.js';

export class Server {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private projectManager: ProjectManager;
  private orchestrator: LLMOrchestrator;
  private wsHandler: WebSocketHandler;
  private port: number;

  constructor(port?: number, projectDir?: string) {
    this.port = port || config.port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.projectManager = new ProjectManager(projectDir);

    let apiKey = '';
    if (config.llm.provider === 'anthropic') {
      apiKey = config.llm.anthropicApiKey;
    } else if (config.llm.provider === 'openai') {
      apiKey = config.llm.openaiApiKey;
    } else if (config.llm.provider === 'gemini') {
      apiKey = config.llm.geminiApiKey;
    }

    const llmConfig = {
      provider: config.llm.provider,
      apiKey,
      model: config.llm.model,
      baseUrl: config.llm.baseUrl
    };
    this.orchestrator = new LLMOrchestrator(llmConfig);

    this.wsHandler = new WebSocketHandler(this.wss, this.projectManager, this.orchestrator);

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
    this.app.use('/api/tools', createToolsRouter());
    this.app.use('/api/copilot', createCopilotRouter(this.orchestrator, this.projectManager));

    this.app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });
  }

  public async start() {
    try {
        // Initialize MCP connection
        await initMCP();
    } catch (error) {
        console.error('Failed to initialize MCP:', error);
        // Continue starting server even if MCP fails?
        // Probably yes, but functionality will be limited.
    }

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
