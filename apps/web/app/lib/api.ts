import { Project } from '@ai-video-editor/shared-types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BACKEND_URL}/api${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  project: {
    get: (id: string) => fetchApi<Project>(`/project/${id}`),
    create: (data: Partial<Project>) => fetchApi<Project>('/project', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Project>) => fetchApi<Project>(`/project/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },
  copilot: {
    sendMessage: (message: string) => fetchApi<any>('/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
    })
  },
  tools: {
    list: () => fetchApi<any[]>('/tools'),
    invoke: (name: string, args: object) => fetchApi<any>('/tools', {
        method: 'POST',
        body: JSON.stringify({ name, args })
    })
  }
};
