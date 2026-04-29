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

## Contributing

We welcome contributions! Please follow these guidelines:

### Branching Policy
- Create a new branch for each feature or bug fix: `git checkout -b feature/your-feature-name`.
- Use descriptive branch names.

### Development Workflow
1. **Fork the repository** (if you don't have push access).
2. **Create a branch** for your changes.
3. **Make your changes**. Ensure you follow the coding style and include tests where applicable.
4. **Run linting**: `pnpm lint`.
5. **Verify your changes**: Start the dev environment (`pnpm dev`) and test the functionality.
6. **Submit a Pull Request**. Provide a clear description of your changes and why they are needed.

### Monorepo Management
This project uses **pnpm workspaces** and **Turbo**.
- To add a dependency to a specific package: `pnpm add <package> --filter <package-name>`.
- To run a command in all packages: `pnpm -r <command>`.
- Common filters: `web`, `backend`, `ffmpeg-server`, `whisper-server`, etc.

### Coding Standards
- Use TypeScript for all new code.
- Follow the existing indentation and formatting (Prettier/ESLint rules).
- Document new functions and classes with JSDoc comments.
- Ensure all public-facing API changes are reflected in `docs/api.md`.
