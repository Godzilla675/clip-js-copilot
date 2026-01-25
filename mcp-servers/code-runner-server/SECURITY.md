# Security Policy

## Code Execution

The Code Runner MCP Server executes commands on the host machine. Security is handled through:

1.  **Allowed Commands**: Only `ffmpeg`, `ffprobe`, `python`, `python3`, `pip`, `pip3` are allowed.
2.  **Path Validation**: All file operations (including FFmpeg inputs/outputs) must be within allowed directories.
    *   Configured via `ALLOWED_DIRS` environment variable.
    *   `os.tmpdir()` and `process.cwd()` are allowed by default.
3.  **Command Validation**:
    *   FFmpeg arguments are parsed and checked for absolute paths.
    *   No shell execution (`shell: false` in `spawn`).
4.  **Timeouts**: All commands have a default timeout (30s) to prevent hanging processes.

## Python Execution

Python scripts are executed in a temporary directory.
*   Requirements are installed to the temporary directory using `pip install -t`.
*   Scripts run with `PYTHONPATH` set to the temporary directory.
*   **Warning**: Scripts run with the privileges of the user running the MCP server.

## Configuration

Set `ALLOWED_DIRS` to a comma-separated list of safe directories.
