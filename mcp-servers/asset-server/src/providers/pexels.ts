import { createClient, ErrorResponse, Photo, Video, Photos, Videos } from 'pexels';
import { config } from '../config.js';

let client: ReturnType<typeof createClient> | null = null;

export const getPexelsClient = () => {
  if (!client && config.pexelsApiKey) {
    client = createClient(config.pexelsApiKey);
  }
  return client;
};

export interface PexelsImageResult {
  url: string;
  thumbnailUrl: string;
  title: string;
  source: 'pexels';
  license: string;
  width: number;
  height: number;
  originalUrl: string;
}

export interface PexelsVideoResult {
  url: string; // Preview URL or actual video file URL
  previewUrl: string;
  thumbnailUrl: string;
  title: string;
  source: 'pexels';
  duration: number;
  width: number;
  height: number;
  downloadUrl: string;
}

export const searchPexelsImages = async (query: string, count: number = 10): Promise<PexelsImageResult[]> => {
  const pexels = getPexelsClient();
  if (!pexels) return [];

  try {
    const response = await pexels.photos.search({ query, per_page: count });
    if ('error' in response) {
      console.error('Pexels error:', response.error);
      return [];
    }

    // @ts-ignore - Pexels types are tricky
    return response.photos.map((photo: any) => ({
      url: photo.src.original,
      thumbnailUrl: photo.src.medium,
      title: photo.alt || `Pexels Photo ${photo.id}`,
      source: 'pexels',
      license: 'free', // Pexels license is free
      width: photo.width,
      height: photo.height,
      originalUrl: photo.src.original
    }));
  } catch (error) {
    console.error('Error searching Pexels images:', error);
    return [];
  }
};

export const searchPexelsVideos = async (query: string, count: number = 10): Promise<PexelsVideoResult[]> => {
  const pexels = getPexelsClient();
  if (!pexels) return [];

  try {
    const response = await pexels.videos.search({ query, per_page: count });
    if ('error' in response) {
      console.error('Pexels error:', response.error);
      return [];
    }

    // @ts-ignore
    return response.videos.map((video: any) => {
        // Find best quality video file (usually highest resolution)
        const videoFile = video.video_files.sort((a: any, b: any) => (b.width * b.height) - (a.width * a.height))[0];

        return {
          url: videoFile?.link || video.url,
          previewUrl: video.video_files.find((f: any) => f.quality === 'sd')?.link || videoFile?.link || video.url,
          thumbnailUrl: video.image,
          title: `Pexels Video ${video.id}`, // Pexels videos don't always have titles in the API response in the same way
          source: 'pexels',
          duration: video.duration,
          width: video.width,
          height: video.height,
          downloadUrl: videoFile?.link || video.url
        };
    });
  } catch (error) {
    console.error('Error searching Pexels videos:', error);
    return [];
  }
};
