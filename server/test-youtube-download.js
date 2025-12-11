/**
 * YouTube Download Test Script
 * 
 * Tests the hardened yt-dlp download functionality.
 * Run with: node test-youtube-download.js [url]
 * 
 * Optional env vars:
 *   YTDLP_COOKIES_PATH - Path to cookies.txt file for YouTube auth
 *   YTDLP_GEO_BYPASS=true - Enable geo-bypass for region-restricted content
 */

import { downloadVideo } from './services/videoProcessor.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test URLs - use arg or default to a public instructional video
const TEST_URLS = {
  // Public instructional video (should work)
  public: 'https://www.youtube.com/watch?v=gVMWv3vbrQc',
  
  // Short video for quick tests
  short: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', // "Me at the zoo" - first YouTube video
  
  // TikTok test (if needed)
  tiktok: 'https://www.tiktok.com/@user/video/1234567890', // Replace with actual URL
};

// Get URL from command line arg or use default
const testUrl = process.argv[2] || TEST_URLS.public;
const outputPath = path.join(__dirname, 'uploads', 'test-download.mp4');

// Ensure uploads directory exists
if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

console.log('');
console.log('=== YouTube Download Test ===');
console.log('');
console.log(`Test URL:    ${testUrl}`);
console.log(`Output:      ${outputPath}`);
console.log('');
console.log('Environment:');
console.log(`  NODE_ENV:           ${process.env.NODE_ENV || 'development'}`);
console.log(`  YTDLP_COOKIES_PATH: ${process.env.YTDLP_COOKIES_PATH || '(not set)'}`);
console.log(`  YTDLP_GEO_BYPASS:   ${process.env.YTDLP_GEO_BYPASS || 'false'}`);
console.log('');
console.log('---');
console.log('');

async function runTest() {
  const startTime = Date.now();
  
  try {
    console.log('Starting download...');
    console.log('');
    
    const result = await downloadVideo(testUrl, outputPath);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const stats = fs.statSync(result);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log('');
    console.log('---');
    console.log('');
    console.log('SUCCESS!');
    console.log(`  File:     ${result}`);
    console.log(`  Size:     ${sizeMB} MB`);
    console.log(`  Time:     ${elapsed}s`);
    console.log('');
    
    // Clean up test file
    fs.unlinkSync(result);
    console.log('Test file cleaned up.');
    
    return true;
    
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('');
    console.log('---');
    console.log('');
    console.log('FAILED!');
    console.log(`  Error:    ${error.message}`);
    console.log(`  Time:     ${elapsed}s`);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Ensure yt-dlp is installed: yt-dlp --version');
    console.log('  2. Try updating yt-dlp: pip install -U yt-dlp');
    console.log('  3. Check if URL is accessible in browser');
    console.log('  4. For auth issues, provide cookies file via YTDLP_COOKIES_PATH');
    console.log('  5. For region issues, try YTDLP_GEO_BYPASS=true');
    console.log('');
    
    // Clean up partial file if exists
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
      } catch (e) {
        // ignore
      }
    }
    
    return false;
  }
}

// Run test
runTest().then(success => {
  process.exit(success ? 0 : 1);
});
