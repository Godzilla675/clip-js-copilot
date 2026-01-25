# AI Video Editor

An AI-powered video editor with a copilot interface, built as a monorepo.

## Features

- **AI Copilot**: Chat with an AI assistant to edit videos, find assets, and analyze content.
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
   - `LLM_PROVIDER`: `anthropic` or `openai`
   - `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`: API key for the chosen provider.
   - `PEXELS_API_KEY`: For video/image search.
   - `UNSPLASH_ACCESS_KEY`: For image search.

   *Frontend (`apps/web/.env.local`)*:
   - `NEXT_PUBLIC_BACKEND_URL`: URL of the backend (e.g., `http://localhost:3001`).

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

## Contributing

See `MASTERPLAN.MD` for architectural details.
