# COPILOT AI POWERED VIDEO EDITING POWERED BY GITHUB COPILOT

An AI-powered video editor, powered by GitHub Copilot, built as a monorepo.

## Features

- **AI Copilot**: Chat with an AI assistant to edit videos, find assets, and analyze content.
- **GitHub Copilot Integration**: Use GitHub Copilot as your LLM provider for advanced coding and reasoning capabilities.
- **Multimodal Understanding**: The AI can "see" your video frames and understand context.
- **Asset Integration**: Search and download stock footage/images from Pexels and Unsplash.
- **Local Processing**: Uses FFmpeg and Whisper locally for privacy and performance.
- **Web-based Editor**: Built on Next.js and Remotion (forked from Clip-js).

## Architecture

- **Frontend**: Next.js (apps/web)
- **Backend**: Node.js + Express + WebSocket (apps/backend)
- **MCP Servers**: Modular tools for FFmpeg, Whisper, Vision, Assets, etc. (mcp-servers/*)

## Prerequisites

- Node.js 20+
- pnpm 9+
- FFmpeg installed on your system (for local backend operations, though some servers use static binaries)

## Getting Started

1. **Install dependencies**:
   > **Note**: `pnpm-lock.yaml` is not committed. After cloning, run `pnpm install` to generate it.

   ```bash
   pnpm install
   ```

2. **Environment Setup**:

   Copy `.env.example` to `apps/backend/.env` and `apps/web/.env.local`:
   ```bash
   cp .env.example apps/backend/.env
   cp .env.example apps/web/.env.local
   ```

   **Required Environment Variables:**

   *Backend (`apps/backend/.env`)*:
   - `LLM_PROVIDER`: `anthropic`, `openai`, `gemini`, or `copilot`
   - `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY`: API key for the chosen provider.
   - `PEXELS_API_KEY`: For video/image search.
   - `UNSPLASH_ACCESS_KEY`: For image search.

   *Frontend (`apps/web/.env.local`)*:
   - `NEXT_PUBLIC_BACKEND_URL`: URL of the backend (e.g., `http://localhost:3001`).

   > **Note**: For GitHub Copilot setup instructions, see [docs/copilot.md](./docs/copilot.md).

3. **Start Development**:
   ```bash
   pnpm dev
   ```
   This starts:
   - Frontend at http://localhost:3000
   - Backend at http://localhost:3001
   - All MCP servers (managed by backend)

## Development Scripts

- `pnpm dev`: Start everything
- `pnpm dev:web`: Start only frontend
- `pnpm dev:backend`: Start only backend
- `pnpm build`: Build all packages

## Documentation

For detailed documentation, please visit the [docs/](./docs/) directory:

- [Architecture](./docs/architecture.md)
- [GitHub Copilot Setup](./docs/copilot.md)
- [API Documentation](./docs/api.md)
- [MCP Tools](./docs/mcp-tools.md)
- [Development Guide](./docs/development.md)
- [Security](./docs/security.md)

## Contributing

See `MASTERPLAN.MD` for architectural details.
