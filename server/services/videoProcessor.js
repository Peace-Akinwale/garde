import ffmpeg from 'fluent-ffmpeg';
import ytdl from '@distube/ytdl-core';
import axios from 'axios';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { openai, anthropic } from '../index.js';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure FFmpeg and yt-dlp paths for production (Render)
let ytDlpPath = 'yt-dlp'; // default to system yt-dlp

if (process.env.NODE_ENV === 'production') {
  const ffmpegPath = path.join(__dirname, '..', 'ffmpeg-bin', 'ffmpeg');
  const ffprobePath = path.join(__dirname, '..', 'ffmpeg-bin', 'ffprobe');
  const localYtDlpPath = path.join(__dirname, '..', 'yt-dlp-bin', 'yt-dlp');

  if (fs.existsSync(ffmpegPath)) {
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    console.log('✓ Using static FFmpeg binary for production');
  }

  if (fs.existsSync(localYtDlpPath)) {
    ytDlpPath = localYtDlpPath;
    console.log('✓ Using local yt-dlp binary for production');
  }
}

/**
 * Download video using yt-dlp (works for TikTok, YouTube, Instagram, etc.)
 */
async function downloadWithYtDlp(url, outputPath) {
  try {
    console.log('Using yt-dlp to download:', url);

    // yt-dlp command with options
    const command = `"${ytDlpPath}" -f "best[ext=mp4]/best" --no-playlist --quiet --no-warnings -o "${outputPath}" "${url}"`;

    console.log('Executing yt-dlp:', command);
    const { stdout, stderr } = await execPromise(command, {
      timeout: 120000, // 2 minute timeout
    });

    if (stderr && !stderr.includes('WARNING')) {
      console.warn('yt-dlp stderr:', stderr);
    }

    // Verify file was downloaded
    const stats = await fsPromises.stat(outputPath);
    if (stats.size === 0) {
      throw new Error('Downloaded file is empty');
    }

    console.log(`yt-dlp download complete: ${stats.size} bytes`);
    return outputPath;
  } catch (error) {
    console.error('yt-dlp error:', error);
    throw new Error(`Failed to download with yt-dlp: ${error.message}`);
  }
}

/**
 * Download video from URL (TikTok, YouTube, Instagram)
 */
export async function downloadVideo(url, outputPath) {
  try {
    console.log('Attempting to download from:', url);

    // Try yt-dlp first (works for most platforms)
    try {
      return await downloadWithYtDlp(url, outputPath);
    } catch (ytDlpError) {
      console.log('yt-dlp failed, trying fallback methods:', ytDlpError.message);

      // Check if it's a YouTube URL
      if (ytdl.validateURL(url)) {
        console.log('Falling back to ytdl-core for YouTube...');
        try {
          return await downloadYouTubeVideo(url, outputPath);
        } catch (youtubeError) {
          // YouTube bot detection - suggest file upload
          if (youtubeError.message.includes('bot') || youtubeError.message.includes('Sign in')) {
            throw new Error('YouTube has blocked automated downloads from this server. Please download the video to your device first, then use the "Upload File" option instead.');
          }
          throw youtubeError;
        }
      }

      // If yt-dlp failed and it's not YouTube, throw error
      throw new Error(`Video download failed. Please try downloading the video to your device and using the "Upload File" option instead.`);
    }
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
