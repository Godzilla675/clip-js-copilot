# API Documentation

The backend provides both a REST API for standard CRUD operations and a WebSocket interface for real-time interaction and AI streaming.

## REST API

Base URL: `http://localhost:3001` (default)

### Project Management

#### Get Project
- **Endpoint**: `GET /api/project/:id`
- **Description**: Retrieve a project by ID.
- **Response**: `Project` object.

#### Create Project
- **Endpoint**: `POST /api/project`
- **Body**: `{ "name": "string", "settings": object }`
- **Response**: `Project` object.

#### Update Project
- **Endpoint**: `PUT /api/project/:id`
- **Body**: Partial `Project` object.
- **Response**: Updated `Project` object.

#### Export Project
- **Endpoint**: `GET /api/project/:id/export`
- **Description**: Triggers a project export (rendering).
- **Response**: `{ "message": "string" }`

### Copilot & Tools

#### Chat (Stateless)
- **Endpoint**: `POST /api/copilot/chat`
- **Body**: `{ "content": "string", "projectId": "string" }`
- **Description**: Send a single message to the AI and get a complete response. For streaming, use WebSocket.

#### List Tools
- **Endpoint**: `GET /api/tools`
- **Description**: List all available MCP tools from connected servers.

#### Invoke Tool
- **Endpoint**: `POST /api/tools/:server/:tool`
- **Description**: Manually invoke a specific tool.
- **Body**: Tool arguments object.

## WebSocket API

The WebSocket server runs on the same port as the REST API (default `ws://localhost:3001`).

### Client -> Server Messages

#### `copilot.message`
Sends a message to the AI assistant.
```json
{
  "type": "copilot.message",
  "payload": {
    "content": "Make the video shorter",
    "projectId": "123"
  }
}
```

#### `project.update`
Updates the project state.
```json
{
  "type": "project.update",
  "payload": {
    "projectId": "123",
    "changes": { ... }
  }
}
```

#### `frames.request`
Request frame extraction (used by frontend for thumbnails).
```json
{
  "type": "frames.request",
  "payload": { ... }
}
```

### Server -> Client Messages

#### `copilot.response`
Streamed text response from the AI.
```json
{
  "type": "copilot.response",
  "payload": {
    "content": "Sure, I can help...",
    "done": false
  }
}
```

#### `copilot.tool_call`
Notification that the AI is calling a tool.
```json
{
  "type": "copilot.tool_call",
  "payload": {
    "tool": "trim_video",
    "args": { ... }
  }
}
```

#### `copilot.tool_result`
Result of a tool execution.
```json
{
  "type": "copilot.tool_result",
  "payload": {
    "tool": "trim_video",
    "result": { ... }
  }
}
```

#### `project.updated`
Broadcasts project updates to all connected clients.
```json
{
  "type": "project.updated",
  "payload": {
    "project": { ... }
  }
}
```
