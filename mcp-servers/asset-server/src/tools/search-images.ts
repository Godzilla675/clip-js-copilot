import { z } from 'zod';
import { searchPexelsImages } from '../providers/pexels.js';
import { searchUnsplashImages } from '../providers/unsplash.js';
import { searchDDGImages } from '../providers/duckduckgo.js';

export const searchImagesTool = {
  name: 'search_images',
  description: 'Search for images across multiple providers (Pexels, Unsplash, DuckDuckGo)',
  parameters: z.object({
    query: z.string().describe('The search query for images'),
    provider: z.enum(['pexels', 'unsplash', 'duckduckgo', 'all']).optional().default('all').describe('The provider to search from'),
    count: z.number().optional().default(10).describe('Number of results to return per provider'),
  }),
  handler: async ({ query, provider, count }: { query: string, provider: 'pexels' | 'unsplash' | 'duckduckgo' | 'all', count: number }) => {
    const results = [];

    const tasks = [];

    if (provider === 'all' || provider === 'pexels') {
      tasks.push(searchPexelsImages(query, count));
    }
    if (provider === 'all' || provider === 'unsplash') {
      tasks.push(searchUnsplashImages(query, count));
    }
    if (provider === 'all' || provider === 'duckduckgo') {
      tasks.push(searchDDGImages(query, count));
    }

    const taskResults = await Promise.all(tasks);

    // Flatten results
    for (const res of taskResults) {
      results.push(...res);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  },
};
