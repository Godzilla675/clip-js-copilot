import { Server } from './server.js';

const server = new Server();
server.start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
