# GitHub Copilot Integration

The AI Video Editor supports **GitHub Copilot** as a backend LLM provider. This allows you to leverage Copilot's coding and reasoning capabilities directly within the editor to generate scripts, analyze video content, and perform edits.

## Prerequisites

- **GitHub Copilot Subscription**: You must have an active GitHub Copilot subscription (Individual or Business).
- **Node.js**: v18 or higher.
- **Access to Terminal**: You will need to run CLI commands to authenticate.

## Installation

The Copilot integration relies on the `@github/copilot` CLI wrapper, which is installed automatically as a dependency of the backend.

1. Navigate to the project root.
2. Install all dependencies (if you haven't already):
   ```bash
   pnpm install
   ```

## Authentication

Before the backend can use Copilot, you must authenticate the local CLI with your GitHub account.

1. Navigate to the backend directory:
   ```bash
   cd apps/backend
   ```

2. Run the authentication command:
   ```bash
   pnpm exec copilot
   ```
   *Note: If `auth` is not a specific subcommand in your version, running the CLI interactively will trigger the authentication flow on first use.*

3. **Follow the on-screen instructions**:
   - The CLI will prompt you to authenticate.
   - It will display a **Device Code** (e.g., `ABCD-1234`) and a URL (usually `https://github.com/login/device`).
   - Open the URL in your browser.
   - Enter the Device Code.
   - Authorize the `GitHub Copilot Plugin` application.

4. Once authorized, the CLI will output a success message (e.g., `Successfully authenticated`). You can now close the terminal or return to the project root.

## Configuration

To tell the AI Video Editor to use Copilot:

1. Open or create your `apps/backend/.env` file.
2. Set the `LLM_PROVIDER` variable to `copilot`:

   ```env
   LLM_PROVIDER=copilot
   ```

3. (Optional) The `LLM_MODEL` variable defaults to `gpt-4` when using Copilot, but you can override it if Copilot exposes other models:
   ```env
   LLM_MODEL=gpt-4
   ```

## Usage

Start the application as usual:

```bash
# From project root
pnpm dev
```

The backend will automatically locate the authenticated Copilot CLI and use it for all AI operations.

## Troubleshooting

### "CopilotClient not initialized" or CLI not found
If the backend fails to find the Copilot CLI, it will look for it in `node_modules/.bin/copilot`. If your setup places it elsewhere, you can specify the path explicitly:

1. Find where the copilot executable is:
   ```bash
   # Inside apps/backend
   find node_modules -name copilot -type f
   ```
2. Set the `COPILOT_CLI_PATH` in `apps/backend/.env`:
   ```env
   COPILOT_CLI_PATH=/absolute/path/to/node_modules/.bin/copilot
   ```

### Authentication Errors
If you see errors related to authentication (e.g., 401 Unauthorized):
- Run `pnpm exec copilot` again to trigger re-authentication.
- Ensure your GitHub Copilot subscription is active.
