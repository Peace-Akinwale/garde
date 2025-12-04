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
          size: '640x480' // Full quality extraction
        });
    });
  } catch (error) {
    console.error('Frame extraction error:', error);
    throw new Error(`Failed to extract frames: ${error.message}`);
  }
}

/**
 * Get Vision API prompt based on content type (domain-agnostic for all tutorials)
 */
function getVisionPrompt(frameIndex, totalFrames, isPhotoCarousel = false) {
  if (isPhotoCarousel) {
    return `This is an image from a tutorial carousel/slideshow (could be cooking, DIY, crafts, beauty, etc.).

EXTRACT EVERYTHING:
1. **ALL VISIBLE TEXT**: Titles, ingredient/material lists, measurements, instructions, captions, overlays, labels - transcribe EXACTLY as written
2. **Items shown**: What ingredients/materials/tools are visible? Include quantities if shown on screen
3. **Steps/Instructions**: Any numbered steps or procedural text
4. **Visual elements**: Colors, textures, stages of completion

Be EXTREMELY thorough. If text is partially visible, include what you can read. Small text matters. Numbers matter. Every word counts.`;
  }

  return `This is frame ${frameIndex + 1} of ${totalFrames} from a how-to/tutorial video (cooking, DIY, crafts, beauty, gardening, sewing, etc.). Extract EVERYTHING visible:

1. **TEXT ON SCREEN** (HIGHEST PRIORITY):
   - Tutorial/project/recipe names
   - Ingredient/material lists with measurements or quantities
   - Step-by-step instructions
   - Captions, subtitles, overlays, annotations
   - Any text visible on packages, containers, labels, or tools
   - Transcribe ALL text EXACTLY as written, even if partial

2. **Visible Items**:
   - What ingredients/materials/supplies are shown?
   - Quantities if visible (cups, grams, pieces, dimensions)
   - Current state (raw, processed, assembled, mixed, cut, etc.)

3. **Actions/Techniques Being Demonstrated**:
   - What is the person doing? (mixing, cutting, assembling, sewing, painting, drilling, etc.)
   - Specific techniques shown (kneading, folding, gluing, stitching, sanding, etc.)

4. **Tools/Equipment**:
   - Kitchen equipment (if cooking: pots, pans, utensils, appliances)
   - Craft/DIY tools (if crafting: scissors, glue gun, sewing machine, drill, saw, brushes, etc.)
   - Beauty tools (if beauty: brushes, applicators, etc.)

5. **Visual Context**:
   - Stage of project (beginning, middle, final product)
   - Colors, textures, consistency, dimensions
   - Visual cues about timing, temperature, or completion

Be EXHAUSTIVE with text extraction - even tiny text or partially visible text is critical. Every item name, measurement, and instruction matters.`;
}

/**
 * Analyze images using OpenAI Vision API - BATCHED PARALLEL + HYBRID DETAIL MODE
 * OPTIMIZED for Render Free Tier: Processes frames in small batches to avoid memory exhaustion
 * First 3 frames use high detail (catch all materials/ingredients)
 * Remaining frames use low detail (faster, cheaper for process steps)
 */
async function analyzeImagesWithVision(imagePaths, isPhotoCarousel = false) {
  try {
    const frameCount = imagePaths.length;
    const BATCH_SIZE = 2; // Process 2 frames at a time (safe for free tier: ~40MB memory)
    console.log(`🚀 Analyzing ${frameCount} images with Vision API (batches of ${BATCH_SIZE})...`);
    const startTime = Date.now();

    const allAnalyses = [];

    // Process frames in batches to prevent memory exhaustion on free tier
    for (let batchStart = 0; batchStart < frameCount; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, frameCount);
      const batchPaths = imagePaths.slice(batchStart, batchEnd);

      console.log(`📦 Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(frameCount / BATCH_SIZE)} (frames ${batchStart + 1}-${batchEnd})...`);

      // Process this batch in parallel
      const batchAnalyses = await Promise.all(
        batchPaths.map(async (imagePath, batchIndex) => {
          const globalIndex = batchStart + batchIndex;

          try {
            // Read image
            const imageBuffer = await fsPromises.readFile(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const ext = path.extname(imagePath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

            // HYBRID DETAIL: First 3 frames = high detail (materials/ingredients)
            // Remaining frames = low detail (process steps are easier to see)
            const detailLevel = globalIndex < 3 ? 'high' : 'low';
            const prompt = getVisionPrompt(globalIndex, frameCount, isPhotoCarousel);

            // Call Vision API
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
                        detail: detailLevel
                      }
                    }
                  ]
                }
              ],
              max_tokens: 500
            });

            const analysis = response.choices[0].message.content;

            // Delete frame immediately after analysis to free memory
            try {
              await fsPromises.unlink(imagePath);
              console.log(`✅ Frame ${globalIndex + 1}/${frameCount} (${detailLevel} detail) analyzed and deleted`);
            } catch (unlinkError) {
              console.warn(`⚠️ Failed to delete frame ${globalIndex + 1}:`, unlinkError.message);
            }

            return { index: globalIndex, analysis, detailLevel };
          } catch (frameError) {
            console.error(`❌ Error analyzing frame ${globalIndex + 1}:`, frameError.message);
            // Return partial result rather than failing entire batch
            return { index: globalIndex, analysis: `[Frame ${globalIndex + 1} analysis failed]`, detailLevel: 'error' };
          }
        })
      );

      // Add batch results to overall results
      allAnalyses.push(...batchAnalyses);

      // Small delay between batches to let memory gc (100ms)
      if (batchEnd < frameCount) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Sort by index to maintain frame order
    allAnalyses.sort((a, b) => a.index - b.index);

    // Combine all analyses
    const combinedText = allAnalyses.map(a => a.analysis).join('\n\n---\n\n');

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⚡ All ${frameCount} frames analyzed in ${elapsedTime}s (${(elapsedTime / frameCount).toFixed(1)}s avg per frame)`);

    return {
      text: combinedText,
      language: 'en', // Vision API returns English descriptions
      duration: null,
      source: isPhotoCarousel ? 'photo_carousel' : 'video_frames',
      processingTime: parseFloat(elapsedTime),
      frameCount
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

    // TikTok-specific options to avoid blocks and hangs
    const isTikTok = url.includes('tiktok.com') || url.includes('vt.tiktok.com');

    let baseOptions, timeout;

    if (isTikTok) {
      // TikTok-specific options with more aggressive settings
      baseOptions = '--no-check-certificate --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --extractor-retries 3 --fragment-retries 3 -f "best[ext=mp4]/best" --no-playlist -o';
      timeout = 120000; // 2 minutes for TikTok (they're slower)
      console.log('Applying TikTok-specific download options (120s timeout, 3 retries)');
    } else {
      baseOptions = '-f "best[ext=mp4]/best" --no-playlist -o';
      timeout = 90000; // 90 seconds for other platforms
    }

    const command = `"${ytDlpPath}" ${baseOptions} "${outputPath}" "${url}"`;

    console.log('Executing yt-dlp...');
    console.log('Command:', command);

    // Execute with timeout
    const { stdout, stderr } = await execPromise(command, {
      timeout,
      killSignal: 'SIGKILL',
    });

    // Log all output for debugging
    if (stdout) console.log('yt-dlp stdout:', stdout.substring(0, 500));
    if (stderr) console.log('yt-dlp stderr:', stderr.substring(0, 500));

    // Verify file was downloaded
    try {
      const stats = await fsPromises.stat(outputPath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      console.log(`✓ yt-dlp download complete: ${stats.size} bytes`);
      return outputPath;
    } catch (statError) {
      throw new Error('Video file was not created - download may have failed silently');
    }

  } catch (error) {
    console.error('yt-dlp failed:', {
      message: error.message,
      killed: error.killed,
      signal: error.signal,
      code: error.code,
      stderr: error.stderr?.substring(0, 500),
      stdout: error.stdout?.substring(0, 500)
    });

    // Provide specific error messages
    if (error.killed || error.signal === 'SIGKILL') {
      throw new Error('Download timeout - TikTok/video source is blocking or too slow. Please download the video to your device and use "Upload File" instead.');
    }

    if (error.stderr && error.stderr.includes('429')) {
      throw new Error('Too many requests - TikTok has rate-limited this server. Please try again in a few minutes or use "Upload File".');
    }

    if (error.stderr && error.stderr.includes('403')) {
      throw new Error('Access forbidden - TikTok is blocking downloads from this server. Please use "Upload File" instead.');
    }

    // Generic error with actual message
    const errorMsg = error.stderr || error.message || 'Unknown error';
    throw new Error(`Download failed: ${errorMsg.substring(0, 200)}`);
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

    const prompt = `You are an expert at extracting structured how-to guides and recipes from video transcriptions. Your goal is ACCURACY and COMPLETENESS.

The following is a transcription of a video (may include both audio and visual content):

"${transcriptionText}"
${languageInstructions}

CRITICAL EXTRACTION RULES:
1. **Ingredients/Materials**: Extract EVERY ingredient/material mentioned, even if quantities aren't specified. Include:
   - Ingredients mentioned in speech
   - Ingredients shown on screen (from visual analysis)
   - Partial mentions (e.g., "add some salt" → include "salt")
   - Common sense ingredients (if making bread and flour is shown, include it)

2. **Steps**: Create clear, actionable steps. Each step should:
   - Start with an action verb (Mix, Chop, Heat, Add, etc.)
   - Include quantities when mentioned
   - Be specific about technique when demonstrated
   - Combine related micro-actions into logical steps
   - Number sequentially (Step 1, Step 2, etc.)

3. **Title**: Create a descriptive, specific title (e.g., "Nigerian Jollof Rice", "Chocolate Chip Cookies", "Handmade Soap Bar")

4. **Category**: Be as specific as possible (e.g., "West African cuisine", "Italian pasta dishes", "Natural skincare")

5. **Tips**: Extract ALL tips, warnings, substitutions, or additional notes mentioned

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
  "ingredients": ["list", "of", "ingredients or materials with quantities when mentioned"],
  "steps": [
    "Step 1: Clear, actionable instruction",
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

IMPORTANT: Return ONLY the JSON object, no additional text. Be thorough - don't skip ingredients or steps just because they seem obvious.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000, // Increased for complex recipes with many ingredients/steps
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
 * Check if transcription contains instructional content (vs storytelling/music)
 * Works for ALL tutorial types: cooking, DIY, crafts, beauty, gardening, sewing, etc.
 */
function hasInstructionalContent(transcription) {
  const text = transcription.text.toLowerCase();
  const words = text.split(/\s+/);

  // Comprehensive keyword lists for ALL tutorial types
  const instructionalKeywords = {
    // Action verbs (cooking + DIY + crafts + beauty + gardening)
    actions: [
      // Cooking
      'add', 'mix', 'stir', 'pour', 'cut', 'chop', 'slice', 'dice', 'mince',
      'cook', 'bake', 'boil', 'fry', 'sauté', 'simmer', 'roast', 'grill',
      'blend', 'fold', 'whisk', 'knead', 'measure', 'combine', 'heat',
      // DIY/Building
      'attach', 'screw', 'nail', 'glue', 'drill', 'sand', 'paint', 'cut',
      'assemble', 'build', 'construct', 'fasten', 'secure', 'mount', 'install',
      'measure', 'mark', 'clamp', 'hammer', 'saw', 'file', 'plane',
      // Sewing/Crafts
      'sew', 'stitch', 'thread', 'hem', 'pin', 'fold', 'press', 'iron',
      'cut', 'trace', 'pattern', 'seam', 'backstitch', 'baste', 'gather',
      // Beauty/Skincare
      'apply', 'blend', 'dab', 'pat', 'massage', 'cleanse', 'exfoliate',
      'moisturize', 'contour', 'highlight', 'brush', 'stroke',
      // Gardening
      'plant', 'water', 'prune', 'trim', 'fertilize', 'dig', 'transplant',
      'mulch', 'weed', 'harvest', 'sow', 'compost'
    ],

    // Measurements & quantities (all domains)
    measurements: [
      // Cooking
      'cup', 'cups', 'tablespoon', 'teaspoon', 'tsp', 'tbsp', 'ounce', 'oz',
      'gram', 'grams', 'kg', 'kilogram', 'pound', 'lb', 'liter', 'ml',
      'pinch', 'dash', 'handful', 'piece', 'pieces',
      // DIY/Building
      'inch', 'inches', 'foot', 'feet', 'cm', 'centimeter', 'meter', 'mm',
      'millimeter', 'yard', 'length', 'width', 'height', 'diameter',
      // General
      'half', 'quarter', 'double', 'triple', 'approximately', 'about'
    ],

    // Materials/Ingredients (all domains)
    materials: [
      // Cooking
      'flour', 'sugar', 'salt', 'pepper', 'oil', 'butter', 'egg', 'milk',
      'water', 'onion', 'garlic', 'tomato', 'cheese', 'meat', 'chicken',
      // DIY/Building
      'wood', 'metal', 'plastic', 'fabric', 'leather', 'steel', 'aluminum',
      'lumber', 'plywood', 'mdf', 'board', 'panel', 'sheet',
      // Crafts/Sewing
      'thread', 'yarn', 'fabric', 'cotton', 'polyester', 'felt', 'canvas',
      'beads', 'ribbon', 'button', 'zipper', 'elastic',
      // Beauty
      'foundation', 'concealer', 'powder', 'blush', 'eyeshadow', 'lipstick',
      'serum', 'moisturizer', 'cleanser', 'toner', 'mask',
      // Gardening
      'soil', 'compost', 'fertilizer', 'seeds', 'mulch', 'potting'
    ],

    // Tools & equipment (all domains)
    tools: [
      // Cooking
      'bowl', 'pan', 'pot', 'knife', 'spoon', 'spatula', 'whisk', 'mixer',
      'blender', 'oven', 'stove', 'microwave',
      // DIY/Building
      'drill', 'saw', 'hammer', 'screwdriver', 'wrench', 'pliers', 'chisel',
      'clamp', 'level', 'ruler', 'tape measure', 'sandpaper',
      // Sewing/Crafts
      'needle', 'scissors', 'pins', 'sewing machine', 'iron', 'rotary cutter',
      'glue gun', 'brush', 'pencil',
      // Beauty
      'brush', 'sponge', 'applicator', 'tweezers', 'curler',
      // Gardening
      'shovel', 'rake', 'hoe', 'trowel', 'pruner', 'shears', 'watering can'
    ],

    // Sequence indicators (universal)
    sequence: [
      'first', 'second', 'third', 'then', 'next', 'after', 'finally',
      'lastly', 'now', 'once', 'until', 'while', 'before', 'during',
      'step', 'stage', 'phase', 'begin', 'start', 'finish', 'end',
      'repeat', 'continue', 'proceed'
    ],

    // Tutorial-specific language
    tutorial: [
      'tutorial', 'how to', 'guide', 'instructions', 'recipe', 'diy',
      'demonstration', 'technique', 'method', 'process', 'procedure',
      'show you', 'teach', 'learn', 'make', 'create', 'craft'
    ]
  };

  // Count keyword matches across all categories
  let totalMatches = 0;
  Object.values(instructionalKeywords).forEach(category => {
    totalMatches += category.filter(keyword => text.includes(keyword)).length;
  });

  // Check for numbered steps (strong indicator)
  const hasNumberedSteps = /\b(step|number)?\s*\d+[:\.]/.test(text);

  // Check for imperative mood (commands)
  const imperativePatterns = [
    /\b(now |then |next |first )(add|mix|cut|place|take|put|use)/gi,
    /\b(let's|let us) (add|mix|make|create|start|begin)/gi,
    /\b(you )(want to|need to|should|can) (add|mix|use|take)/gi
  ];
  const hasImperativeLanguage = imperativePatterns.some(pattern => pattern.test(text));

  // Calculate keyword density
  const keywordDensity = totalMatches / words.length;

  // Decision logic
  const isInstructional =
    hasNumberedSteps ||                      // Has "Step 1:", "1.", etc.
    keywordDensity > 0.05 ||                 // > 5% of words are instructional
    totalMatches > 10 ||                     // At least 10 instructional words
    hasImperativeLanguage;                   // Uses command/instructional language

  console.log(`📊 Instructional content analysis:
    - Total keyword matches: ${totalMatches}
    - Keyword density: ${(keywordDensity * 100).toFixed(2)}%
    - Has numbered steps: ${hasNumberedSteps}
    - Has imperative language: ${hasImperativeLanguage}
    - Word count: ${words.length}
    - IS INSTRUCTIONAL: ${isInstructional}
  `);

  return isInstructional;
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

      // Step 4: SMART DETECTION - Check if we need Vision API
      const isLikelyMusicOrChant = (text) => {
        if (!text || text.length < 50) return true;

        // Check for repetitive content (music/chants repeat phrases)
        const words = text.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        const repetitionRatio = uniqueWords.size / words.length;

        // If less than 30% unique words, it's likely repetitive music/chant
        if (repetitionRatio < 0.3) {
          console.log(`🎵 Detected repetitive audio (${Math.round(repetitionRatio * 100)}% unique) - likely background music`);
          return true;
        }

        // Check for very short transcription relative to video duration
        if (transcription.duration && text.length < transcription.duration * 3) {
          console.log('🎵 Very sparse speech detected - likely background music');
          return true;
        }

        return false;
      };

      // Decision tree for frame extraction
      let frameCount;
      let useVisionAPI = false;

      if (!transcription.text || transcription.text.length < 50) {
        // No meaningful audio - must use Vision API
        frameCount = 12;
        useVisionAPI = true;
        contentType = 'silent_video';
        console.log('🔇 Silent video detected → Using 12 frames');

      } else if (isLikelyMusicOrChant(transcription.text)) {
        // Music/repetitive audio - must use Vision API
        frameCount = 12;
        useVisionAPI = true;
        contentType = 'silent_video';
        console.log('🎵 Music video detected → Using 12 frames');

      } else if (hasInstructionalContent(transcription)) {
        // GOOD instructional narration - use fewer frames as supplement
        frameCount = 6;
        useVisionAPI = true;
        contentType = 'video_with_narration';
        console.log('🎙️ Instructional narration detected → Using 6 supplementary frames');

      } else {
        // Storytelling/non-instructional narration - need more frames
        frameCount = 12;
        useVisionAPI = true;
        contentType = 'video_with_storytelling';
        console.log('📖 Non-instructional narration detected → Using 12 frames');
      }

      // Extract frames and analyze if needed
      if (useVisionAPI) {
        console.log(`Extracting ${frameCount} frames for visual analysis...`);
        const framePaths = await extractVideoFrames(videoPath, tempDir, frameCount);
        const visionAnalysis = await analyzeImagesWithVision(framePaths, false);

        if (contentType === 'video_with_narration') {
          // Combine audio + visual for instructional videos
          transcription.text = `AUDIO NARRATION:\n${transcription.text}\n\nVISUAL CONTENT:\n${visionAnalysis.text}`;
          transcription.source = 'audio_and_vision';
          console.log('✅ Combined narration + visual analysis');
        } else {
          // Use ONLY visual for silent/music/storytelling videos
          transcription.text = visionAnalysis.text;
          transcription.language = 'en';
          transcription.source = 'vision';
          console.log('✅ Using visual analysis only');
        }
      } else {
        // Pure audio transcription (rare - only if perfect narration with no visual text)
        contentType = 'video';
        transcription.source = 'audio';
        console.log('✅ Using audio transcription only');
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
