import { searchImages, SafeSearchType } from 'duck-duck-scrape';

export interface DDGImageResult {
  url: string;
  thumbnailUrl: string;
  title: string;
  source: 'duckduckgo';
  license: string; // Unknown usually
  width: number;
  height: number;
}

export const searchDDGImages = async (query: string, count: number = 10): Promise<DDGImageResult[]> => {
  try {
    const searchResults = await searchImages(query, {
      safeSearch: SafeSearchType.MODERATE
    });

    if (!searchResults.results) return [];

    return searchResults.results.slice(0, count).map((result: any) => ({
      url: result.image,
      thumbnailUrl: result.thumbnail,
      title: result.title,
      source: 'duckduckgo',
      license: 'unknown',
      width: result.width,
      height: result.height
    }));

  } catch (error) {
    console.error('Error searching DuckDuckGo images:', error);
    return [];
  }
};
