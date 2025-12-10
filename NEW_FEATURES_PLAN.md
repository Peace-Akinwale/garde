# Garde - New Features Implementation Plan

**Date:** December 9, 2025
**Features:**
1. Animated Video Processing with Percentage Progress
2. Article Reading & Extraction (DIY/How-To Guides)

---

## 📊 FEATURE 1: Animated Processing with Detailed Progress

### Current State Analysis

**What Works:**
- ✅ Backend job processing with progress tracking
- ✅ Frontend polls job status every 2 seconds
- ✅ Basic progress bar (0-100%)
- ✅ Text status updates (`currentStep`)
- ✅ Caching system for instant results

**What Needs Improvement:**
- ❌ Progress animation is basic (just a sliding bar)
- ❌ No visual engagement during 45-60 second wait
- ❌ Progress stages aren't granular enough
- ❌ No fun animations to keep users engaged
- ❌ Percentage updates aren't tied to actual processing stages

### The Problem

Users wait **45-60 seconds** for video processing:
- Downloading video: ~30s
- Extracting audio: ~5s
- Whisper transcription: ~15s
- Claude extraction: ~15s
- Saving to DB: ~2s

**Total:** ~67 seconds of boredom! 😴

### The Solution: Multi-Stage Animated Progress System

**Design Philosophy:**
1. **Transparency** - Show users EXACTLY what's happening
2. **Engagement** - Use animations, icons, and micro-interactions
3. **Accuracy** - Real percentages tied to actual backend stages
4. **Delight** - Make waiting fun with smooth transitions

---

### Implementation Architecture

#### **Backend Changes** (`server/routes/video.js` + `server/services/jobProcessor.js`)

**Current Job Status Schema:**
```javascript
{
  jobId: '...',
  status: 'pending|processing|completed|failed',
  progress: 45,  // 0-100
  currentStep: 'Transcribing audio...',
  error: null
}
```

**NEW Enhanced Job Status Schema:**
```javascript
{
  jobId: '...',
  status: 'pending|processing|completed|failed',
  progress: 45,  // Overall 0-100

  // NEW: Detailed stage tracking
  stages: [
    {
      name: 'download',
      label: 'Downloading video',
      status: 'completed',  // pending|processing|completed|failed
      progress: 100,
      startTime: '2025-12-09T10:00:00Z',
      endTime: '2025-12-09T10:00:30Z',
      icon: 'download'
    },
    {
      name: 'extract_audio',
      label: 'Extracting audio',
      status: 'completed',
      progress: 100,
      startTime: '2025-12-09T10:00:30Z',
      endTime: '2025-12-09T10:00:35Z',
      icon: 'music'
    },
    {
      name: 'transcribe',
      label: 'Transcribing with AI',
      status: 'processing',
      progress: 45,
      startTime: '2025-12-09T10:00:35Z',
      endTime: null,
      icon: 'brain'
    },
    {
      name: 'extract',
      label: 'Extracting recipe/guide',
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      icon: 'sparkles'
    },
    {
      name: 'save',
      label: 'Saving to library',
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      icon: 'save'
    }
  ],

  // NEW: Real-time stats
  stats: {
    videoSize: '12.5 MB',
    audioDuration: '2:34',
    detectedLanguage: 'English',
    framesExtracted: 6,
    estimatedTimeRemaining: 23  // seconds
  },

  currentStep: 'Transcribing audio...',  // Keep for backward compatibility
  error: null
}
```

**Backend Implementation Steps:**

1. **Update `jobProcessor.js`** - Add stage tracking:
```javascript
// When starting download
await updateJobProgress(jobId, {
  progress: 10,
  stages: [
    { name: 'download', status: 'processing', progress: 0, startTime: new Date() }
  ]
});

// When download completes
await updateJobProgress(jobId, {
  progress: 40,
  stages: [
    { name: 'download', status: 'completed', progress: 100, endTime: new Date() },
    { name: 'extract_audio', status: 'processing', progress: 0, startTime: new Date() }
  ],
  stats: { videoSize: '12.5 MB' }
});

// Continue for each stage...
```

2. **Add helper function** for stage updates:
```javascript
function createStageUpdate(stageName, status, progress, stats = {}) {
  return {
    name: stageName,
    status,
    progress,
    startTime: status === 'processing' ? new Date() : null,
    endTime: status === 'completed' ? new Date() : null,
    ...stats
  };
}
```

3. **Progress Percentage Mapping:**
```javascript
const STAGE_WEIGHTS = {
  download: 40,        // 0-40%
  extract_audio: 5,    // 40-45%
  transcribe: 25,      // 45-70%
  extract: 20,         // 70-90%
  save: 10            // 90-100%
};
```

---

#### **Frontend Changes** (`client/components/AddGuideModal.js`)

**NEW Component: `ProcessingAnimation.js`**

```jsx
export default function ProcessingAnimation({ stages, stats, progress }) {
  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Processing Your Video</h3>
          <span className="text-2xl font-bold text-primary-600">{progress}%</span>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Stage List with Animations */}
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <StageItem key={stage.name} stage={stage} index={index} />
        ))}
      </div>

      {/* Stats Panel */}
      {stats && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {stats.videoSize && (
              <div><span className="text-gray-500">Size:</span> <span className="font-medium">{stats.videoSize}</span></div>
            )}
            {stats.audioDuration && (
              <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{stats.audioDuration}</span></div>
            )}
            {stats.detectedLanguage && (
              <div><span className="text-gray-500">Language:</span> <span className="font-medium">{stats.detectedLanguage}</span></div>
            )}
            {stats.estimatedTimeRemaining && (
              <div><span className="text-gray-500">Time left:</span> <span className="font-medium">{stats.estimatedTimeRemaining}s</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StageItem({ stage, index }) {
  const icons = {
    download: <Download className="animate-bounce" />,
    music: <Music className="animate-pulse" />,
    brain: <Brain className="animate-spin-slow" />,
    sparkles: <Sparkles className="animate-pulse" />,
    save: <Save className="animate-bounce" />
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
      stage.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' :
      stage.status === 'processing' ? 'bg-blue-50 dark:bg-blue-900/20 animate-pulse-soft' :
      'bg-gray-50 dark:bg-slate-800/50 opacity-60'
    }`}>
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        stage.status === 'completed' ? 'bg-green-500' :
        stage.status === 'processing' ? 'bg-blue-500' :
        'bg-gray-300'
      }`}>
        {stage.status === 'completed' ? (
          <CheckCircle className="text-white" size={20} />
        ) : stage.status === 'processing' ? (
          icons[stage.icon] || <Loader className="animate-spin text-white" size={20} />
        ) : (
          <Circle className="text-white" size={20} />
        )}
      </div>

      {/* Label & Progress */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">{stage.label}</span>
          {stage.status === 'processing' && (
            <span className="text-xs text-blue-600">{stage.progress}%</span>
          )}
        </div>

        {/* Mini progress bar for current stage */}
        {stage.status === 'processing' && (
          <div className="h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${stage.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Timing */}
      {stage.endTime && (
        <span className="text-xs text-gray-500">
          {calculateDuration(stage.startTime, stage.endTime)}
        </span>
      )}
    </div>
  );
}
```

**Custom CSS Animations** (`client/app/globals.css`):
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes pulse-soft {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.95; }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-pulse-soft {
  animation: pulse-soft 2s ease-in-out infinite;
}

.animate-spin-slow {
  animation: spin 3s linear infinite;
}
```

---

### Visual Design Mockup

```
┌─────────────────────────────────────────────┐
│  Processing Your Video              67%     │
│  ████████████████░░░░░░░░░░░░░░░░░░░       │
│                                              │
│  ✓ Downloading video            [3.2s]     │
│  ✓ Extracting audio             [0.8s]     │
│  ⚡ Transcribing with AI          67%       │
│    ████████████████░░░░░░░                  │
│  ○ Extracting recipe/guide                  │
│  ○ Saving to library                        │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │ Size: 12.5 MB   Duration: 2:34     │   │
│  │ Language: English   Time left: 23s │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

### Implementation Checklist

**Backend:**
- [ ] Update job schema to include `stages` array
- [ ] Update job schema to include `stats` object
- [ ] Add stage tracking to `downloadVideo()` function
- [ ] Add stage tracking to `extractAudio()` function
- [ ] Add stage tracking to `transcribeAudio()` function
- [ ] Add stage tracking to `extractGuideFromText()` function
- [ ] Calculate and update `estimatedTimeRemaining`
- [ ] Test progress updates across all video types

**Frontend:**
- [ ] Create `ProcessingAnimation.js` component
- [ ] Add custom CSS animations
- [ ] Import and use in `AddGuideModal.js`
- [ ] Add Lucide icons (Download, Music, Brain, Sparkles, Save)
- [ ] Test animations on different screen sizes
- [ ] Add dark mode support for all animations

**Testing:**
- [ ] Test with YouTube URLs
- [ ] Test with TikTok URLs
- [ ] Test with file uploads
- [ ] Test with cached results
- [ ] Test error handling (failed stages)

---

## 📄 FEATURE 2: Article Reading & Extraction

### Vision

**Goal:** Let users paste article URLs or upload PDF/HTML files containing DIY guides, recipes, or how-to tutorials. Garde will:
1. Extract all text content
2. Analyze images for ingredients/materials
3. Process any embedded videos
4. Structure everything into a clean guide with:
   - **Title**
   - **Ingredients/Materials** (from text + images)
   - **Step-by-step instructions**
   - **Images** (optional gallery)
   - **Tips/Notes**

### Use Cases

**Example 1: DIY Soap Making Article**
- URL: `https://blog.example.com/how-to-make-lavender-soap`
- Content: Text instructions + 8 step images + 1 embedded YouTube video
- Garde extracts:
  - Materials: Olive oil (500ml), Lye (150g), Lavender oil (20ml), etc.
  - Steps: 15 clear instructions
  - Images: Gallery of 8 process images
  - Video: Processes embedded YouTube link separately

**Example 2: Recipe Blog Post**
- URL: `https://foodblog.com/best-banana-bread-recipe`
- Content: Rich HTML with ingredient list, instructions, and photos
- Garde extracts:
  - Ingredients: 3 ripe bananas, 2 cups flour, etc.
  - Steps: Mix dry ingredients, Combine wet ingredients, etc.
  - Images: Final product photo

**Example 3: Uploaded PDF**
- File: `DIY_Birdhouse_Plans.pdf`
- Content: 5-page PDF with materials list, cut diagrams, assembly steps
- Garde extracts:
  - Materials: Wood (1x6 pine), Screws (1¼"), Wood glue, etc.
  - Steps: Cut wood to dimensions, Drill pilot holes, etc.

---

### Technical Architecture

#### **Input Methods**

1. **URL Paste** (most common)
   - Supported: Any HTTP/HTTPS URL
   - Crawl webpage content
   - Extract HTML, images, embedded videos

2. **PDF Upload**
   - Max size: 10MB
   - Extract text with `pdf-parse`
   - Extract images with `pdf-img-convert`

3. **HTML/Markdown Upload**
   - Direct file upload
   - Parse with existing tools

---

### Backend Implementation

#### **New Dependencies**

```bash
npm install --save axios cheerio pdf-parse turndown url-parse
```

**What each does:**
- `axios` - Fetch webpage HTML
- `cheerio` - Parse HTML (jQuery-like syntax)
- `pdf-parse` - Extract text from PDFs
- `turndown` - Convert HTML to Markdown
- `url-parse` - Validate and parse URLs

---

#### **New Service: `server/services/articleProcessor.js`**

```javascript
import axios from 'axios';
import cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import TurndownService from 'turndown';
import { openai, anthropic } from '../index.js';
import { analyzeImagesWithVision } from './videoProcessor.js'; // Reuse existing Vision API

/**
 * Fetch and parse article from URL
 */
export async function fetchArticle(url) {
  try {
    // Fetch HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GardeBot/1.0)'
      },
      timeout: 30000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Remove scripts, styles, nav, footer, ads
    $('script, style, nav, footer, .ad, .ads, .advertisement').remove();

    // Extract title
    const title = $('h1').first().text() || $('title').text() || 'Untitled Guide';

    // Extract main content (try common article containers)
    const contentSelectors = [
      'article',
      '.post-content',
      '.article-content',
      '.entry-content',
      'main',
      '.content'
    ];

    let $content = null;
    for (const selector of contentSelectors) {
      if ($(selector).length > 0) {
        $content = $(selector).first();
        break;
      }
    }

    if (!$content) {
      $content = $('body'); // Fallback to body
    }

    // Extract images
    const images = [];
    $content.find('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && !src.includes('icon') && !src.includes('logo')) {
        // Convert relative URLs to absolute
        const absoluteUrl = new URL(src, url).href;
        images.push(absoluteUrl);
      }
    });

    // Extract videos (YouTube, Vimeo embeds)
    const videos = [];
    $content.find('iframe[src*="youtube"], iframe[src*="vimeo"]').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src) videos.push(src);
    });

    // Convert HTML to clean text
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown($content.html());

    return {
      title,
      content: markdown,
      images: images.slice(0, 10), // Max 10 images
      videos: videos.slice(0, 3),   // Max 3 videos
      sourceUrl: url
    };
  } catch (error) {
    throw new Error(`Failed to fetch article: ${error.message}`);
  }
}

/**
 * Process PDF file
 */
export async function processPDF(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);

    return {
      title: 'PDF Guide',
      content: data.text,
      images: [], // PDF image extraction is complex - skip for v1
      videos: [],
      sourceUrl: null
    };
  } catch (error) {
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}

/**
 * Analyze article images for ingredients/materials
 */
async function analyzeArticleImages(imageUrls) {
  if (imageUrls.length === 0) return '';

  try {
    const analyses = await Promise.all(
      imageUrls.slice(0, 5).map(async (url, index) => {
        try {
          // Download image
          const response = await axios.get(url, { responseType: 'arraybuffer' });
          const base64Image = Buffer.from(response.data).toString('base64');
          const contentType = response.headers['content-type'] || 'image/jpeg';

          // Call Vision API
          const visionResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `This is image ${index + 1} from a DIY/recipe article. Extract:
1. Any visible ingredients, materials, or supplies (with quantities if shown)
2. Any text on screen (ingredient lists, measurements, labels)
3. What step/stage this image shows`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${contentType};base64,${base64Image}`,
                    detail: 'low' // Low detail for article images (faster + cheaper)
                  }
                }
              ]
            }],
            max_tokens: 300
          });

          return visionResponse.choices[0].message.content;
        } catch (imgError) {
          console.error(`Error analyzing image ${index + 1}:`, imgError.message);
          return `[Image ${index + 1} could not be analyzed]`;
        }
      })
    );

    return analyses.join('\n\n---\n\n');
  } catch (error) {
    console.error('Image analysis error:', error);
    return '';
  }
}

/**
 * Extract structured guide from article using Claude
 */
export async function extractGuideFromArticle(articleData) {
  try {
    // Analyze images if present
    let imageAnalysis = '';
    if (articleData.images.length > 0) {
      console.log(`Analyzing ${articleData.images.length} images...`);
      imageAnalysis = await analyzeArticleImages(articleData.images);
    }

    // Combine text content + image analysis
    const fullContent = `
ARTICLE TITLE: ${articleData.title}

TEXT CONTENT:
${articleData.content}

${imageAnalysis ? `\nIMAGE ANALYSIS:\n${imageAnalysis}` : ''}

${articleData.videos.length > 0 ? `\nEMBEDDED VIDEOS: ${articleData.videos.join(', ')}` : ''}
    `.trim();

    // Use Claude to extract structured guide
    const prompt = `You are an expert at extracting structured DIY guides, recipes, and how-to tutorials from article text.

The following is content from a web article or PDF:

"${fullContent}"

EXTRACTION RULES:
1. **Ingredients/Materials**: Extract EVERY ingredient or material mentioned
   - Include quantities when specified
   - Combine text mentions + items seen in images
   - Be thorough - don't skip anything

2. **Steps**: Create clear, sequential instructions
   - Number each step
   - Start with action verbs
   - Combine related micro-steps
   - Include measurements and techniques

3. **Title**: Use the article title or create a descriptive one

4. **Type**: Determine if this is:
   - "recipe" - Food/cooking/baking
   - "craft" - DIY projects, handmade items, physical crafts
   - "howto" - Beauty, personal care, general tutorials
   - "other" - Everything else

5. **Tips**: Extract any warnings, substitutions, pro tips, or notes

Return ONLY a JSON object with this structure:
{
  "title": "Descriptive title",
  "type": "recipe|craft|howto|other",
  "category": "Specific category (e.g., Woodworking, Nigerian cuisine, Soap making)",
  "language": "en",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "steps": [
    "Step 1: Clear instruction",
    "Step 2: Next instruction",
    ...
  ],
  "duration": "estimated time if mentioned",
  "servings": "if applicable for recipes",
  "difficulty": "easy|medium|hard",
  "tips": ["tip 1", "tip 2", ...],
  "summary": "Brief 2-3 sentence summary"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Article extraction error:', error);
    throw new Error(`Failed to extract guide from article: ${error.message}`);
  }
}

/**
 * Complete article processing pipeline
 */
export async function processArticle(source, type = 'url', userId) {
  try {
    let articleData;

    if (type === 'url') {
      articleData = await fetchArticle(source);
    } else if (type === 'pdf') {
      articleData = await processPDF(source);
    } else {
      throw new Error('Unsupported article type');
    }

    // Extract structured guide
    const extractedGuide = await extractGuideFromArticle(articleData);

    return {
      success: true,
      guide: extractedGuide,
      metadata: {
        processedAt: new Date().toISOString(),
        source: type,
        sourceUrl: articleData.sourceUrl,
        imageCount: articleData.images.length,
        videoCount: articleData.videos.length
      }
    };
  } catch (error) {
    console.error('Article processing error:', error);
    throw error;
  }
}
```

---

#### **New Route: `server/routes/article.js`**

```javascript
import express from 'express';
import { processArticle } from '../services/articleProcessor.js';
import { trackActivity } from '../services/analytics.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

/**
 * POST /api/article/process-url
 * Process article from URL
 */
router.post('/process-url', async (req, res) => {
  try {
    const { url, userId } = req.body;

    if (!url || !userId) {
      return res.status(400).json({ error: 'URL and userId required' });
    }

    console.log(`Processing article from URL: ${url}`);

    const result = await processArticle(url, 'url', userId);

    // Track activity
    await trackActivity(userId, 'article_processed', { url });

    res.json(result);
  } catch (error) {
    console.error('Article URL processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/article/process-pdf
 * Process uploaded PDF
 */
router.post('/process-pdf', upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body;
    const pdfBuffer = req.file?.buffer;

    if (!pdfBuffer || !userId) {
      return res.status(400).json({ error: 'PDF file and userId required' });
    }

    console.log(`Processing PDF: ${req.file.originalname}`);

    const result = await processArticle(pdfBuffer, 'pdf', userId);

    // Track activity
    await trackActivity(userId, 'article_processed', {
      filename: req.file.originalname
    });

    res.json(result);
  } catch (error) {
    console.error('PDF processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

---

#### **Update `server/index.js`**

```javascript
import articleRoutes from './routes/article.js';

// Add route
app.use('/api/article', articleRoutes);
```

---

### Frontend Implementation

#### **New Component: `client/components/AddArticleModal.js`**

```jsx
'use client';

import { useState } from 'react';
import { articleAPI, guidesAPI } from '@/lib/api';
import { X, Link as LinkIcon, FileText, Loader } from 'lucide-react';

export default function AddArticleModal({ isOpen, onClose, onGuideAdded, userId }) {
  const [mode, setMode] = useState('url'); // 'url' or 'pdf'
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);

    try {
      let result;

      if (mode === 'url') {
        if (!url) throw new Error('Please enter an article URL');
        result = await articleAPI.processUrl(url, userId);
      } else {
        if (!file) throw new Error('Please select a PDF file');
        result = await articleAPI.processPdf(file, userId);
      }

      if (!result.success) throw new Error('Failed to process article');

      // Save guide to database
      await guidesAPI.create({
        userId,
        ...result.guide,
        sourceUrl: mode === 'url' ? url : null
      });

      onGuideAdded();
      resetForm();
    } catch (error) {
      setError(error.message);
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setUrl('');
    setFile(null);
    setProcessing(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
        <button onClick={resetForm} className="absolute top-4 right-4">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6">Add Guide from Article</h2>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('url')}
            className={`flex-1 py-3 px-4 rounded-lg ${
              mode === 'url' ? 'bg-primary-500 text-white' : 'bg-gray-200'
            }`}
          >
            <LinkIcon className="inline mr-2" size={20} />
            Article URL
          </button>
          <button
            onClick={() => setMode('pdf')}
            className={`flex-1 py-3 px-4 rounded-lg ${
              mode === 'pdf' ? 'bg-primary-500 text-white' : 'bg-gray-200'
            }`}
          >
            <FileText className="inline mr-2" size={20} />
            Upload PDF
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'url' ? (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Article URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://blog.example.com/how-to-make-soap"
                className="w-full px-4 py-3 border rounded-lg"
                disabled={processing}
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Paste a link to a recipe, DIY guide, or how-to article
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Upload PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full px-4 py-3 border rounded-lg"
                disabled={processing}
              />
              <p className="mt-2 text-xs text-gray-500">Max 10MB</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-3 border rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 py-3 bg-primary-500 text-white rounded-lg disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader className="inline animate-spin mr-2" size={16} />
                  Processing...
                </>
              ) : (
                'Extract Guide'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

#### **Update Main Dashboard** (`client/app/page.js`)

Add button to open article modal alongside video upload:

```jsx
<button onClick={() => setArticleModalOpen(true)}>
  📄 Add from Article
</button>
```

---

### API Helper (`client/lib/api.js`)

```javascript
export const articleAPI = {
  processUrl: async (url, userId) => {
    const response = await fetch(`${API_URL}/api/article/process-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, userId })
    });
    return response.json();
  },

  processPdf: async (file, userId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await fetch(`${API_URL}/api/article/process-pdf`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }
};
```

---

### Testing Plan

**Test Cases:**

1. **Recipe Blog Post**
   - URL: Any food blog with structured recipe
   - Expected: Clean ingredient list + numbered steps

2. **DIY Article**
   - URL: Instructables, Pinterest, or craft blog
   - Expected: Materials list + assembly steps

3. **PDF Guide**
   - File: User-provided PDF manual
   - Expected: Text extraction + structured guide

4. **Article with Images**
   - URL: Article with ingredient/material photos
   - Expected: Vision API extracts items from images

5. **Error Cases**
   - Invalid URL (404)
   - Paywalled content
   - PDF too large (>10MB)

---

## 🚀 Implementation Timeline

### Week 1: Feature 1 (Animated Progress)

**Day 1-2: Backend**
- Update job schema
- Add stage tracking to all processing functions
- Test progress updates

**Day 3-4: Frontend**
- Build ProcessingAnimation component
- Add animations and icons
- Test on all devices

**Day 5: Polish & Testing**
- Fine-tune animations
- Test with real videos
- Fix bugs

### Week 2: Feature 2 (Article Reading)

**Day 1-2: Backend**
- Install dependencies
- Build articleProcessor.js
- Create article routes

**Day 3-4: Frontend**
- Build AddArticleModal component
- Update dashboard UI
- Add API helpers

**Day 5-7: Testing & Launch**
- Test all article types
- Handle edge cases
- Deploy to production

---

## 📊 Success Metrics

**Feature 1:**
- ✅ Users see detailed progress breakdown
- ✅ Average engagement during wait increases
- ✅ Fewer "is it broken?" support questions

**Feature 2:**
- ✅ Users can add guides from articles in <30 seconds
- ✅ 90%+ accuracy on ingredient/material extraction
- ✅ Works with popular recipe/DIY blogs

---

## 🎯 Next Steps

1. **Choose which feature to build first** (or build in parallel!)
2. **Set up development environment**
3. **Start with backend changes** (easier to test)
4. **Build frontend incrementally**
5. **Test thoroughly before deploying**

---

## 💡 Future Enhancements

**Feature 1:**
- Add sound effects for each stage completion
- Show fun facts/tips while processing
- Estimate time remaining based on video size

**Feature 2:**
- Support for Google Docs/Notion links
- Bulk article import (paste 10 URLs)
- Browser extension (right-click → "Add to Garde")
- OCR for scanned recipe cards

---

**Ready to start? Let's build! 🚀**
