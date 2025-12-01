import ffmpeg from 'fluent-ffmpeg';
import ytdl from '@distube/ytdl-core';
import axios from 'axios';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { openai, anthropic } from '../index.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure FFmpeg path for production (Render)
if (process.env.NODE_ENV === 'production') {
  const ffmpegPath = path.join(__dirname, '..', 'ffmpeg-bin', 'ffmpeg');
  const ffprobePath = path.join(__dirname, '..', 'ffmpeg-bin', 'ffprobe');

  if (fs.existsSync(ffmpegPath)) {
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    console.log('✓ Using static FFmpeg binary for production');
  }
}

/**
 * Download video from URL (TikTok, YouTube, Instagram)
 */
export async function downloadVideo(url, outputPath) {
  try {
    console.log('Attempting to download from:', url);

    // Check if it's a YouTube URL
    if (ytdl.validateURL(url)) {
      return await downloadYouTubeVideo(url, outputPath);
    }

    // For TikTok and Instagram - use axios with proper headers and redirect handling
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      maxRedirects: 10,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.tiktok.com/'
      },
      timeout: 60000, // 60 second timeout
    });

    console.log('Response status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);

    // Check if we got HTML instead of video
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      throw new Error('TikTok/Instagram URLs require direct video links. Please use File Upload instead, or try a different URL format.');
    }

    // Verify we're getting video content
    if (!contentType.includes('video') && !contentType.includes('octet-stream')) {
      console.warn(`Unexpected content type: ${contentType}`);
    }

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      let downloadedBytes = 0;

      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
      });

      writer.on('finish', async () => {
        console.log(`Downloaded ${downloadedBytes} bytes to ${outputPath}`);

        // Verify file exists and has content
        try {
          const stats = await fsPromises.stat(outputPath);
          if (stats.size === 0) {
            reject(new Error('Downloaded file is empty'));
            return;
          }

          // Check if file is too small (likely HTML/error page)
          if (stats.size < 50000) { // Less than 50KB is suspicious for a video
            console.warn(`Downloaded file is suspiciously small: ${stats.size} bytes`);
            // Read first few bytes to check if it's HTML
            const buffer = await fsPromises.readFile(outputPath, { encoding: 'utf8', flag: 'r' });
            const firstChunk = buffer.substring(0, 500);
            if (firstChunk.includes('<!DOCTYPE') || firstChunk.includes('<html')) {
              reject(new Error('TikTok/Instagram blocked the download. Please use File Upload instead.'));
              return;
            }
          }

          console.log('File size verified:', stats.size, 'bytes');
          resolve(outputPath);
        } catch (err) {
          reject(new Error(`Failed to verify downloaded file: ${err.message}`));
        }
      });

      writer.on('error', reject);
      response.data.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading video:', error.message);
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

/**
 * Download YouTube video
 */
async function downloadYouTubeVideo(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log('Downloading YouTube video:', url);

    try {
      const stream = ytdl(url, {
        quality: 'lowest',
        filter: 'videoandaudio'
      });

      const writer = fs.createWriteStream(outputPath);
      let downloadedBytes = 0;

      stream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
      });

      stream.on('info', (info) => {
        console.log('YouTube video info:', info.videoDetails.title);
        console.log('Duration:', info.videoDetails.lengthSeconds, 'seconds');
      });

      stream.pipe(writer);

      writer.on('finish', async () => {
        console.log(`YouTube download complete: ${downloadedBytes} bytes`);

        // Verify file
        try {
          const stats = await fsPromises.stat(outputPath);
          if (stats.size === 0) {
            reject(new Error('Downloaded YouTube file is empty'));
            return;
          }
          console.log('YouTube file verified:', stats.size, 'bytes');
          resolve(outputPath);
        } catch (err) {
          reject(new Error(`Failed to verify YouTube file: ${err.message}`));
        }
      });

      writer.on('error', (err) => {
        console.error('Writer error:', err);
        reject(err);
      });

      stream.on('error', (err) => {
        console.error('YouTube stream error:', err);
        reject(new Error(`YouTube download failed: ${err.message}`));
      });
    } catch (error) {
      console.error('YouTube download error:', error);
      reject(error);
    }
  });
}

/**
 * Extract audio from video file
 */
export async function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .format('mp3')
      .on('end', () => resolve(audioPath))
      .on('error', (err) => reject(new Error(`Audio extraction failed: ${err.message}`)))
      .run();
  });
}

/**
 * Transcribe audio using OpenAI Whisper
 * Supports Yoruba and 98+ other languages
 */
export async function transcribeAudio(audioPath, language = null) {
  try {
    const audioFile = await fsPromises.readFile(audioPath);
    const blob = new Blob([audioFile], { type: 'audio/mp3' });
    const file = new File([blob], path.basename(audioPath), { type: 'audio/mp3' });

    // Build options object - only include language if specified
    const options = {
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
    };

    // Only add language if it's not null (otherwise auto-detect)
    if (language) {
      options.language = language;
    }

    const transcription = await openai.audio.transcriptions.create(options);

    return {
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Extract structured guide/recipe from transcription using Claude
 */
export async function extractGuideFromText(transcriptionText, guideType = 'auto') {
  try {
    const prompt = `You are an expert at extracting structured how-to guides and recipes from video transcriptions.

The following is a transcription of a video (possibly in Yoruba, English, or other languages):

"${transcriptionText}"

Please analyze this transcription and extract a structured guide. Determine if this is:
1. A cooking recipe
2. A craft/DIY project (soap making, furniture, clothing, etc.)
3. A general how-to guide
4. Something else

Return a JSON object with this structure:
{
  "title": "Brief descriptive title of the guide/recipe",
  "type": "recipe|craft|howto|other",
  "category": "specific category (e.g., Nigerian cuisine, soap making, woodworking)",
  "language": "detected primary language",
  "ingredients": ["list", "of", "ingredients or materials"],
  "steps": [
    "Step 1: Clear instruction",
    "Step 2: Next instruction",
    "..."
  ],
  "duration": "estimated time if mentioned (e.g., '30 minutes', '2 hours')",
  "servings": "if applicable (for recipes)",
  "difficulty": "easy|medium|hard",
  "tips": ["any", "helpful", "tips or notes mentioned"],
  "summary": "A brief 2-3 sentence summary of what this guide teaches"
}

If the transcription doesn't contain a clear guide or recipe, set type to "unclear" and provide what you can extract.

IMPORTANT: Return ONLY the JSON object, no additional text.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract JSON from Claude's response
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Guide extraction error:', error);
    throw new Error(`Failed to extract guide: ${error.message}`);
  }
}

/**
 * Complete video processing pipeline
 */
export async function processVideo(videoSource, isFile = false, userId) {
  const sessionId = uuidv4();
  const tempDir = path.join(process.cwd(), 'uploads', sessionId);

  try {
    // Create temp directory
    await fsPromises.mkdir(tempDir, { recursive: true });

    const videoPath = path.join(tempDir, 'video.mp4');
    const audioPath = path.join(tempDir, 'audio.mp3');

    // Step 1: Get video file
    if (isFile) {
      // videoSource is already a file path
      await fsPromises.copyFile(videoSource, videoPath);
    } else {
      // videoSource is a URL
      await downloadVideo(videoSource, videoPath);
    }

    // Step 2: Extract audio
    await extractAudio(videoPath, audioPath);

    // Step 3: Transcribe audio with Whisper
    const transcription = await transcribeAudio(audioPath);

    // Step 4: Extract structured guide with Claude
    const extractedGuide = await extractGuideFromText(transcription.text);

    // Step 5: Cleanup temp files
    await fsPromises.rm(tempDir, { recursive: true, force: true });

    return {
      success: true,
      transcription: {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
      },
      guide: extractedGuide,
      metadata: {
        processedAt: new Date().toISOString(),
        source: isFile ? 'upload' : 'url',
      },
    };
  } catch (error) {
    // Cleanup on error
    try {
      await fsPromises.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    throw error;
  }
}
