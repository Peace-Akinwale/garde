/**
 * Debug script to test frame extraction and Vision API
 * This will save frames so we can visually inspect them
 */

import ffmpeg from 'fluent-ffmpeg';
import fsPromises from 'fs/promises';
import path from 'path';
import { openai } from './index.js';

async function testFrameExtraction(videoUrl) {
  console.log('\n=== DEBUGGING FRAME EXTRACTION ===\n');
  console.log('Video:', videoUrl);

  const testDir = './debug-test';
  const framesDir = path.join(testDir, 'frames');

  // Create directories
  await fsPromises.mkdir(framesDir, { recursive: true });

  console.log('\nStep 1: Downloading video with ytdl-core...');

  // Import ytdl
  const ytdl = (await import('@distube/ytdl-core')).default;
  const fs = (await import('fs')).default;

  const videoPath = path.join(testDir, 'video.mp4');

  return new Promise((resolve, reject) => {
    const stream = ytdl(videoUrl, { quality: 'lowest' });
    const writer = fs.createWriteStream(videoPath);

    stream.pipe(writer);

    writer.on('finish', async () => {
      console.log('✅ Video downloaded');

      const stats = await fsPromises.stat(videoPath);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      console.log('\nStep 2: Extracting 3 frames...');

      // Extract frames
      ffmpeg(videoPath)
        .on('end', async () => {
          const files = await fsPromises.readdir(framesDir);
          const frameFiles = files.filter(f => f.endsWith('.jpg'));
          console.log(`✅ Extracted ${frameFiles.length} frames`);

          console.log('\nStep 3: Testing Vision API on first frame...');

          const firstFrame = path.join(framesDir, frameFiles[0]);
          const imageBuffer = await fsPromises.readFile(firstFrame);
          const base64Image = imageBuffer.toString('base64');

          console.log(`   Frame size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
          console.log('   Base64 preview:', base64Image.substring(0, 50) + '...');

          console.log('\n   Calling Vision API...');

          try {
            const response = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [{
                role: 'user',
                content: [
                  { type: 'text', text: 'Describe what you see in this image in detail. What ingredients, cooking actions, or text is visible?' },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Image}`,
                      detail: 'high'
                    }
                  }
                ]
              }],
              max_tokens: 500
            });

            const analysis = response.choices[0].message.content;
            console.log('\n✅ VISION API RESPONSE:');
            console.log('─'.repeat(60));
            console.log(analysis);
            console.log('─'.repeat(60));

            console.log(`\n📁 FRAMES SAVED IN: ${framesDir}`);
            console.log('   You can open these images to verify they look correct!');

            resolve();
          } catch (visionError) {
            console.error('\n❌ Vision API Error:', visionError.message);
            reject(visionError);
          }
        })
        .on('error', (err) => {
          console.error('❌ Frame extraction failed:', err.message);
          reject(err);
        })
        .screenshots({
          count: 3,
          folder: framesDir,
          filename: 'frame-%i.jpg',
          size: '640x480'
        });
    });

    writer.on('error', reject);
    stream.on('error', reject);
  });
}

// Test with the problematic video
const videoUrl = 'https://youtu.be/YKBaKwVR6W8';

testFrameExtraction(videoUrl)
  .then(() => {
    console.log('\n✅ DEBUG COMPLETE!');
    console.log('\nCheck the frames in: server/debug-test/frames/');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ DEBUG FAILED:', error);
    process.exit(1);
  });
