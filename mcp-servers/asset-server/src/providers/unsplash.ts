import { createApi } from 'unsplash-js';
import * as nodeFetch from 'node-fetch';
import { config } from '../config.js';

let unsplash: ReturnType<typeof createApi> | null = null;

export const getUnsplashClient = () => {
  if (!unsplash && config.unsplashAccessKey) {
    unsplash = createApi({
      accessKey: config.unsplashAccessKey,
      fetch: nodeFetch.default as any,
    });
  }
  return unsplash;
};

export interface UnsplashImageResult {
  url: string;
  thumbnailUrl: string;
  title: string;
  source: 'unsplash';
  license: string;
  width: number;
  height: number;
  downloadLocation: string; // URL to trigger download event
}

export const searchUnsplashImages = async (query: string, count: number = 10): Promise<UnsplashImageResult[]> => {
  const client = getUnsplashClient();
  if (!client) return [];

  try {
    const result = await client.search.getPhotos({
      query,
      perPage: count,
    });

    if (result.errors) {
      console.error('Unsplash error:', result.errors);
      return [];
    }

    if (!result.response) return [];

    return result.response.results.map((photo: any) => ({
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.small,
      title: photo.description || photo.alt_description || `Unsplash Photo ${photo.id}`,
      source: 'unsplash',
      license: 'Unsplash License',
      width: photo.width,
      height: photo.height,
      downloadLocation: photo.links.download_location
    }));
  } catch (error) {
    console.error('Error searching Unsplash images:', error);
    return [];
  }
};
