/**
 * Standalone test for silent video processing (no server needed)
 * Tests Vision API error handling with retry logic
 */

import { downloadVideo, extractFramesFromVideo, analyzeVideoFrames, extractGuideFromText } from './services/videoProcessor.js';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testSilentVideo() {
  console.log('\n=== TESTING SILENT VIDEO WITH VISION API ERROR HANDLING ===\n');
  console.log('Video: https://youtu.be/YKBaKwVR6W8 (20 Minute MAXIMUM FLAVOR tacos)');
  console.log('This video previously failed with repeated "Unable to Extract Content" errors\n');
  console.log('Testing new features:');
  console.log('  ✓ Poor response detection');
  console.log('  ✓ Automatic retry (up to 2 attempts per frame)');
  console.log('  ✓ Failure rate detection (fails if >70% of frames fail)');
  console.log('\n' + '─'.repeat(60) + '\n');

  const videoUrl = 'https://youtu.be/YKBaKwVR6W8';
  const testDir = './test-silent-video-output';
  const videoPath = path.join(testDir, 'video.mp4');

  try {
    // Create test directory
    await fsPromises.mkdir(testDir, { recursive: true });

    console.log('Step 1: Downloading video...');
    await downloadVideo(videoUrl, videoPath);
    const stats = await fsPromises.stat(videoPath);
    console.log(`✅ Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

    console.log('Step 2: Extracting frames (8 frames)...');
    const frames = await extractFramesFromVideo(videoPath, 8);
    console.log(`✅ Extracted ${frames.length} frames\n`);

    console.log('Step 3: Analyzing frames with Vision API (with retry logic)...');
    console.log('Watch for retry attempts on poor responses...\n');

    const analysisResult = await analyzeVideoFrames(frames);

    console.log('\n✅ Vision API analysis complete!\n');
    console.log('Analysis Details:');
    console.log('  Source:', analysisResult.source);
    console.log('  Frames analyzed:', analysisResult.frameCount);
    console.log('  Processing time:', analysisResult.processingTime, 'seconds');
    console.log('  Text length:', analysisResult.text.length, 'characters');

    console.log('\nStep 4: Generating guide from analysis...');
    const guide = await extractGuideFromText(analysisResult.text, 'en');

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ TEST SUCCESSFUL!\n');

    console.log('Generated Guide:');
    console.log('  Title:', guide.title);
    console.log('  Type:', guide.type);
    console.log('  Summary:', guide.summary?.substring(0, 150) + '...');
    console.log('  Ingredients:', guide.ingredients?.length || 0);
    console.log('  Steps:', guide.steps?.length || 0);

    if (guide.ingredients && guide.ingredients.length > 0) {
      console.log('\nIngredients Preview:');
      guide.ingredients.slice(0, 5).forEach((ing, i) => {
        console.log(`  ${i + 1}. ${ing}`);
      });
    }

    if (guide.steps && guide.steps.length > 0) {
      console.log('\nSteps Preview:');
      guide.steps.slice(0, 3).forEach((step, i) => {
        console.log(`  ${i + 1}. ${step.substring(0, 80)}...`);
      });
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 RESULT: Vision API error handling works!');
    console.log('The video processed successfully with the new retry logic.\n');

    // Cleanup
    await fsPromises.rm(testDir, { recursive: true, force: true });
    console.log('Cleaned up test files.');

  } catch (error) {
    console.log('\n' + '─'.repeat(60));
    console.log('\n❌ TEST FAILED\n');
    console.log('Error:', error.message);

    if (error.message.includes('failed to analyze most frames')) {
      console.log('\n💡 This error is expected behavior:');
      console.log('   More than 70% of frames returned poor Vision API responses');
      console.log('   System correctly rejected the video instead of creating bad guide\n');
    }

    console.log('\n' + '─'.repeat(60));

    // Cleanup
    try {
      await fsPromises.rm(testDir, { recursive: true, force: true });
    } catch {}

    throw error;
  }
}

console.log('Starting standalone test...\n');
testSilentVideo()
  .then(() => {
    console.log('\nTest complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nTest failed:', error.message);
    process.exit(1);
  });
