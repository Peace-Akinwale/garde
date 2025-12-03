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
 * Check if URL is a TikTok photo post (carousel/slideshow)
 */
function isTikTokPhotoPost(url) {
  return url.includes('tiktok.com') && url.includes('/photo/');
}

/**
 * Download TikTok photo carousel as images
 */
async function downloadTikTokPhotos(url, outputDir) {
  try {
    console.log('Downloading TikTok photo carousel:', url);

    // Create images directory
    const imagesDir = path.join(outputDir, 'images');
    await fsPromises.mkdir(imagesDir, { recursive: true });

    // Use yt-dlp to download all images from the carousel
    const command = `"${ytDlpPath}" --write-thumbnail --skip-download -o "${path.join(imagesDir, '%(title)s_%(autonumber)s.%(ext)s')}" "${url}"`;

    console.log('Downloading TikTok photos...');
    await execPromise(command, { timeout: 120000 });

    // Get all downloaded images
    const files = await fsPromises.readdir(imagesDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

    if (imageFiles.length === 0) {
      throw new Error('No images downloaded from TikTok carousel');
    }

    console.log(`Downloaded ${imageFiles.length} images from TikTok carousel`);
    return imageFiles.map(f => path.join(imagesDir, f));
  } catch (error) {
    console.error('TikTok photo download error:', error);
    throw new Error(`Failed to download TikTok photos: ${error.message}`);
  }
}

/**
 * Extract frames from video for visual analysis (silent videos)
 */
async function extractVideoFrames(videoPath, outputDir, numFrames = 6) {
  try {
    console.log('Extracting video frames for visual analysis...');

    const framesDir = path.join(outputDir, 'frames');
    await fsPromises.mkdir(framesDir, { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', async () => {
          const files = await fsPromises.readdir(framesDir);
          const frameFiles = files.filter(f => f.endsWith('.jpg'));
          console.log(`Extracted ${frameFiles.length} frames`);
          resolve(frameFiles.map(f => path.join(framesDir, f)));
        })
        .on('error', (err) => reject(new Error(`Frame extraction failed: ${err.message}`)))
        .screenshots({
          count: numFrames,
          folder: framesDir,
          filename: 'frame-%i.jpg',
          size: '640x480'
        });
    });
  } catch (error) {
    console.error('Frame extraction error:', error);
    throw new Error(`Failed to extract frames: ${error.message}`);
  }
}

/**
 * Analyze images using OpenAI Vision API
 */
async function analyzeImagesWithVision(imagePaths, isPhotoCarousel = false) {
  try {
    console.log(`Analyzing ${imagePaths.length} images with Vision API...`);

    const imageAnalyses = [];

    for (const imagePath of imagePaths) {
      const imageBuffer = await fsPromises.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

      const prompt = isPhotoCarousel
        ? 'This is an image from a recipe or cooking tutorial carousel/slideshow. Please read and extract ALL visible text, ingredients, measurements, and instructions. Be thorough and capture every detail you see.'
        : `This is a frame from a cooking/recipe video. Please analyze and extract:
1. ANY TEXT ON SCREEN (recipe names, ingredients, measurements, instructions, captions, overlays)
2. Visible ingredients or materials with quantities if shown
3. Cooking actions or techniques being demonstrated
4. Tools or equipment being used
5. Any visual cues about the cooking process

Be extremely thorough with text extraction - even small text or partially visible text is important. If you see text, transcribe it exactly as written.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      imageAnalyses.push(response.choices[0].message.content);
    }

    // Combine all analyses
    const combinedText = imageAnalyses.join('\n\n---\n\n');
    console.log('Vision analysis complete');

    return {
      text: combinedText,
      language: 'en', // Vision API returns English descriptions
      duration: null,
      source: isPhotoCarousel ? 'photo_carousel' : 'video_frames'
    };
  } catch (error) {
    console.error('Vision API error:', error);
    throw new Error(`Vision analysis failed: ${error.message}`);
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
export async function extractGuideFromText(transcriptionText, detectedLanguage = 'en') {
  try {
    // Check if this is a Yoruba video (needs flexible interpretation)
    const isYoruba = detectedLanguage === 'yo' || detectedLanguage === 'yor';

    // Base prompt for all languages
    let languageInstructions = '';

    if (isYoruba) {
      // Special instructions for Yoruba - be flexible with errors
      languageInstructions = `
IMPORTANT INSTRUCTIONS FOR YORUBA CONTENT:
- Be flexible with spelling and pronunciation variations (e.g., "egusi" might be transcribed as "egushi" or "aigusi")
- Yoruba words may be misspelled - use context to understand ingredients and actions
- Nigerian English and pidgin are common - interpret meanings generously
- If you see garbled text, try to infer the intended meaning from cooking context
- Common Yoruba ingredients: ata rodo (scotch bonnet), efo (vegetables), iru (locust beans), obe (stew), etc.
- Correct any obvious transcription errors in your output while preserving the original meaning
`;
    } else {
      // Standard instructions for English and other languages - be accurate
      languageInstructions = `
IMPORTANT INSTRUCTIONS:
- Extract information accurately as transcribed
- Only correct obvious and clear transcription errors
- Preserve the exact terminology and measurements used
- Maintain the speaker's original wording and style
`;
    }

    const prompt = `You are an expert at extracting structured how-to guides and recipes from video transcriptions.

The following is a transcription of a video:

"${transcriptionText}"
${languageInstructions}

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
  "language": "detected primary language (use 'yo' for Yoruba, 'en' for English)",
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

    let transcription;
    let contentType = 'video'; // 'video', 'photo_carousel', 'silent_video'

    // CASE 1: TikTok Photo Carousel (slideshow/images)
    if (!isFile && isTikTokPhotoPost(videoSource)) {
      console.log('Detected TikTok photo carousel - using Vision API');
      contentType = 'photo_carousel';

      const imagePaths = await downloadTikTokPhotos(videoSource, tempDir);
      transcription = await analyzeImagesWithVision(imagePaths, true);
    }
    // CASE 2: Regular video (file or URL)
    else {
      const videoPath = path.join(tempDir, 'video.mp4');
      const audioPath = path.join(tempDir, 'audio.mp3');

      // Step 1: Get video file
      if (isFile) {
        await fsPromises.copyFile(videoSource, videoPath);
      } else {
        await downloadVideo(videoSource, videoPath);
      }

      // Step 2: Extract audio
      await extractAudio(videoPath, audioPath);

      // Step 3: Transcribe audio with Whisper
      transcription = await transcribeAudio(audioPath);

      // Step 4: ALWAYS extract frames and analyze visually
      // This captures text overlays, ingredients shown on screen, and cooking techniques
      console.log('Extracting frames for visual analysis (in addition to audio)...');
      const framePaths = await extractVideoFrames(videoPath, tempDir, 8); // Increased to 8 frames for better coverage
      const visionAnalysis = await analyzeImagesWithVision(framePaths, false);

      // CASE 2B: Silent or minimal speech video
      if (!transcription.text || transcription.text.trim().length < 50) {
        console.log('Minimal speech detected - using primarily visual analysis');
        contentType = 'silent_video';

        transcription.text = transcription.text
          ? `Audio: ${transcription.text}\n\nVisual Analysis:\n${visionAnalysis.text}`
          : visionAnalysis.text;
        transcription.source = 'vision_and_audio';
      }
      // CASE 2C: Video with both audio and visual content (most common)
      else {
        console.log('Combining audio transcription with visual analysis');
        contentType = 'video_with_visual';

        // Combine audio and visual - vision second so it supplements what was said
        transcription.text = `Audio Transcription:\n${transcription.text}\n\nVisual Content (text on screen, ingredients shown, techniques demonstrated):\n${visionAnalysis.text}`;
        transcription.source = 'audio_and_vision';
      }
    }

    // Step 4: Extract structured guide with Claude (pass language for context)
    const extractedGuide = await extractGuideFromText(transcription.text, transcription.language);

    // Step 5: Cleanup temp files
    await fsPromises.rm(tempDir, { recursive: true, force: true });

    return {
      success: true,
      transcription: {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        source: transcription.source || 'audio',
      },
      guide: extractedGuide,
      metadata: {
        processedAt: new Date().toISOString(),
        source: isFile ? 'upload' : 'url',
        contentType,
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
