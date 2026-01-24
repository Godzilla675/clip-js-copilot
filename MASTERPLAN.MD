

## MASTER_PLAN.md

Create this file in the root of your forked Clip-js repo:

```markdown
# AI VIDEO EDITOR - MASTER DEVELOPMENT PLAN

## Project Overview

We are building an AI-powered video editor with a copilot interface. The AI can:
- See video frames and understand content
- Transcribe audio using Whisper
- Fetch assets from the internet
- Execute FFmpeg operations
- Make edits based on natural language commands

## Architecture Summary

```
Frontend (Clip-js/Next.js) <--WebSocket--> Backend (Node.js) <--MCP--> MCP Servers
```

The backend acts as an orchestrator that:
1. Manages project state (the Edit Decision List / timeline data)
2. Connects to an LLM (Claude, GPT-4, or custom)
3. Uses MCP to call tools exposed by MCP servers
4. Sends real-time updates to the frontend via WebSocket

## Technology Stack

- **Frontend**: Next.js (already in Clip-js), React, TypeScript
- **Backend**: Node.js, Express, WebSocket (ws)
- **MCP Servers**: TypeScript, @modelcontextprotocol/sdk
- **Video Processing**: FFmpeg via fluent-ffmpeg, beamcoder for frames
- **Audio Transcription**: nodejs-whisper (whisper.cpp bindings)
- **Asset Fetching**: Pexels API, Unsplash API, duck-duck-scrape

## What is MCP?

MCP (Model Context Protocol) is a standard by Anthropic for connecting LLMs to tools.
- **MCP Server**: Exposes "tools" that can be called (like functions)
- **MCP Client**: Connects to servers and invokes tools
- **Transport**: We use "stdio" (subprocess) for local servers

Documentation: https://modelcontextprotocol.io/docs
TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk

## Repository Structure

```
ai-video-editor/
├── apps/
│   ├── web/                    # Forked Clip-js (ALREADY EXISTS - modify)
│   └── backend/                # NEW - Node.js orchestrator
├── mcp-servers/
│   ├── ffmpeg-server/          # NEW
│   ├── whisper-server/         # NEW
│   ├── vision-server/          # NEW
│   ├── asset-server/           # NEW
│   └── code-runner-server/     # NEW
├── packages/
│   ├── shared-types/           # NEW - TypeScript types
│   └── mcp-utils/              # NEW - Shared MCP utilities
├── MASTER_PLAN.md              # This file
├── turbo.json                  # NEW
├── pnpm-workspace.yaml         # NEW
└── package.json                # NEW (root)
```

---

# AGENT ASSIGNMENTS

Each agent should:
1. Find their section below
2. Read the specifications carefully
3. Create their assigned files/changes
4. Submit a PR to main branch

## Dependencies Between Agents

```
LAYER 1 (Start First - No Dependencies):
├── Agent 01: Monorepo Setup
└── Agent 02: Shared Types Package

LAYER 2 (After Layer 1 Merged):
├── Agent 03: MCP Utils Package
├── Agent 04: Backend Server Core
└── Agent 05: LLM Orchestrator

LAYER 3 (After Layer 2 Merged):
├── Agent 06: FFmpeg MCP Server
├── Agent 07: Whisper MCP Server
├── Agent 08: Vision MCP Server
├── Agent 09: Asset Fetcher MCP Server
└── Agent 10: Code Runner MCP Server

LAYER 4 (After Layer 3 Merged):
├── Agent 11: Backend MCP Client Integration
├── Agent 12: Frontend Copilot Panel
└── Agent 13: Frontend-Backend WebSocket

LAYER 5 (Final):
└── Agent 14: Integration & System Prompt
```

---

# AGENT 01: MONOREPO SETUP

## Objective
Convert the forked Clip-js repo into a Turborepo monorepo structure.

## Tasks

### 1. Create root package.json
Location: `/package.json`
- Name: "ai-video-editor"
- Private: true
- Add scripts: "dev", "build", "lint" that use turbo
- DevDependencies: turbo, typescript, eslint, prettier

### 2. Create pnpm-workspace.yaml
Location: `/pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "mcp-servers/*"
```

### 3. Create turbo.json
Location: `/turbo.json`
Configure pipeline for: build, dev, lint, test
Set proper dependencies (build depends on ^build of dependencies)

### 4. Move existing Clip-js code
- Move ALL existing files into `apps/web/`
- Update any absolute paths in the code if needed
- Ensure the existing app still runs with `pnpm dev`

### 5. Create directory structure
Create empty directories with .gitkeep:
- `apps/backend/`
- `packages/shared-types/`
- `packages/mcp-utils/`
- `mcp-servers/ffmpeg-server/`
- `mcp-servers/whisper-server/`
- `mcp-servers/vision-server/`
- `mcp-servers/asset-server/`
- `mcp-servers/code-runner-server/`

### 6. Create base tsconfig
Location: `/tsconfig.base.json`
- Target: ES2022
- Module: NodeNext
- Strict: true
- Set up path aliases for packages

## Reference Docs
- Turborepo: https://turbo.build/repo/docs
- pnpm workspaces: https://pnpm.io/workspaces

## Verification
After your changes, running `pnpm install` from root should work, and `pnpm dev --filter=web` should start the original Clip-js app.

---

# AGENT 02: SHARED TYPES PACKAGE

## Objective
Create the shared TypeScript types package that all other packages will use.

## Location
`packages/shared-types/`

## Tasks

### 1. Create package.json
- Name: "@ai-video-editor/shared-types"
- Main entry point using TypeScript
- No runtime dependencies (types only)

### 2. Create tsconfig.json
Extend from root tsconfig.base.json

### 3. Create type definitions

#### File: src/project.ts
Define the Project interface:
```typescript
interface Project {
  id: string
  name: string
  created: string  // ISO date
  modified: string
  settings: ProjectSettings
  timeline: Timeline
  assets: Asset[]
}
```

#### File: src/timeline.ts
Define Timeline, Track, Clip interfaces:
- Timeline has: duration, tracks[], markers[]
- Track has: id, type (video|audio|text|image), name, clips[], muted, visible
- Clip has: id, assetId, trackId, startTime, duration, sourceStart, sourceEnd, effects[], volume?, opacity?, speed?, transform?, text?

#### File: src/asset.ts
Define Asset interface:
- id, name, path, type, duration?, resolution?, thumbnailPath?, transcript?

#### File: src/transcript.ts
Define Transcript and TranscriptSegment:
- Segments have: start, end, text, words[]

#### File: src/mcp-tools.ts
Define tool result types:
- ToolResult: { success: boolean, data?: any, error?: string }
- VideoInfo: { duration, resolution, fps, codec, etc. }
- TranscriptResult: { segments, language }
- SearchResult: { items: { url, thumbnail, title }[] }

#### File: src/llm.ts
Define LLM provider types:
- LLMProvider: 'anthropic' | 'openai' | 'custom'
- LLMConfig: { provider, apiKey, model, baseUrl? }
- Message: { role, content }

#### File: src/index.ts
Export all types

## Verification
Other packages should be able to import like:
```typescript
import { Project, Clip } from '@ai-video-editor/shared-types'
```

---

# AGENT 03: MCP UTILS PACKAGE

## Objective
Create shared utilities for building MCP servers, including a base server class and common validation functions.

## Location
`packages/mcp-utils/`

## Tasks

### 1. Create package.json
- Name: "@ai-video-editor/mcp-utils"
- Dependencies: @modelcontextprotocol/sdk, zod

### 2. Study MCP Server Implementation
Read: https://modelcontextprotocol.io/docs/first-server/typescript
Understand how to:
- Create a Server instance
- Define tools with inputSchema
- Handle tool calls
- Use stdio transport

### 3. Create src/base-server.ts
Create an abstract base class that:
- Initializes MCP Server with name and version
- Provides method to register tools
- Handles stdio transport setup
- Has error handling wrapper for tool execution

Example pattern (implement fully):
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

export abstract class BaseMCPServer {
  protected server: Server
  
  constructor(name: string, version: string) {
    // Initialize server
  }
  
  abstract registerTools(): void
  
  async start(): Promise<void> {
    // Connect stdio transport and start
  }
}
```

### 4. Create src/validation.ts
Utility functions:
- `validatePath(path: string, allowedDirs: string[]): boolean` - Check path is within allowed directories
- `sanitizeFilename(name: string): string` - Remove dangerous characters
- `isVideoFile(path: string): boolean` - Check file extension
- `isAudioFile(path: string): boolean`
- `isImageFile(path: string): boolean`

### 5. Create src/sandbox.ts
Functions for safe execution:
- `createTempDir(): string` - Create temp directory for operations
- `cleanupTempDir(path: string): void`
- `executeWithTimeout<T>(fn: () => Promise<T>, timeout: number): Promise<T>`

### 6. Create src/index.ts
Export all utilities

## Reference
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Example servers: https://github.com/modelcontextprotocol/servers

---

# AGENT 04: BACKEND SERVER CORE

## Objective
Create the main backend server with Express and WebSocket that will coordinate everything.

## Location
`apps/backend/`

## Tasks

### 1. Create package.json
- Name: "@ai-video-editor/backend"
- Dependencies: express, ws, cors, dotenv, uuid
- DevDependencies: typescript, tsx, @types/*

### 2. Create src/server.ts
Main entry point:
- Express server on port 3001
- WebSocket server on same port
- CORS enabled for frontend (localhost:3000)
- Routes for: /api/project, /api/llm, /api/health

### 3. Create src/project/state.ts
Project state manager:
```typescript
class ProjectManager {
  private projects: Map<string, Project>
  
  createProject(name: string, settings: ProjectSettings): Project
  loadProject(path: string): Project
  saveProject(project: Project, path: string): void
  getProject(id: string): Project | undefined
  updateProject(id: string, updates: Partial<Project>): Project
}
```

### 4. Create src/project/history.ts
Undo/redo system:
```typescript
class HistoryManager {
  private undoStack: ProjectState[]
  private redoStack: ProjectState[]
  
  push(state: ProjectState): void
  undo(): ProjectState | undefined
  redo(): ProjectState | undefined
  canUndo(): boolean
  canRedo(): boolean
}
```

### 5. Create src/websocket/handler.ts
WebSocket message handler:
- Handle incoming messages (JSON format)
- Message types: 'project.update', 'copilot.message', 'frames.request'
- Broadcast project changes to connected clients

### 6. Create src/routes/project.ts
Express routes:
- GET /api/project/:id
- POST /api/project
- PUT /api/project/:id
- GET /api/project/:id/export (trigger export)

### 7. Create src/config.ts
Configuration from environment:
- PORT
- PROJECT_DIR
- ALLOWED_DIRS (for file operations)

### 8. Create src/index.ts
Export server startup function

## Reference
- Express: https://expressjs.com/
- ws (WebSocket): https://github.com/websockets/ws

---

# AGENT 05: LLM ORCHESTRATOR

## Objective
Create a multi-provider LLM client that supports Anthropic, OpenAI, and custom OpenAI-compatible APIs.

## Location
`apps/backend/src/llm/`

## Tasks

### 1. Create orchestrator.ts
Main orchestrator class:
```typescript
class LLMOrchestrator {
  private provider: LLMProvider
  private config: LLMConfig
  
  constructor(config: LLMConfig)
  
  async chat(messages: Message[], tools?: Tool[]): Promise<{
    content: string
    toolCalls?: ToolCall[]
  }>
  
  async streamChat(messages: Message[], tools?: Tool[]): AsyncIterable<StreamChunk>
  
  setProvider(config: LLMConfig): void
}
```

### 2. Create providers/anthropic.ts
Anthropic Claude implementation:
- Use @anthropic-ai/sdk package
- Support tool use (function calling)
- Handle streaming responses
- Map MCP tools to Claude tool format

Read: https://docs.anthropic.com/en/docs/tool-use

### 3. Create providers/openai.ts
OpenAI implementation:
- Use openai package
- Support function calling
- Handle streaming
- Map MCP tools to OpenAI function format

Read: https://platform.openai.com/docs/guides/function-calling

### 4. Create providers/custom.ts
Custom OpenAI-compatible endpoint:
- Accept baseUrl in config
- Use same interface as OpenAI
- For local models like Ollama, LM Studio

### 5. Create tool-mapper.ts
Convert MCP tool definitions to LLM-specific formats:
```typescript
function mcpToolToAnthropicTool(mcpTool: MCPTool): AnthropicTool
function mcpToolToOpenAIFunction(mcpTool: MCPTool): OpenAIFunction
function parseToolCallResult(result: any, provider: LLMProvider): ToolCall
```

### 6. Create types.ts
Local type definitions for LLM interactions

## Dependencies to add to backend package.json
- @anthropic-ai/sdk
- openai

---

# AGENT 06: FFMPEG MCP SERVER

## Objective
Create an MCP server that exposes FFmpeg video processing tools.

## Location
`mcp-servers/ffmpeg-server/`

## Tasks

### 1. Create package.json
- Name: "@ai-video-editor/ffmpeg-server"
- Dependencies: @modelcontextprotocol/sdk, fluent-ffmpeg, ffmpeg-static
- Depend on: @ai-video-editor/mcp-utils, @ai-video-editor/shared-types

### 2. Create src/index.ts
Main server entry point:
- Extend BaseMCPServer from mcp-utils
- Register all tools
- Start server

### 3. Create src/tools/trim.ts
Tool: trim_video
- Input: inputPath, outputPath, startTime, endTime
- Use fluent-ffmpeg to trim video
- Return success/error

### 4. Create src/tools/concat.ts
Tool: concat_videos
- Input: inputPaths[], outputPath, transition?
- Concatenate multiple videos
- Optional transition between clips

### 5. Create src/tools/audio.ts
Tools: add_audio_track, extract_audio, adjust_volume
- Mix or replace audio
- Extract audio to file
- Adjust volume levels

### 6. Create src/tools/text-overlay.ts
Tool: add_text_overlay
- Input: inputPath, outputPath, text, position, font, fontSize, color, startTime, endTime
- Use FFmpeg drawtext filter

### 7. Create src/tools/filters.ts
Tool: apply_filter
- Support: blur, brightness, contrast, saturation, grayscale, etc.
- Use FFmpeg filter syntax

### 8. Create src/tools/speed.ts
Tool: change_speed
- Change playback speed
- Option to preserve audio pitch (using atempo filter)

### 9. Create src/tools/info.ts
Tool: get_video_info
- Use ffprobe to get metadata
- Return: duration, resolution, fps, codec, bitrate

### 10. Create src/tools/export.ts
Tool: export_project
- Read project JSON file
- Build FFmpeg filter complex from timeline
- Render final output

### 11. Create src/ffmpeg-utils.ts
Helper functions for FFmpeg operations

## Reference
- fluent-ffmpeg: https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
- FFmpeg filters: https://ffmpeg.org/ffmpeg-filters.html

## Testing
Run server standalone: `node dist/index.js`
Should output MCP protocol to stdout

---

# AGENT 07: WHISPER MCP SERVER

## Objective
Create an MCP server for audio transcription using Whisper (local inference).

## Location
`mcp-servers/whisper-server/`

## Tasks

### 1. Create package.json
- Name: "@ai-video-editor/whisper-server"
- Dependencies: @modelcontextprotocol/sdk, nodejs-whisper
- Depend on: @ai-video-editor/mcp-utils

### 2. Research nodejs-whisper
Read: https://github.com/ChetanXpro/nodejs-whisper
Understand:
- How to install/download models
- API for transcription
- Output formats (JSON, SRT, VTT)
- GPU acceleration options

### 3. Create src/index.ts
Main server, extends BaseMCPServer

### 4. Create src/tools/transcribe.ts
Tool: transcribe_audio
- Input: inputPath, language?, wordTimestamps?, outputFormat?
- Extract audio from video if needed (use FFmpeg)
- Run Whisper transcription
- Return transcript with timestamps

### 5. Create src/tools/silence.ts
Tool: detect_silence
- Input: inputPath, minDuration?, threshold?
- Use FFmpeg silencedetect filter OR analyze Whisper gaps
- Return array of { start, end } for silent segments

### 6. Create src/tools/subtitles.ts
Tool: generate_subtitles
- Input: inputPath, outputPath, format (srt/vtt/ass)
- Run transcription
- Format output as subtitle file
- Handle line length limits

### 7. Create src/whisper-engine.ts
Wrapper around nodejs-whisper:
- Model download/management
- Transcription execution
- Result parsing

### 8. Create src/models.ts
Model management:
- Default model: base.en or small.en
- Function to download model if not present
- Model path configuration

## Note on First Run
The first transcription will download the Whisper model (~100MB-1GB depending on model). Handle this gracefully.

---

# AGENT 08: VISION MCP SERVER

## Objective
Create an MCP server for extracting and analyzing video frames.

## Location
`mcp-servers/vision-server/`

## Tasks

### 1. Create package.json
- Name: "@ai-video-editor/vision-server"
- Dependencies: @modelcontextprotocol/sdk, fluent-ffmpeg, sharp
- Optional: beamcoder (for high-performance, may have build issues)
- Depend on: @ai-video-editor/mcp-utils

### 2. Create src/index.ts
Main server entry

### 3. Create src/tools/extract-frames.ts
Tool: extract_frames
- Input: videoPath, mode (timestamps|interval|range), options per mode
- Modes:
  - timestamps: extract specific frames at given times
  - interval: extract frame every N seconds
  - range: extract frames between start/end at given FPS
- Output: Array of { timestamp, base64 } or save to files
- Use FFmpeg for extraction

### 4. Create src/tools/analyze-frame.ts
Tool: analyze_frame
- Input: videoPath, timestamp, query?
- Extract the frame at timestamp
- Return frame as base64
- NOTE: Actual AI analysis will be done by the LLM using this frame

### 5. Create src/tools/scene-detection.ts
Tool: find_scene_changes
- Input: videoPath, sensitivity?, minSceneDuration?
- Use FFmpeg scene detection filter
- Return array of timestamps where scenes change

### 6. Create src/tools/describe-segment.ts
Tool: describe_video_segment
- Input: videoPath, startTime, endTime, sampleFps?
- Extract frames at sampleFps throughout the segment
- Return frames for LLM to analyze
- Include audio transcript if available

### 7. Create src/frame-extractor.ts
Core frame extraction logic:
- FFmpeg-based extraction
- Caching of extracted frames
- Cleanup of temp files

### 8. Create src/thumbnail-generator.ts
Generate timeline thumbnails:
- Create filmstrip images
- Resize to appropriate dimensions
- Cache results

## Note on Vision AI
This server extracts frames. The actual "understanding" happens when the backend sends these frames to a multimodal LLM (like Claude). The tool returns image data, not descriptions.

---

# AGENT 09: ASSET FETCHER MCP SERVER

## Objective
Create an MCP server for searching and downloading assets from the internet.

## Location
`mcp-servers/asset-server/`

## Tasks

### 1. Create package.json
- Name: "@ai-video-editor/asset-server"
- Dependencies: @modelcontextprotocol/sdk, pexels, unsplash-js, duck-duck-scrape, node-fetch
- Depend on: @ai-video-editor/mcp-utils

### 2. Create src/index.ts
Main server entry

### 3. Create src/tools/search-images.ts
Tool: search_images
- Input: query, provider?, count?, orientation?, color?
- Providers: pexels, unsplash, pixabay, duckduckgo
- Return: Array of { url, thumbnailUrl, title, source, license }

### 4. Create src/tools/search-videos.ts
Tool: search_videos
- Input: query, provider?, count?, minDuration?, maxDuration?
- Search Pexels or Pixabay video API
- Return video results with preview URLs

### 5. Create src/tools/search-audio.ts
Tool: search_audio
- Input: query, type (music|sfx), duration?
- Use free audio APIs (Pixabay has audio)
- Return audio results

### 6. Create src/tools/download.ts
Tool: download_asset
- Input: url, filename, type, destinationDir
- Download file to local project assets folder
- Handle various file types
- Return local path

### 7. Create src/providers/pexels.ts
Pexels API integration:
- Photo and video search
- Read API docs: https://www.pexels.com/api/documentation/

### 8. Create src/providers/unsplash.ts
Unsplash API integration:
- Photo search
- Read API docs: https://unsplash.com/documentation

### 9. Create src/providers/duckduckgo.ts
DuckDuckGo image scraping:
- Use duck-duck-scrape package
- Fallback when API limits reached
- Note: Less reliable, use as backup

### 10. Create src/config.ts
API key configuration:
- PEXELS_API_KEY
- UNSPLASH_ACCESS_KEY
- Read from environment

## API Keys Note
Users will need to get free API keys from Pexels and Unsplash. Document this in README.

---

# AGENT 10: CODE RUNNER MCP SERVER

## Objective
Create an MCP server for running custom FFmpeg commands and Python scripts.

## Location
`mcp-servers/code-runner-server/`

## Tasks

### 1. Create package.json
- Name: "@ai-video-editor/code-runner-server"
- Dependencies: @modelcontextprotocol/sdk
- Depend on: @ai-video-editor/mcp-utils

### 2. Create src/index.ts
Main server entry

### 3. Create src/tools/ffmpeg-command.ts
Tool: run_ffmpeg_command
- Input: command (string - the args after 'ffmpeg'), workingDirectory?, timeout?
- SECURITY: Validate command doesn't access outside allowed directories
- Execute FFmpeg with the provided arguments
- Stream progress if possible
- Return success/error with output

### 4. Create src/tools/python-script.ts
Tool: run_python_script  
- Input: script (string - Python code), requirements?, timeout?
- Create temp virtual environment if packages needed
- Write script to temp file
- Execute with Python
- Capture stdout/stderr
- Return result

### 5. Create src/sandbox/executor.ts
Safe execution wrapper:
- Timeout enforcement
- Output capture
- Process cleanup
- Working directory isolation

### 6. Create src/sandbox/validator.ts
Security validation:
- Check paths are within allowed directories
- Block dangerous commands (rm -rf, etc.)
- Validate FFmpeg command structure

### 7. Document security considerations
Create SECURITY.md explaining:
- What's allowed/blocked
- How path validation works
- Timeout limits

## Security Warning
This server runs arbitrary commands. It MUST validate inputs carefully. Consider:
- Whitelist of allowed FFmpeg filters/operations
- No shell expansion
- Path sandboxing

---

# AGENT 11: BACKEND MCP CLIENT INTEGRATION

## Objective
Integrate MCP client into the backend to connect to all MCP servers.

## Location
`apps/backend/src/mcp/`

## Prerequisites
Requires: Agent 04 (Backend Server), Agent 06-10 (MCP Servers) to be merged

## Tasks

### 1. Study MCP Client
Read: https://modelcontextprotocol.io/docs/first-client/typescript
Understand:
- Creating Client instance
- Connecting via stdio transport
- Listing tools
- Calling tools

### 2. Create client-manager.ts
Manage connections to multiple MCP servers:
```typescript
class MCPClientManager {
  private clients: Map<string, Client>
  
  async connectServer(name: string, command: string, args: string[]): Promise<void>
  async disconnectServer(name: string): Promise<void>
  async listAllTools(): Promise<Tool[]>
  async callTool(serverName: string, toolName: string, args: object): Promise<any>
  async getClient(name: string): Client | undefined
}
```

### 3. Create server-configs.ts
Configuration for each MCP server:
```typescript
const serverConfigs = {
  ffmpeg: {
    command: 'node',
    args: ['mcp-servers/ffmpeg-server/dist/index.js']
  },
  whisper: { ... },
  vision: { ... },
  asset: { ... },
  codeRunner: { ... }
}
```

### 4. Create tool-registry.ts
Registry of all available tools:
- Aggregate tools from all servers
- Map tool names to server names
- Provide tool lookup

### 5. Create src/mcp/index.ts
Export MCPClientManager and initialization function

### 6. Update src/server.ts
- Initialize MCPClientManager on startup
- Connect to all configured MCP servers
- Expose tools to LLM orchestrator

### 7. Create route: /api/tools
- GET: List all available tools
- POST: Invoke a tool manually (for testing)

## Reference
- MCP Client SDK: https://github.com/modelcontextprotocol/typescript-sdk

---

# AGENT 12: FRONTEND COPILOT PANEL

## Objective
Add an AI copilot chat panel to the Clip-js frontend.

## Location
`apps/web/src/components/copilot/`

## Prerequisites
You'll be working with existing Clip-js code. Study the codebase first.

## Tasks

### 1. Study existing Clip-js structure
- Find where components are located
- Understand state management (likely React Context or Zustand)
- Find the main layout component

### 2. Create CopilotPanel.tsx
Main chat panel component:
- Chat message list (scrollable)
- Input field with send button
- Loading indicator when AI is thinking
- Tool execution status display

### 3. Create ChatMessage.tsx
Individual message component:
- User messages (right aligned, blue)
- AI messages (left aligned, gray)
- Support for markdown rendering
- Show tool calls inline

### 4. Create ToolCallDisplay.tsx
Display tool execution:
- Show tool name being called
- Show parameters
- Show result (collapsible)
- Loading spinner during execution

### 5. Create useCopilot.ts hook
Hook for chat functionality:
```typescript
function useCopilot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const sendMessage = async (content: string) => { ... }
  const clearChat = () => { ... }
  
  return { messages, isLoading, sendMessage, clearChat }
}
```

### 6. Create CopilotContext.tsx
Context provider for copilot state:
- Messages history
- Connection status
- Current tool execution

### 7. Integrate into main layout
- Add CopilotPanel to the right side of the editor
- Make it collapsible/resizable
- Toggle button in toolbar

### 8. Create styles
Use existing Clip-js styling patterns (likely Tailwind or CSS modules)

## UI Reference
Look at:
- GitHub Copilot Chat
- Cursor AI interface
- Claude chat interface

Keep it clean and minimal.

---

# AGENT 13: FRONTEND-BACKEND WEBSOCKET INTEGRATION

## Objective
Connect the frontend to the backend via WebSocket for real-time communication.

## Location
`apps/web/src/lib/` and updates to existing components

## Prerequisites
Requires: Agent 04 (Backend), Agent 12 (Copilot Panel)

## Tasks

### 1. Create src/lib/websocket.ts
WebSocket client wrapper:
```typescript
class WebSocketClient {
  private ws: WebSocket
  private handlers: Map<string, Function>
  
  connect(url: string): Promise<void>
  disconnect(): void
  send(type: string, payload: any): void
  on(type: string, handler: Function): void
  off(type: string): void
}
```

### 2. Create src/lib/api.ts
REST API client:
```typescript
const api = {
  project: {
    get: (id: string) => fetch(...),
    create: (data) => fetch(...),
    update: (id, data) => fetch(...),
  },
  copilot: {
    sendMessage: (message: string) => fetch(...),
  },
  tools: {
    list: () => fetch(...),
    invoke: (name: string, args: object) => fetch(...),
  }
}
```

### 3. Create WebSocketProvider.tsx
React context for WebSocket:
- Connect on mount
- Reconnect on disconnect
- Provide send/receive functions to children

### 4. Update useCopilot.ts
Connect to backend:
- Send messages via REST or WebSocket
- Receive streaming responses
- Handle tool call updates

### 5. Create useProject.ts hook
Project state synced with backend:
- Load project from backend
- Send changes to backend
- Receive updates from other clients (future multi-user)

### 6. Update CopilotPanel
- Use WebSocket for streaming responses
- Show connection status indicator

### 7. Configure backend URL
- Environment variable: NEXT_PUBLIC_BACKEND_URL
- Default: http://localhost:3001
- Support both REST and WebSocket endpoints

## Message Format
```typescript
// Client to Server
{ type: 'copilot.message', payload: { content: string } }
{ type: 'project.update', payload: { changes: Partial<Project> } }

// Server to Client
{ type: 'copilot.response', payload: { content: string, done: boolean } }
{ type: 'copilot.tool_call', payload: { tool: string, args: object } }
{ type: 'copilot.tool_result', payload: { tool: string, result: any } }
{ type: 'project.updated', payload: { project: Project } }
```

---

# AGENT 14: INTEGRATION & SYSTEM PROMPT

## Objective
Final integration: wire everything together and create the AI system prompt.

## Prerequisites
ALL previous agents must be merged.

## Tasks

### 1. Create apps/backend/src/llm/system-prompt.ts
Build the system prompt that tells the AI how to be a video editor:
```typescript
export function buildSystemPrompt(context: {
  project: Project,
  tools: Tool[],
  recentActions: string[]
}): string {
  return `You are an AI video editing assistant...
  
  ## Current Project
  - Name: ${context.project.name}
  - Duration: ${formatDuration(context.project.timeline.duration)}
  - Tracks: ${context.project.timeline.tracks.length}
  
  ## Available Tools
  ${formatTools(context.tools)}
  
  ## Guidelines
  - Confirm destructive operations
  - Reference timecodes as MM:SS
  - Break complex edits into steps
  ...
  `
}
```

### 2. Create complete chat flow in backend
File: apps/backend/src/routes/copilot.ts
- POST /api/copilot/chat
- Accept message from frontend
- Build system prompt with project context
- Call LLM with tools
- Execute tool calls via MCP
- Return response (streaming)

### 3. Update project routes
Ensure project CRUD works:
- Create new project
- Load existing project
- Save changes
- Export project

### 4. Create development scripts
In root package.json, add scripts:
```json
{
  "dev": "turbo run dev",
  "dev:backend": "turbo run dev --filter=backend",
  "dev:web": "turbo run dev --filter=web",
  "dev:mcp": "turbo run dev --filter='./mcp-servers/*'",
  "build": "turbo run build",
  "start": "..."
}
```

### 5. Create .env.example
Document required environment variables:
```
# LLM
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-5-sonnet-20241022

# APIs
PEXELS_API_KEY=
UNSPLASH_ACCESS_KEY=

# Paths
PROJECT_DIR=./projects
ALLOWED_DIRS=./projects,./temp
```

### 6. Create README.md
Complete setup guide:
- Prerequisites
- Installation steps
- Environment setup
- Running locally
- Available features
- Architecture overview

### 7. Test end-to-end flow
Verify:
1. Start backend: `pnpm dev:backend`
2. Backend spawns MCP servers
3. Start frontend: `pnpm dev:web`
4. Open http://localhost:3000
5. Open copilot panel
6. Send message: "Show me the first frame of my video"
7. AI should call vision server, extract frame, describe it

### 8. Fix any integration issues
- Debug tool calling flow
- Fix type mismatches
- Ensure WebSocket works
- Test various AI commands

---

# END OF AGENT ASSIGNMENTS

## Coordination Notes

1. **Merge Order**: Respect layer dependencies. Don't try to merge Layer 3 agents before Layer 2 is complete.

2. **Testing**: Each agent should include basic tests or at minimum verify their code runs.

3. **Documentation**: Each package should have a README explaining what it does.

4. **Branch Naming**: Suggested format: `agent-XX-description` (e.g., `agent-06-ffmpeg-server`)

5. **PR Description**: Include:
   - What was implemented
   - Any deviations from plan
   - Dependencies on other agents
   - How to test

## Contact Points

If agents have questions about:
- MCP implementation → Reference official docs
- Clip-js specifics → Study existing codebase
- Integration issues → Check MASTER_PLAN.md
- Type definitions → Refer to Agent 02's output
```

---

## Individual Agent Prompts

Here are the prompts to give to each agent:

### Prompt for Agent 01

```
You are Agent 01 working on the AI Video Editor project.

Your task: MONOREPO SETUP

You have access to a GitHub repository that is a fork of Clip-js (a Next.js video editor).
Your job is to convert it into a Turborepo monorepo structure.

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 01: MONOREPO SETUP" for your detailed instructions.

Key deliverables:
1. Create root package.json with Turborepo
2. Create pnpm-workspace.yaml
3. Create turbo.json
4. Move existing code into apps/web/
5. Create directory structure for other packages

Reference docs:
- Turborepo: https://turbo.build/repo/docs
- pnpm workspaces: https://pnpm.io/workspaces

Verify by running: pnpm install && pnpm dev --filter=web

Submit a PR when complete.
```

### Prompt for Agent 02

```
You are Agent 02 working on the AI Video Editor project.

Your task: SHARED TYPES PACKAGE

Create the shared TypeScript types package at packages/shared-types/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 02: SHARED TYPES PACKAGE" for your detailed instructions.

Key deliverables:
1. package.json for @ai-video-editor/shared-types
2. Type definitions for: Project, Timeline, Track, Clip, Asset, Transcript, LLM types
3. Proper exports in index.ts

This is a types-only package with no runtime dependencies.

Dependencies: Wait for Agent 01 to merge first (monorepo setup).

Submit a PR when complete.
```

### Prompt for Agent 03

```
You are Agent 03 working on the AI Video Editor project.

Your task: MCP UTILS PACKAGE

Create shared utilities for building MCP servers at packages/mcp-utils/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 03: MCP UTILS PACKAGE" for your detailed instructions.

IMPORTANT - Understanding MCP:
MCP (Model Context Protocol) is a protocol for connecting LLMs to tools. Read:
- https://modelcontextprotocol.io/docs
- https://modelcontextprotocol.io/docs/first-server/typescript

Key deliverables:
1. BaseMCPServer abstract class
2. Path validation utilities
3. Sandbox execution utilities

Dependencies: Wait for Agent 01 to merge first.

Submit a PR when complete.
```

### Prompt for Agent 04

```
You are Agent 04 working on the AI Video Editor project.

Your task: BACKEND SERVER CORE

Create the main backend server at apps/backend/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 04: BACKEND SERVER CORE" for your detailed instructions.

Key deliverables:
1. Express server with WebSocket (using 'ws' package)
2. Project state manager (CRUD for projects)
3. History manager (undo/redo)
4. WebSocket message handling
5. API routes for project management

Tech stack: Node.js, Express, ws, TypeScript

Dependencies: Wait for Agents 01 and 02 to merge first.

Submit a PR when complete.
```

### Prompt for Agent 05

```
You are Agent 05 working on the AI Video Editor project.

Your task: LLM ORCHESTRATOR

Create a multi-provider LLM client at apps/backend/src/llm/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 05: LLM ORCHESTRATOR" for your detailed instructions.

Key deliverables:
1. LLMOrchestrator class supporting multiple providers
2. Anthropic provider (Claude) with tool use
3. OpenAI provider with function calling
4. Custom OpenAI-compatible provider
5. Tool format mapping between MCP and LLM formats

Reference:
- Anthropic tool use: https://docs.anthropic.com/en/docs/tool-use
- OpenAI function calling: https://platform.openai.com/docs/guides/function-calling

Dependencies: Wait for Agents 01, 02, 04 to merge first.

Submit a PR when complete.
```

### Prompt for Agent 06

```
You are Agent 06 working on the AI Video Editor project.

Your task: FFMPEG MCP SERVER

Create an MCP server for video processing at mcp-servers/ffmpeg-server/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 06: FFMPEG MCP SERVER" for your detailed instructions.

IMPORTANT - Understanding MCP:
MCP servers expose "tools" that LLMs can call. Read the MCP docs:
- https://modelcontextprotocol.io/docs/first-server/typescript
- Use @modelcontextprotocol/sdk package

Key deliverables:
1. MCP server with tools: trim, concat, add_audio, text_overlay, filters, speed, export
2. Use fluent-ffmpeg for FFmpeg operations
3. Proper input validation and error handling

Reference:
- fluent-ffmpeg: https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
- FFmpeg filters: https://ffmpeg.org/ffmpeg-filters.html

Dependencies: Wait for Agents 01, 02, 03 to merge first.

Submit a PR when complete.
```

### Prompt for Agent 07

```
You are Agent 07 working on the AI Video Editor project.

Your task: WHISPER MCP SERVER

Create an MCP server for audio transcription at mcp-servers/whisper-server/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 07: WHISPER MCP SERVER" for your detailed instructions.

IMPORTANT - Understanding MCP:
Read: https://modelcontextprotocol.io/docs/first-server/typescript

Key deliverables:
1. MCP server with tools: transcribe_audio, detect_silence, generate_subtitles
2. Use nodejs-whisper for local Whisper inference
3. Support multiple output formats (JSON, SRT, VTT)

Reference:
- nodejs-whisper: https://github.com/ChetanXpro/nodejs-whisper
- Whisper: https://github.com/openai/whisper

Dependencies: Wait for Agents 01, 02, 03 to merge first.

Submit a PR when complete.
```

### Prompt for Agent 08

```
You are Agent 08 working on the AI Video Editor project.

Your task: VISION MCP SERVER

Create an MCP server for video frame analysis at mcp-servers/vision-server/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 08: VISION MCP SERVER" for your detailed instructions.

IMPORTANT - Understanding MCP:
Read: https://modelcontextprotocol.io/docs/first-server/typescript

Key deliverables:
1. MCP server with tools: extract_frames, analyze_frame, find_scene_changes, describe_video_segment
2. Frame extraction using FFmpeg
3. Return frames as base64 for LLM vision analysis

Note: This server extracts frames. The actual AI "understanding" happens when the backend sends frames to a multimodal LLM like Claude.

Dependencies: Wait for Agents 01, 02, 03 to merge first.

Submit a PR when complete.
```

### Prompt for Agent 09

```
You are Agent 09 working on the AI Video Editor project.

Your task: ASSET FETCHER MCP SERVER

Create an MCP server for searching and downloading assets at mcp-servers/asset-server/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 09: ASSET FETCHER MCP SERVER" for your detailed instructions.

IMPORTANT - Understanding MCP:
Read: https://modelcontextprotocol.io/docs/first-server/typescript

Key deliverables:
1. MCP server with tools: search_images, search_videos, search_audio, download_asset
2. Integrate with Pexels, Unsplash APIs
3. DuckDuckGo fallback using duck-duck-scrape

Reference:
- Pexels API: https://www.pexels.com/api/documentation/
- Unsplash API: https://unsplash.com/documentation
- duck-duck-scrape: https://www.npmjs.com/package/duck-duck-scrape

Dependencies: Wait for Agents 01, 02, 03 to merge first.

Submit a PR when complete.
```

### Prompt for Agent 10

```
You are Agent 10 working on the AI Video Editor project.

Your task: CODE RUNNER MCP SERVER

Create an MCP server for running custom commands at mcp-servers/code-runner-server/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 10: CODE RUNNER MCP SERVER" for your detailed instructions.

IMPORTANT - Understanding MCP:
Read: https://modelcontextprotocol.io/docs/first-server/typescript

Key deliverables:
1. MCP server with tools: run_ffmpeg_command, run_python_script
2. SECURITY: Path validation, timeout enforcement, no dangerous commands
3. Sandbox execution with proper cleanup

SECURITY IS CRITICAL: This server runs arbitrary commands. You must:
- Validate all paths are within allowed directories
- Block dangerous operations
- Enforce timeouts
- Clean up temp files

Dependencies: Wait for Agents 01, 02, 03 to merge first.

Submit a PR when complete.
```

### Prompt for Agent 11

```
You are Agent 11 working on the AI Video Editor project.

Your task: BACKEND MCP CLIENT INTEGRATION

Create the MCP client that connects the backend to all MCP servers at apps/backend/src/mcp/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 11: BACKEND MCP CLIENT INTEGRATION" for your detailed instructions.

IMPORTANT - Understanding MCP Client:
Read: https://modelcontextprotocol.io/docs/first-client/typescript

Key deliverables:
1. MCPClientManager class to manage multiple server connections
2. Connect to all MCP servers via stdio transport
3. Tool registry aggregating tools from all servers
4. API route to list and invoke tools

Dependencies: Wait for ALL Layer 1-3 agents (01-10) to merge first.

Submit a PR when complete.
```

### Prompt for Agent 12

```
You are Agent 12 working on the AI Video Editor project.

Your task: FRONTEND COPILOT PANEL

Add an AI copilot chat interface to the Clip-js frontend at apps/web/src/components/copilot/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 12: FRONTEND COPILOT PANEL" for your detailed instructions.

FIRST: Study the existing Clip-js codebase to understand:
- Component structure
- State management approach
- Styling patterns (likely Tailwind)

Key deliverables:
1. CopilotPanel component (chat interface)
2. ChatMessage component
3. ToolCallDisplay component
4. useCopilot hook for state management
5. Integration into main layout (right sidebar)

Design reference: GitHub Copilot Chat, Cursor AI interface

Dependencies: Wait for Agents 01, 02 to merge first. You can work in parallel with backend agents.

Submit a PR when complete.
```

### Prompt for Agent 13

```
You are Agent 13 working on the AI Video Editor project.

Your task: FRONTEND-BACKEND WEBSOCKET INTEGRATION

Connect the frontend to the backend via WebSocket at apps/web/src/lib/

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 13: FRONTEND-BACKEND WEBSOCKET INTEGRATION" for your detailed instructions.

Key deliverables:
1. WebSocket client wrapper
2. REST API client
3. WebSocketProvider React context
4. Update useCopilot to use real backend
5. useProject hook for synced state

Message formats are defined in MASTER_PLAN.md.

Dependencies: Wait for Agents 04 (Backend) and 12 (Copilot Panel) to merge first.

Submit a PR when complete.
```

### Prompt for Agent 14

```
You are Agent 14 working on the AI Video Editor project.

Your task: FINAL INTEGRATION & SYSTEM PROMPT

This is the final integration task. You will wire everything together.

Read the MASTER_PLAN.md file in the repository root and find the section "# AGENT 14: INTEGRATION & SYSTEM PROMPT" for your detailed instructions.

Key deliverables:
1. Create the AI system prompt that makes it act as a video editor
2. Complete the copilot chat flow (message -> LLM -> tools -> response)
3. Development scripts in package.json
4. .env.example with all required variables
5. Complete README.md with setup instructions
6. Test the end-to-end flow and fix issues

Dependencies: Wait for ALL previous agents (01-13) to merge first.

This is the most critical agent. You must ensure everything works together.

Submit a PR when complete.
```

---

