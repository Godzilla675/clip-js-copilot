# Architecture Overview

The AI Video Editor is a monorepo built with Turbo, consisting of three main layers: Frontend, Backend, and MCP Servers.

## System Diagram

```mermaid
graph TD
    Client[Browser / Frontend] <-->|WebSocket & REST| Backend[Node.js Backend]
    Backend <-->|API| LLM[LLM Provider (Claude/OpenAI)]
    Backend <-->|Stdio| FFMPEG[FFmpeg Server]
    Backend <-->|Stdio| VISION[Vision Server]
    Backend <-->|Stdio| WHISPER[Whisper Server]
    Backend <-->|Stdio| ASSET[Asset Server]
    Backend <-->|Stdio| CODE[Code Runner Server]
```

## Components

### 1. Frontend (`apps/web`)
- **Framework**: Next.js (React)
- **Video Rendering**: Based on Clip-js (uses Remotion concepts)
- **State Management**: React Context & Hooks
- **Communication**:
  - Connects to Backend via WebSocket (`ws`) for real-time chat and updates.
  - Uses REST API for initial data fetching and file uploads.
- **Copilot UI**: Dedicated interface for chatting with the AI assistant.

### 2. Backend (`apps/backend`)
- **Framework**: Express.js + `ws` (WebSocket)
- **Role**: Central Orchestrator
- **Key Modules**:
  - **LLM Orchestrator**: Manages conversations with AI providers (Anthropic, OpenAI). It constructs system prompts based on the current project state and available tools.
  - **MCP Client Manager**: Connects to and manages local MCP servers. It routes tool execution requests to the appropriate server.
  - **Project Manager**: Handles project state (timeline, assets, settings) and persistence (JSON files).
  - **WebSocket Handler**: Manages real-time event loops for chat and project updates.

### 3. MCP Servers (`mcp-servers/*`)
Model Context Protocol (MCP) servers expose specific capabilities as "tools" to the LLM. Each server is a standalone Node.js application running in its own process, communicating with the backend via standard input/output (stdio).

- **FFmpeg Server**: Video processing (trim, concat, filters).
- **Vision Server**: Frame extraction and analysis helper.
- **Whisper Server**: Local audio transcription using Whisper.
- **Asset Server**: Search and download stock assets (Pexels, Unsplash).
- **Code Runner Server**: Secure execution of Python scripts and custom FFmpeg commands.

## Data Flow

1. **User Interaction**: The user sends a message in the Copilot chat (e.g., "Trim the first clip to 5 seconds").
2. **Backend Processing**:
   - The message is received via WebSocket.
   - The Backend constructs a prompt including the current project state and tool definitions.
   - The prompt is sent to the LLM (e.g., Claude 3.5 Sonnet).
3. **Tool Selection**:
   - The LLM analyzes the request and decides to call a tool (e.g., `trim_video`).
   - The LLM responds with a "tool call" request.
4. **Tool Execution**:
   - The Backend receives the tool call.
   - It routes the request to the `ffmpeg-server` via the MCP Client.
   - The `ffmpeg-server` executes the command locally using `fluent-ffmpeg`.
   - The result is returned to the Backend.
5. **Response**:
   - The Backend sends the tool result back to the LLM.
   - The LLM generates a final natural language response.
   - The Backend streams this response to the Frontend via WebSocket.
   - If the tool modified the project (e.g., changed the timeline), a `project.updated` event is also broadcast.
