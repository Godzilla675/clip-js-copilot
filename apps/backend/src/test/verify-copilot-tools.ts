
import { CopilotProvider } from '../llm/providers/copilot.js';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { MCPTool } from '../llm/types.js';
import path from 'path';

async function verifyTools() {
    console.log('--- Verifying Copilot Tool Calls ---');

    // Setup generic config
    const config: LLMConfig = {
        provider: 'copilot',
        model: 'gpt-4',
        apiKey: '',
    };

    // simplified path - hardcoded to what we know exists on the file system from previous `find_by_name`
    process.env.COPILOT_CLI_PATH = 'c:\\Users\\Ahmed\\Desktop\\clip-js\\apps\\backend\\node_modules\\@github\\copilot\\index.js';
    console.log('Using COPILOT_CLI_PATH:', process.env.COPILOT_CLI_PATH);

    const provider = new CopilotProvider(config);

    const messages: Message[] = [
        { role: 'user', content: 'What is the weather in Paris?' }
    ];

    const tools: MCPTool[] = [{
        name: 'get_weather',
        description: 'Get the current weather for a location',
        inputSchema: {
            type: 'object',
            properties: {
                location: { type: 'string' }
            },
            required: ['location']
        }
    }];

    const executeTool = async (name: string, args: any) => {
        console.log(`!!! executing tool ${name} with args:`, args);
        return { temperature: '22C', condition: 'Sunny' };
    };

    try {
        console.log('Calling chat...');
        const response = await provider.chat(messages, tools, executeTool);
        console.log('Response content:', response.content);
        if (response.content.includes('22C') || response.content.includes('Sunny')) {
            console.log('SUCCESS: Tool result seems to have been used.');
        } else {
            console.log('FAILURE: Tool result was NOT used (or not called).');
        }
    } catch (e) {
        console.error('Error during chat:', e);
    }
}

verifyTools().catch(console.error);
