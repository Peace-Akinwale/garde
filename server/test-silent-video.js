/**
 * Test script for silent video processing with improved Vision API error handling
 * Video: 20 Minute MAXIMUM FLAVOR tacos (silent YouTube short)
 */

import { processVideo } from './services/videoProcessor.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testSilentVideo() {
  console.log('\n=== TESTING SILENT VIDEO PROCESSING ===\n');
  console.log('Video: https://youtu.be/YKBaKwVR6W8 (20 Minute MAXIMUM FLAVOR tacos)');
  console.log('This video previously failed with "Unable to Extract Content"\n');
  console.log('Testing new Vision API error handling with retry logic...\n');
  console.log('─'.repeat(60));

  try {
    const videoUrl = 'https://youtu.be/YKBaKwVR6W8';

    console.log('\nStarting processing...\n');

    const result = await processVideo({
      source: videoUrl,
      sourceType: 'url'
    });

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ PROCESSING SUCCESSFUL!\n');

    console.log('Result Summary:');
    console.log('  Method:', result.metadata?.method || 'unknown');
    console.log('  Processing Time:', result.metadata?.processingTime || 'unknown');

    if (result.guide) {
      console.log('\nGuide Created:');
      console.log('  Title:', result.guide.title);
      console.log('  Type:', result.guide.type);
      console.log('  Summary:', result.guide.summary?.substring(0, 200) + '...');
      console.log('  Ingredients:', result.guide.ingredients?.length || 0);
      console.log('  Steps:', result.guide.steps?.length || 0);
    }

    if (result.transcription) {
      console.log('\nTranscription:');
      console.log('  Source:', result.transcription.source);
      console.log('  Language:', result.transcription.language);
      console.log('  Length:', result.transcription.text?.length, 'characters');
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 TEST RESULT: PASSED');
    console.log('The video processed successfully with the new error handling!\n');

  } catch (error) {
    console.log('\n' + '─'.repeat(60));
    console.log('\n❌ PROCESSING FAILED\n');
    console.log('Error:', error.message);
    console.log('\nFull Error:', error.stack);
    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 TEST RESULT: FAILED');
    console.log('The video still fails even with new error handling.\n');
    process.exit(1);
  }
}

console.log('Starting test...');
testSilentVideo()
  .then(() => {
    console.log('Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
