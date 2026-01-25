# Security Considerations

Since this application executes code and manipulates files based on AI instructions, security is a critical concern.

## Code Runner Server

The `code-runner-server` is the most sensitive component as it allows execution of Python scripts and FFmpeg commands.

### Safeguards
1. **Isolation**: Scripts are executed in temporary directories created specifically for that execution.
2. **No Shell**: Commands are executed directly (`spawn` without shell), preventing shell injection attacks.
3. **Whitelist**: Only specific binaries (python, ffmpeg) are allowed.
4. **Timeouts**: All executions have strict timeouts to prevent infinite loops or denial of service.

## File System Access

The backend and MCP servers are restricted to specific directories.

- **Allowed Directories**: Operations are generally restricted to the `projects/` directory and temporary folders.
- **Path Validation**: The `mcp-utils` package provides `validatePath` helpers to ensure no path traversal (`../`) allows access to system files.

## API Keys

- API keys (Anthropic, OpenAI, Pexels) are stored in `.env` files and loaded into the backend process.
- They are **never** sent to the frontend.
- The frontend communicates only with the backend, which acts as a proxy to external services.

## Recommendations for Deployment

- Run the backend in a containerized environment (Docker).
- Ensure the user running the process has limited file system permissions.
- Use a separate, restricted API key for LLM providers if possible with usage limits.
