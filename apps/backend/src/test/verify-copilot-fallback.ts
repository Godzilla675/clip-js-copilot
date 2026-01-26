
import { CopilotProvider } from '../llm/providers/copilot';
import { LLMConfig } from '@ai-video-editor/shared-types';

async function test() {
    console.log('Starting CopilotProvider Fallback Test...');

    const config: LLMConfig = {
        provider: 'copilot',
        apiKey: 'dummy',
        model: 'dummy'
    };

    const expectedDefaults = ['gpt-4o', 'claude-3.5-sonnet', 'o1-preview'];

    // Helper to check arrays equal
    const assertEqual = (actual: string[], expected: string[], label: string) => {
        const isSame = actual.length === expected.length && actual.every((v, i) => v === expected[i]);
        if (isSame) {
            console.log(`[PASS] ${label}`);
        } else {
            console.error(`[FAIL] ${label}`);
            console.error(`  Expected: ${expected}`);
            console.error(`  Actual:   ${actual}`);
        }
    };

    // Case 1: Client returns empty list
    const mockClientEmpty = {
        listModels: async () => []
    };

    const provider1 = new CopilotProvider(config, mockClientEmpty);
    const models1 = await provider1.getModels();
    assertEqual(models1, expectedDefaults, 'Case 1 (Empty list from client)');

    // Case 2: Client throws error
    const mockClientError = {
        listModels: async () => { throw new Error("RPC Error"); }
    };

    const provider2 = new CopilotProvider(config, mockClientError);
    const models2 = await provider2.getModels();
    assertEqual(models2, expectedDefaults, 'Case 2 (Client throws error)');

    // Case 3: Client method missing (e.g. old version of SDK or different shape)
    const mockClientMissing = {};
    const provider3 = new CopilotProvider(config, mockClientMissing);
    const models3 = await provider3.getModels();
    assertEqual(models3, expectedDefaults, 'Case 3 (listModels method missing)');

    // Case 4: Client returns valid models (should use them)
    const validModels = ['model-a', 'model-b'];
    const mockClientValid = {
        listModels: async () => validModels
    };
    const provider4 = new CopilotProvider(config, mockClientValid);
    const models4 = await provider4.getModels();
    assertEqual(models4, validModels, 'Case 4 (Valid models returned)');
}

test().catch(console.error);
