import { OpenAIProvider } from './openai';

export class CustomProvider extends OpenAIProvider {
    async getModels(): Promise<string[]> {
        return [];
    }
}
