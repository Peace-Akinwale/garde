/**
 * Test script for YouTube transcript extraction
 *
 * This script tests the fetchYoutubeTranscript function with real YouTube videos.
 * Run with: node test-youtube-transcript.js
 */

import { fetchYoutubeTranscript } from './services/videoProcessor.js';

async function testTranscriptExtraction() {
  console.log('\\n='.repeat(60));
  console.log('YOUTUBE TRANSCRIPT EXTRACTION TEST');
  console.log('='.repeat(60));

  // Test videos - replace with actual video IDs that have captions
  const testCases = [
    {
      name: 'TED Talk (should have transcript)',
      url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc', // Replace with real URL
      expectedResult: 'success'
    },
    {
      name: 'Short video ID format',
      url: 'dQw4w9WgXcQ', // Just video ID
      expectedResult: 'success'
    },
    {
      name: 'Short URL format',
      url: 'https://youtu.be/dQw4w9WgXcQ', // Short URL
      expectedResult: 'success'
    }
  ];

  console.log('\\nRunning', testCases.length, 'test cases...\\n');

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`\\nTest ${i + 1}/${testCases.length}: ${test.name}`);
    console.log('-'.repeat(60));
    console.log('URL:', test.url);

    try {
      const result = await fetchYoutubeTranscript(test.url);

      if (result) {
        console.log('✅ SUCCESS - Transcript fetched!');
        console.log(`   Segments: ${result.segments ? result.segments.length : 0}`);
        console.log(`   Characters: ${result.text.length}`);
        console.log(`   Language: ${result.language}`);
        console.log(`   Preview: ${result.text.substring(0, 150)}...`);
      } else {
        console.log('⚠️  NO TRANSCRIPT - Video has no captions');
        console.log('   This is expected for videos without captions');
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }

  console.log('\\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60) + '\\n');

  // Additional info
  console.log('NOTE: To test with your own videos:');
  console.log('1. Open this file: server/test-youtube-transcript.js');
  console.log('2. Replace the test URLs with your own YouTube videos');
  console.log('3. Run: node server/test-youtube-transcript.js');
  console.log('');
}

// Run tests
testTranscriptExtraction().catch(error => {
  console.error('\\nTest script error:', error);
  process.exit(1);
});
