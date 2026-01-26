const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Remove trailing slash if present
const BASE_URL = BACKEND_URL.replace(/\/$/, '');

const get = async (endpoint: string) => {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API call failed: ${res.statusText}`);
    return res.json();
};

const post = async (endpoint: string, data: any) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API call failed: ${res.statusText}`);
    return res.json();
};

const put = async (endpoint: string, data: any) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API call failed: ${res.statusText}`);
    return res.json();
};

export const api = {
    project: {
        get: (id: string) => get(`/api/project/${id}`),
        create: (data: any) => post('/api/project', data),
        update: (id: string, data: any) => put(`/api/project/${id}`, data),
        export: (id: string) => get(`/api/project/${id}/export`),
    },
    copilot: {
        sendMessage: (content: string, model?: string, projectId?: string) => post('/api/copilot/chat', { content, model, projectId }),
        getModels: () => get('/api/copilot/models'),
    },
    tools: {
        list: () => get('/api/tools'),
        invoke: (name: string, args: any) => post('/api/tools', { name, args }),
    }
};
