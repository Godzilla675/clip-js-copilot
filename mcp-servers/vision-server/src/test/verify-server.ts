import { registerExtractFramesTool } from '../tools/extract-frames.js';
import { registerAnalyzeFrameTool } from '../tools/analyze-frame.js';
import { registerSceneDetectionTool } from '../tools/scene-detection.js';
import { registerDescribeSegmentTool } from '../tools/describe-segment.js';

// Mock McpServer
const mockServer: any = {
    tool: (name: string, schema: any, handler: any) => {
        console.log(`Registered tool: ${name}`);
    }
};

console.log("Verifying tool registration...");
try {
    registerExtractFramesTool(mockServer);
    registerAnalyzeFrameTool(mockServer);
    registerSceneDetectionTool(mockServer);
    registerDescribeSegmentTool(mockServer);
    console.log("All tools registered successfully.");
} catch (error) {
    console.error("Error registering tools:", error);
    process.exit(1);
}
