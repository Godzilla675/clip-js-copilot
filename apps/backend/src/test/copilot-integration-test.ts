import { Server } from '../server.js';
import WebSocket from 'ws';
import { Project } from '@ai-video-editor/shared-types';
import fs from 'fs';
import path from 'path';

async function runTest() {
    console.log('Starting Copilot integration test (Manual Tool Verification)...');

    const projectDir = './test-projects-copilot';
    if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
    }

    const server = new Server(3003, projectDir);
    await server.start();

    // Give server time to start and MCP to connect
    console.log('Waiting for server...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    let ws: WebSocket | null = null;

    try {
        // 1. Create project
        console.log('Creating project...');
        const createRes = await fetch('http://localhost:3003/api/project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Copilot Test Project',
                settings: { width: 1920, height: 1080, fps: 30 }
            })
        });

        if (!createRes.ok) throw new Error('Failed to create project');
        const project = await createRes.json() as Project;
        console.log(`Project created: ${project.id}`);

        // 2. Connect WebSocket
        ws = new WebSocket('ws://localhost:3003');
        await new Promise<void>((resolve) => ws!.on('open', resolve));
        console.log('WebSocket connected');

        // Setup listener for project updates
        const updatePromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout waiting for project update')), 5000);
            ws!.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'project.updated') {
                    const p = msg.payload.project;
                    console.log('Received project update. Assets:', p.assets.length);
                    if (p.assets.length > 0 && p.assets[0].name === 'test_cat.png') {
                        console.log('Asset verification successful!');
                        clearTimeout(timeout);
                        resolve();
                    }
                }
            });
        });

        // 3. Manually invoke tools to verify logic
        console.log('Manually invoking tools via internal access...');

        // Create a dummy file to "download"
        // Server is serving process.cwd()/assets
        // projectDir is ./test-projects-copilot.
        // But ProjectManager allows adding any file path.
        // However, for Frontend Sync to work, file must be in served assets dir?
        // My Frontend Sync logic: `const filename = asset.path.split(/[/\\]/).pop(); const src = .../assets/${filename}`
        // So the file SHOULD be in `process.cwd()/assets` for the URL to be valid.

        const assetsDir = path.resolve(process.cwd(), 'assets');
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

        const dummyFile = path.resolve(assetsDir, 'test_cat.png');
        fs.writeFileSync(dummyFile, 'dummy content');

        // Access private wsHandler
        const wsHandler = (server as any).wsHandler;

        // Call add_asset_to_project
        console.log('Executing add_asset_to_project...');
        const assetResult = await wsHandler.executeTool('add_asset_to_project', {
            projectId: project.id,
            filePath: dummyFile,
            type: 'image'
        });

        console.log('Asset Tool Result:', assetResult);
        if (!assetResult.success || !assetResult.asset) throw new Error('add_asset_to_project failed');

        // Wait for update
        await updatePromise;
        console.log('Project update verified.');

        // Clean up dummy file
        fs.unlinkSync(dummyFile);

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        if (ws) ws.close();
        server.stop();
        if (fs.existsSync(projectDir)) {
             fs.rmSync(projectDir, { recursive: true, force: true });
        }
        process.exit(0);
    }
}

runTest();
