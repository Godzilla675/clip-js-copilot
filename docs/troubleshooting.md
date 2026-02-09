# Troubleshooting Guide

This guide covers common issues you might encounter while setting up or running the AI Video Editor.

## 1. FFmpeg Issues

### FFmpeg not found
**Symptoms**: Backend fails to start, or video processing tools return errors like "ffmpeg not found".
**Solution**:
- Ensure FFmpeg is installed on your system.
- Add the FFmpeg binary directory to your system's PATH.
- On macOS (Homebrew): `brew install ffmpeg`
- On Ubuntu/Debian: `sudo apt update && sudo apt install ffmpeg`
- On Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to Environment Variables.

### FFmpeg version mismatch
**Symptoms**: Errors during specific filtering or encoding operations.
**Solution**: Ensure you are using FFmpeg 4.x or 5.x. Some advanced filters might require newer versions.

## 2. MCP Server Connectivity

### Server fails to connect
**Symptoms**: Backend logs show "Failed to connect to MCP server [name]".
**Solution**:
- Check if the server's entry point exists. For example, `mcp-servers/ffmpeg-server/dist/index.js`.
- If the `dist` folder is missing, run `pnpm build` from the project root.
- Ensure the `node` command is available in your environment.

### Tool execution timeout
**Symptoms**: The LLM or MCP client reports that a tool call took too long or failed due to a timeout.
**Solution**:
- Complex operations like `transcribe_audio` or the FFmpeg server's `export_project` can take a long time, especially on large or high‑resolution videos.
- Check system resources (CPU/RAM/disk I/O) and ensure the MCP servers (e.g., FFmpeg, Whisper) are running and responsive.
- Review your LLM/client or deployment configuration for any tool/HTTP/WebSocket timeout settings and increase them if long‑running operations are expected.

## 3. LLM & API Key Issues

### 401 Unauthorized
**Symptoms**: LLM provider returns an authentication error.
**Solution**:
- Double-check your API keys in `apps/backend/.env`.
- Ensure there are no leading/trailing spaces in the keys.
- If using GitHub Copilot, run `pnpm exec copilot` in `apps/backend` to re-authenticate.

### Model not found
**Symptoms**: Error stating "Model [name] not found".
**Solution**:
- Ensure the `LLM_MODEL` in your `.env` is supported by your provider and your specific API key tier.
- Common models: `claude-3-5-sonnet-20240620`, `gpt-4o`, `gemini-1.5-pro`.

## 4. Frontend & WebSocket Issues

### WebSocket connection failed
**Symptoms**: Frontend shows "Disconnected" or chat messages don't send.
**Solution**:
- Ensure the backend is running on the expected port (default 3001).
- Check if `NEXT_PUBLIC_BACKEND_URL` in `apps/web/.env.local` matches your backend URL.
- If running in a container or cloud environment, ensure WebSocket ports are exposed.

### Mixed Content Errors
**Symptoms**: Browser blocks requests to the backend.
**Solution**: If the frontend is served over HTTPS, the backend must also be over HTTPS (WSS for WebSockets). For local development, HTTP/WS is fine.

## 5. Whisper Server Issues

### Model downloading fails
**Symptoms**: Whisper server hangs or fails on the first transcription.
**Solution**:
- The first time it runs, it may attempt to download the Whisper model. Ensure you have an internet connection.
- Check disk space. Models can be several hundred MBs to a few GBs.
