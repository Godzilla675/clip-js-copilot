import { z } from 'zod';

export const searchAudioTool = {
  name: 'search_audio',
  description: 'Search for audio (music/sfx). currently limited as Pixabay API key is not configured.',
  parameters: z.object({
    query: z.string().describe('The search query for audio'),
    type: z.enum(['music', 'sfx']).optional().default('music'),
    duration: z.number().optional(),
  }),
  handler: async (_args: { query: string; type?: 'music' | 'sfx'; duration?: number }) => {
    // Placeholder implementation
    // In a future update, we can add Pixabay or other audio providers here.
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify([], null, 2),
        },
      ],
      isError: false,
    };
  },
};
