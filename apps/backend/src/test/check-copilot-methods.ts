
import path from 'path';

async function checkCopilot() {
    console.log('--- Copilot ---');
    try {
        // @ts-ignore
        const { CopilotClient } = await import('@github/copilot-sdk');

        console.log('CopilotClient imported.');

        const client = new CopilotClient({
            autoStart: false
        });

        console.log('Client instance created.');
        console.log('Keys on client:', Object.keys(client));
        console.log('Methods in prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)));

        if (client.listModels) {
            console.log('client.listModels EXISTS');
        } else {
            console.log('client.listModels MISSING');
        }

    } catch (e) {
        console.error('Copilot error:', e);
    }
}

checkCopilot();
