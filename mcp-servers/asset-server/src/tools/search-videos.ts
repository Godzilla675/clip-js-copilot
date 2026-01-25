import { z } from 'zod';
import { searchPexelsVideos } from '../providers/pexels.js';

export const searchVideosTool = {
  name: 'search_videos',
  description: 'Search for videos using Pexels',
  parameters: z.object({
    query: z.string().describe('The search query for videos'),
    count: z.number().optional().default(10).describe('Number of results to return'),
    minDuration: z.number().optional().describe('Minimum duration in seconds'),
    maxDuration: z.number().optional().describe('Maximum duration in seconds'),
  }),
  handler: async ({ query, count, minDuration, maxDuration }: { query: string, count: number, minDuration?: number, maxDuration?: number }) => {
    // Fetch a bit more if we are going to filter
    const fetchCount = (minDuration || maxDuration) ? count * 2 : count;

    let results = await searchPexelsVideos(query, fetchCount);

    if (minDuration) {
      results = results.filter(v => v.duration >= minDuration);
    }
    if (maxDuration) {
      results = results.filter(v => v.duration <= maxDuration);
    }

    // Trim to requested count
    results = results.slice(0, count);

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
