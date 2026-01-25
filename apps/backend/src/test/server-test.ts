import { Server } from '../server.js';
import WebSocket from 'ws';
import { Project } from '@ai-video-editor/shared-types';
import fs from 'fs';

async function runTest() {
    console.log('Starting test...');

    const projectDir = './test-projects';

    // Ensure test dir exists/is clean
    if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
    }

    const server = new Server(3002, projectDir);
    server.start();

    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        // 1. Create project via HTTP
        console.log('Creating project...');
        const createRes = await fetch('http://localhost:3002/api/project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Project',
                settings: { width: 1920, height: 1080, fps: 30 }
            })
        });

        if (!createRes.ok) {
            throw new Error(`Failed to create project: ${createRes.statusText}`);
        }

        const project = await createRes.json() as Project;
        console.log(`Project created: ${project.id}`);

        // 2. Connect WebSocket
        console.log('Connecting WebSocket...');
        const ws = new WebSocket('ws://localhost:3002');

        await new Promise<void>((resolve, reject) => {
            ws.on('open', resolve);
            ws.on('error', reject);
        });
        console.log('WebSocket connected');

        // 3. Send update
        const updatePromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout waiting for update')), 5000);
            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'project.updated') {
                    const p = message.payload.project;
                    if (p.id === project.id && p.name === 'Updated Name') {
                        console.log('Update received correctly');
                        clearTimeout(timeout);
                        resolve();
                    }
                }
            });
        });

        console.log('Sending update...');
        ws.send(JSON.stringify({
            type: 'project.update',
            payload: {
                projectId: project.id,
                changes: { name: 'Updated Name' }
            }
        }));

        // Wait for update
        await updatePromise;

        // 4. Verify persistence
        const getRes = await fetch(`http://localhost:3002/api/project/${project.id}`);
        const updatedProject = await getRes.json() as Project;

        if (updatedProject.name !== 'Updated Name') {
            throw new Error('Project persistence failed');
        }
        console.log('Persistence verified');

        console.log('All tests passed!');

        ws.close();
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    } finally {
        server.stop();
        if (fs.existsSync('./test-projects')) {
            fs.rmSync('./test-projects', { recursive: true, force: true });
        }
    }
}

runTest();
