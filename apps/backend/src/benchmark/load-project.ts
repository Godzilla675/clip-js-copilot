import { ProjectManager } from '../project/state.js';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

const TEMP_DIR = path.resolve('./bench-temp');

async function runBenchmark() {
    // Setup
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Create a dummy project file manually to avoid using ProjectManager for creation
    const projectId = 'bench-project';
    const projectPath = path.join(TEMP_DIR, `${projectId}.json`);

    // Create a moderately large project file to make I/O measurable
    const bigAssets = Array.from({ length: 1000 }, (_, i) => ({
        id: `asset-${i}`,
        type: 'video',
        name: `Asset ${i}`,
        path: `/path/to/asset/${i}.mp4`,
        duration: 10,
        metadata: { width: 1920, height: 1080 }
    }));

    const projectData = {
        id: projectId,
        name: 'Bench Project',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        settings: { width: 1920, height: 1080, fps: 30 },
        timeline: { duration: 0, tracks: [], markers: [] },
        assets: bigAssets
    };

    fs.writeFileSync(projectPath, JSON.stringify(projectData));

    console.log('Starting benchmark (Concurrent Async Load)...');

    const iterations = 1000;
    const start = performance.now();

    const promises = [];
    for (let i = 0; i < iterations; i++) {
        const pm = new ProjectManager(TEMP_DIR);
        promises.push(pm.loadProject(projectId));
    }

    await Promise.all(promises);

    const end = performance.now();
    const duration = end - start;

    console.log(`Completed ${iterations} iterations in ${duration.toFixed(2)}ms`);
    console.log(`Average: ${(duration / iterations).toFixed(4)}ms per op (amortized)`);

    // Cleanup
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
}

runBenchmark();
