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

## Data Structures

### Project JSON Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Epic Video",
  "created": "2024-01-26T12:00:00.000Z",
  "modified": "2024-01-26T12:30:00.000Z",
  "settings": {
    "width": 1920,
    "height": 1080,
    "fps": 30
  },
  "timeline": {
    "duration": 15,
    "tracks": [
      {
        "id": "t1",
        "type": "video",
        "name": "Background",
        "clips": [
          {
            "id": "c1",
            "assetId": "a1",
            "trackId": "t1",
            "startTime": 0,
            "duration": 10,
            "sourceStart": 0,
            "sourceEnd": 10,
            "transform": { "x": 0, "y": 0, "scale": 1, "rotation": 0 },
            "effects": []
          }
        ],
        "muted": false,
        "visible": true
      }
    ],
    "markers": []
  },
  "assets": [
    {
      "id": "a1",
      "name": "sunset.mp4",
      "path": "/path/to/assets/sunset.mp4",
      "type": "video",
      "duration": 60
    }
  ]
}
```

### WebSocket Message Payloads

#### Sending a Message (`copilot.message`)
```json
{
  "type": "copilot.message",
  "payload": {
    "content": "Add a 5 second clip of the sunset to the start of the video",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "model": "gpt-4o",
    "projectData": { ... }
  }
}
```

#### Receiving a Tool Call (`copilot.tool_call`)
```json
{
  "type": "copilot.tool_call",
  "payload": {
    "tool": "add_asset_to_project",
    "args": {
      "projectId": "550e8400-e29b-41d4-a716-446655440000",
      "filePath": "/assets/sunset.mp4",
      "type": "video"
    }
  }
}
```

#### Project Update Broadcast (`project.updated`)
```json
{
  "type": "project.updated",
  "payload": {
    "project": { ... }
  }
}
```
