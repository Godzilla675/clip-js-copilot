import { searchImagesTool } from '../src/tools/search-images.js';
import { searchVideosTool } from '../src/tools/search-videos.js';
import { searchAudioTool } from '../src/tools/search-audio.js';
import { downloadAssetTool } from '../src/tools/download.js';

async function main() {
  console.log('Verifying tools...');

  // Test search_images
  console.log('Testing search_images (DuckDuckGo only)...');
  try {
      const res = await searchImagesTool.handler({ query: 'nature', provider: 'duckduckgo', count: 1 });
      console.log('Search Result:', res.content[0].text.substring(0, 100) + '...');
  } catch (e) {
      console.error('Search failed:', e);
  }

  // Test search_audio (mocked)
  console.log('Testing search_audio...');
  const audioRes = await searchAudioTool.handler({ query: 'test' });
  console.log('Audio Result:', audioRes.content[0].text);

  console.log('Verification script finished.');
}

main().catch(console.error);
