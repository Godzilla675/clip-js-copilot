# MCP Tools & Servers

The AI Video Editor capabilities are powered by a suite of Model Context Protocol (MCP) servers. Each server provides specialized tools that the AI agent can invoke to perform tasks.

## 1. FFmpeg Server (`ffmpeg-server`)
Handles direct video manipulation using FFmpeg.

- **`trim_video`**: Trims a video file to a specific start and end time.
  - Inputs: `inputPath`, `outputPath`, `startTime`, `endTime`
- **`concat_videos`**: Concatenates multiple video files into one.
  - Inputs: `inputPaths` (array), `outputPath`, `transition` (optional)
- **`add_audio_track`**: Adds or replaces audio in a video.
  - Inputs: `videoPath`, `audioPath`, `outputPath`, `mix` (boolean)
- **`add_text_overlay`**: Burns text onto the video.
  - Inputs: `inputPath`, `outputPath`, `text`, `position`, `style`
- **`apply_filter`**: Applies visual effects.
  - Inputs: `inputPath`, `outputPath`, `filterName`, `options`
- **`change_speed`**: Adjusts playback speed.
  - Inputs: `inputPath`, `outputPath`, `speedFactor`
- **`get_video_info`**: Retrieves technical metadata (resolution, codec, duration).
  - Inputs: `filePath`
- **`export_project`**: Renders a complex timeline (JSON) into a final video file.
  - Inputs: `projectJson`, `outputPath`

## 2. Vision Server (`vision-server`)
Analyzes visual content by extracting frames.

- **`extract_frames`**: Extracts frames from a video.
  - Inputs: `videoPath`, `mode` ("timestamps", "interval", "range"), `timestamps`, `interval`, etc.
- **`analyze_frame`**: Helper to extract a single frame for LLM inspection.
  - Inputs: `videoPath`, `timestamp`
- **`find_scene_changes`**: Detects where scene changes occur.
  - Inputs: `videoPath`, `sensitivity`
- **`describe_video_segment`**: Extracts a series of frames for the LLM to understand a video segment.
  - Inputs: `videoPath`, `startTime`, `endTime`

## 3. Whisper Server (`whisper-server`)
Handles audio transcription using local Whisper models.

- **`transcribe_audio`**: Transcribes speech to text.
  - Inputs: `inputPath`, `language` (optional)
- **`detect_silence`**: Finds silent segments in audio/video.
  - Inputs: `inputPath`, `minDuration`, `threshold`
- **`generate_subtitles`**: Generates SRT/VTT subtitle files.
  - Inputs: `inputPath`, `outputPath`, `format`

## 4. Asset Server (`asset-server`)
Fetches stock media from external APIs.

- **`search_images`**: Searches Pexels, Unsplash, and DuckDuckGo.
  - Inputs: `query`, `provider`, `count`
- **`search_videos`**: Searches Pexels Video.
  - Inputs: `query`, `count`
- **`search_audio`**: Searches for audio/SFX.
  - Inputs: `query`, `type`
- **`download_asset`**: Downloads a URL to the local project assets directory.
  - Inputs: `url`, `filename`, `destinationDir`

## 5. Code Runner Server (`code-runner-server`)
A "sandboxed" environment for executing custom logic.

- **`run_python_script`**: Executes Python code in a temporary environment.
  - Inputs: `script`, `requirements` (pip packages), `timeout`
- **`run_ffmpeg_command`**: Executes a raw FFmpeg command string.
  - Inputs: `command` (arguments after `ffmpeg`), `timeout`
  - **Note**: Restricted to safe paths.

## Adding Custom MCP Servers

You can add your own custom MCP servers to extend the capabilities of the Copilot. To do this, create a `mcp.config.json` file in the root directory of the project.

### Configuration Format (`mcp.config.json`)

```json
{
  "mcpServers": {
    "my-custom-server": {
      "command": "node",
      "args": ["/path/to/my-server.js"],
      "env": {
        "MY_API_KEY": "secret"
      },
      "disabled": false
    }
  }
}
```

- **`command`**: The executable to run (e.g., `node`, `python`, or a binary).
- **`args`**: Array of arguments passed to the command.
- **`env`**: (Optional) Environment variables for the server process.
- **`disabled`**: (Optional) Set to `true` to disable the server.

The backend will automatically load this configuration on startup, connect to the defined servers, and register their tools.
