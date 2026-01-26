# Development Guide

## Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: v9 or higher
- **FFmpeg**: Must be installed on your system and available in PATH (some servers use static binaries, but local dev often benefits from system install).

## Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd ai-video-editor
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `apps/backend/.env` and `apps/web/.env.local` and fill in the required keys.

   **Backend Keys**:
   - `LLM_PROVIDER`: `anthropic`, `openai`, `gemini`, or `copilot`
   - `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY`
   - `PEXELS_API_KEY` (Optional)
   - `UNSPLASH_ACCESS_KEY` (Optional)

   > **Note**: If using GitHub Copilot, please refer to [GitHub Copilot Integration](./copilot.md) for authentication steps.

4. **Start Development**:
   ```bash
   pnpm dev
   ```
   This command uses Turbo to start the Frontend (port 3000), Backend (port 3001), and compiles all packages.

## Scripts

- `pnpm dev`: Start all apps in development mode.
- `pnpm dev:web`: Start only the Next.js frontend.
- `pnpm dev:backend`: Start only the Backend server.
- `pnpm build`: Build all applications and packages.
- `pnpm lint`: Run linting across the monorepo.

## Project Structure

```
.
├── apps/
│   ├── web/                # Next.js Frontend
│   └── backend/            # Express + WebSocket Backend
├── mcp-servers/            # Individual MCP Server packages
│   ├── ffmpeg-server/
│   ├── vision-server/
│   ├── whisper-server/
│   ├── asset-server/
│   └── code-runner-server/
├── packages/
│   ├── mcp-utils/          # Shared MCP utilities (BaseServer, validation)
│   └── shared-types/       # Shared TypeScript interfaces
└── docs/                   # Documentation
```

## Adding a New MCP Server

1. Create a new directory in `mcp-servers/`.
2. Initialize `package.json` with `@modelcontextprotocol/sdk` dependency.
3. Extend `BaseMCPServer` from `@ai-video-editor/mcp-utils`.
4. Register your tools.
5. Add the server to the backend configuration in `apps/backend/src/mcp/server-configs.ts`.
