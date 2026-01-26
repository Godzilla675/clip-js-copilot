import path from 'path';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall, ToolExecutor, LLMProviderOptions } from '../types';

export class CopilotProvider implements LLMProviderInterface {
    private client: any;
    private model: string;
    private initPromise: Promise<void>;

    constructor(config: LLMConfig, client?: any) {
        this.model = config.model || 'gpt-4';

        if (client) {
            this.client = client;
            this.initPromise = Promise.resolve();
        } else {
            this.initPromise = this.init();
        }
    }

    private async init() {
        try {
            // @ts-ignore
            const { CopilotClient } = await import('@github/copilot-sdk');

            let cliPath = process.env.COPILOT_CLI_PATH;

            if (!cliPath) {
                cliPath = path.resolve(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'copilot.cmd' : 'copilot');
            }

            // On Windows, if pointing to the cmd shim, SDK might need help or we point to js
            // But the SDK docs say cliPath: Path to CLI executable

            console.log('Initializing CopilotClient with cliPath:', cliPath);

            this.client = new CopilotClient({
                cliPath,
            });

            await this.client.start();
            console.log('CopilotClient started successfully');

        } catch (e) {
            console.error('Failed to initialize CopilotClient:', e);
            throw e;
        }
    }

    private async getClient(): Promise<any> {
        await this.initPromise;
        if (!this.client) {
            throw new Error('CopilotClient not initialized');
        }
        return this.client;
    }

    async getModels(): Promise<string[]> {
        const client = await this.getClient();
        if (client.listModels) {
            const models = await client.listModels();
            return models.map((m: any) => {
                if (typeof m === 'string') return m;
                return m.id || m.name || m.slug || m.model || JSON.stringify(m);
            });
        }
        return [];
    }

    async chat(messages: Message[], tools?: MCPTool[], executeTool?: ToolExecutor, options?: LLMProviderOptions): Promise<{ content: string; toolCalls?: ToolCall[] }> {
        const client = await this.getClient();
        const session = await this.createSession(client, messages, tools, executeTool, false, options?.model);
        const prompt = this.formatHistory(messages);

        if (!prompt) return { content: '' };

        try {
            const result = await session.sendAndWait({
                prompt,
            });

            await session.destroy();

            if (result && result.type === 'assistant.message') {
                return { content: result.data.content };
            }
            return { content: '' };
        } catch (error) {
            await session.destroy().catch(() => { });
            throw error;
        }
    }

    async *streamChat(messages: Message[], tools?: MCPTool[], executeTool?: ToolExecutor, options?: LLMProviderOptions): AsyncIterable<StreamChunk> {
        const client = await this.getClient();
        const session = await this.createSession(client, messages, tools, executeTool, true, options?.model);
        const prompt = this.formatHistory(messages);

        if (!prompt) {
            yield { done: true };
            return;
        }

        const chunkQueue: StreamChunk[] = [];
        let resolveQueue: (() => void) | null = null;
        let finished = false;
        let error: any = null;

        const onEvent = (event: any) => {
            if (event.type === 'assistant.message_delta') {
                if (event.data?.deltaContent) {
                    chunkQueue.push({ done: false, content: event.data.deltaContent });
                    if (resolveQueue) {
                        const resolve = resolveQueue;
                        resolveQueue = null;
                        resolve();
                    }
                }
            }
        };

        if (session.on) {
            session.on(onEvent);
        }

        const requestPromise = session.sendAndWait({ prompt })
            .then(() => {
                finished = true;
                if (resolveQueue) {
                    const resolve = resolveQueue;
                    resolveQueue = null;
                    resolve();
                }
            })
            .catch((err: any) => {
                error = err;
                finished = true;
                if (resolveQueue) {
                    const resolve = resolveQueue;
                    resolveQueue = null;
                    resolve();
                }
            });

        try {
            while (true) {
                if (chunkQueue.length > 0) {
                    yield chunkQueue.shift()!;
                } else if (finished) {
                    if (error) throw error;
                    break;
                } else {
                    await new Promise<void>(resolve => {
                        resolveQueue = resolve;
                        // Verify if queue got populated or finished while creating promise
                        if (chunkQueue.length > 0 || finished) {
                            resolve();
                        }
                    });
                }
            }
            yield { done: true };
        } catch (err) {
            console.error('Copilot stream error:', err);
            throw err;
        } finally {
            await session.destroy().catch(() => { });
        }
    }

    private async createSession(client: any, messages: Message[], tools?: MCPTool[], executeTool?: ToolExecutor, streaming: boolean = false, modelOverride?: string) {
        const systemMessage = messages.find(m => m.role === 'system')?.content;

        const copilotTools = tools?.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
            handler: async (args: any) => {
                if (executeTool) {
                    return await executeTool(tool.name, args);
                }
                return { error: 'Tool execution not available' };
            }
        }));

        return await client.createSession({
            model: modelOverride || this.model,
            systemMessage: systemMessage ? { mode: 'replace', content: systemMessage } : undefined,
            tools: copilotTools,
            streaming
        });
    }

    private formatHistory(messages: Message[]): string {
        return messages
            .filter(m => m.role !== 'system')
            .map(m => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
            .join('\n\n');
    }
}
