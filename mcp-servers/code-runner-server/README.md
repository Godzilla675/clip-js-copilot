# Code Runner MCP Server

An MCP server for running custom FFmpeg commands and Python scripts.

## Tools

### `run_ffmpeg_command`
Runs a custom FFmpeg command.
*   `command`: Arguments string (e.g. `-i input.mp4 output.mp4`).
*   `workingDirectory`: Directory to run in (must be allowed).
*   `timeout`: Execution timeout in ms.

### `run_python_script`
Runs a Python script.
*   `script`: Python code.
*   `requirements`: Pip packages to install (e.g. `numpy pandas`).
*   `timeout`: Execution timeout in ms.

## Configuration

Environment variables:
*   `ALLOWED_DIRS`: Comma-separated list of allowed directories for file access.
