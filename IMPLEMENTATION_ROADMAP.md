# YouTube Transcript Implementation Roadmap

## Overview
This document outlines the exact steps to implement YouTube transcript-based guide extraction as a primary method, with intelligent fallbacks to the existing video download approach.

---

## Phase 1: Setup & Installation (10 minutes)

### Step 1.1: Install Package
```bash
cd server
npm install @danielxceron/youtube-transcript
```

### Step 1.2: Verify Installation
```bash
npm list @danielxceron/youtube-transcript
```

Expected output:
```
garde-server@1.0.0 C:\AKINWALE\Garde\server
└── @danielxceron/youtube-transcript@1.x.x
```

---

## Phase 2: Add Transcript Functions (30 minutes)

### Step 2.1: Add Import to videoProcessor.js

**File**: `server/services/videoProcessor.js`

**Location**: Top of file (after existing imports)

```javascript
// Add this import after line 11 (after other imports)
import { YoutubeTranscript } from '@danielxceron/youtube-transcript';
```

### Step 2.2: Add Helper Function

**Location**: After `extractVideoId()` function (around line 100)

```javascript
/**
 * Extract video ID from YouTube URL
 * (Existing function - no changes needed)
 */
function extractVideoId(url) {
  // ... existing code ...
}

// ADD NEW FUNCTION HERE ⬇️

/**
 * Fetch native YouTube transcript (captions/subtitles)
 *
 * This bypasses video download and extracts text directly from YouTube's API.
 * Works for ~60-70% of videos that have captions enabled.
 *
 * @param {string} videoUrl - YouTube URL or video ID
 * @returns {Object|null} - { text: string, language: string, segments: array } or null
 */
async function fetchYoutubeTranscript(videoUrl) {
  try {
    console.log('📝 Attempting to fetch YouTube native transcript...');

    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);

    if (!transcript || transcript.length === 0) {
      console.log('⚠️  No transcript available for this video');
      return null;
    }

    // Combine all segments into full text
    const fullText = transcript
      .map(segment => segment.text)
      .join(' ')
      .trim();

    // Basic quality check
    if (fullText.length < 100) {
      console.log('⚠️  Transcript too short (< 100 characters) - likely not useful');
      return null;
    }

    console.log(`✅ Transcript fetched: ${transcript.length} segments, ${fullText.length} chars`);

    return {
      text: fullText,
      language: 'en', // YouTube API doesn't expose this, default to English
      segments: transcript, // Keep for potential future use (timestamps)
      method: 'youtube_transcript',
    };
  } catch (error) {
    // Don't throw - just return null and let caller decide fallback
    console.log('ℹ️  Transcript fetch failed:', error.message);
    return null;
  }
}
```

### Step 2.3: Modify Main Processing Function

**File**: `server/services/videoProcessor.js`

**Function**: `processVideoUrl()` (around line 870)

**Current Code**:
```javascript
export async function processVideoUrl(jobId, videoUrl, userId) {
  try {
    console.log(`Processing video URL for job ${jobId}: ${videoUrl}`);

    // Existing code that immediately tries to download...
    const downloadResult = await downloadAndProcessVideo(videoUrl, userId);
    // ... rest of function
  } catch (error) {
    // ... error handling
  }
}
```

**Modified Code** (add transcript attempt BEFORE download):
```javascript
export async function processVideoUrl(jobId, videoUrl, userId) {
  try {
    console.log(`Processing video URL for job ${jobId}: ${videoUrl}`);

    // ========== NEW: TRY TRANSCRIPT FIRST ==========
    // Only attempt for YouTube videos (skip TikTok, Instagram, etc.)
    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

    if (isYouTube) {
      console.log('🎬 YouTube video detected - attempting transcript extraction...');

      const transcriptData = await fetchYoutubeTranscript(videoUrl);

      if (transcriptData) {
        console.log('✅ Using transcript! Skipping video download.');

        // Update job progress
        await updateJobProgress(jobId, 40, 'Extracted transcript from YouTube');

        // Extract guide using existing Claude function
        const guide = await extractGuideFromText(
          transcriptData.text,
          transcriptData.language
        );

        // Update job progress
        await updateJobProgress(jobId, 80, 'Generated guide from transcript');

        // Save guide to database (existing function)
        const savedGuide = await saveGuideToDatabase(userId, guide, videoUrl);

        // Mark job as complete
        await updateJobProgress(jobId, 100, 'Completed', guide);

        console.log(`✅ Job ${jobId} completed via transcript (instant, $0 cost)`);
        return savedGuide;
      } else {
        console.log('⚠️  Transcript unavailable - falling back to video download');
        await updateJobProgress(jobId, 10, 'Transcript unavailable, downloading video...');
      }
    }
    // ========== END NEW CODE ==========

    // EXISTING CODE: Download and process video (fallback)
    const downloadResult = await downloadAndProcessVideo(videoUrl, userId);

    // ... rest of existing function remains unchanged
  } catch (error) {
    // ... existing error handling
  }
}
```

---

## Phase 3: Testing (45 minutes)

### Step 3.1: Create Test Script

**File**: `server/test-transcript-extraction.js` (new file)

```javascript
import { fetchYoutubeTranscript, processVideoUrl } from './services/videoProcessor.js';
import dotenv from 'dotenv';

dotenv.config();

// Test videos with known transcript availability
const testCases = [
  {
    name: 'TED Talk (definitely has transcript)',
    url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc',
    expectedResult: 'success',
  },
  {
    name: 'Music video (likely no transcript)',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    expectedResult: 'fallback',
  },
  {
    name: 'Cooking tutorial (likely has auto-generated)',
    url: 'YOUR_TEST_URL_HERE', // Replace with actual cooking video
    expectedResult: 'success',
  },
];

async function runTests() {
  console.log('🧪 Testing YouTube Transcript Extraction\\n');
  console.log('═'.repeat(60));

  for (const test of testCases) {
    console.log(`\\n📹 Test: ${test.name}`);
    console.log(`🔗 URL: ${test.url}`);
    console.log('─'.repeat(60));

    const result = await fetchYoutubeTranscript(test.url);

    if (result) {
      console.log(`✅ SUCCESS - Transcript extracted`);
      console.log(`   Length: ${result.text.length} characters`);
      console.log(`   Segments: ${result.segments.length}`);
      console.log(`   Preview: ${result.text.substring(0, 200)}...`);
    } else {
      console.log(`⚠️  FALLBACK NEEDED - No transcript available`);
    }

    console.log('─'.repeat(60));
  }

  console.log('\\n✅ Testing complete!\\n');
}

runTests().catch(console.error);
```

### Step 3.2: Run Tests
```bash
cd server
node test-transcript-extraction.js
```

### Step 3.3: Integration Test

Test the full flow with a real job submission:

```bash
# Start server
npm run dev

# In another terminal, submit test video
curl -X POST http://localhost:3000/api/video/submit-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
    "userId": "test-user-id"
  }'

# Check job status
curl http://localhost:3000/api/video/status/{jobId}
```

Expected outcome:
- Job completes in < 5 seconds (vs 2-5 minutes before)
- Status shows "Extracted transcript from YouTube"
- Guide is successfully created

---

## Phase 4: Optimization & Monitoring (1 hour)

### Step 4.1: Add Analytics

Track transcript vs. download usage in your logs or analytics:

```javascript
// In processVideoUrl(), after successful transcript extraction:
console.log('📊 ANALYTICS: Transcript extraction successful');
// TODO: Send to analytics service
// analytics.track('video_processed', { method: 'transcript', videoUrl, processingTime: '<1s' });

// After fallback to download:
console.log('📊 ANALYTICS: Fallback to video download');
// TODO: Send to analytics service
// analytics.track('video_processed', { method: 'download', videoUrl, processingTime: '2-5min' });
```

### Step 4.2: Add User Notification

Update job progress messages to inform users:

```javascript
// When transcript succeeds:
await updateJobProgress(jobId, 40, '✨ Found video captions - processing instantly!');

// When falling back:
await updateJobProgress(jobId, 10, 'Downloading video for analysis...');
```

### Step 4.3: Error Handling Improvements

Add specific error messages for common issues:

```javascript
async function fetchYoutubeTranscript(videoUrl) {
  try {
    // ... existing code ...
  } catch (error) {
    // Provide helpful error context
    if (error.message.includes('Transcript is disabled')) {
      console.log('💡 Creator has disabled transcripts for this video');
    } else if (error.message.includes('private')) {
      console.log('💡 Video is private or unavailable');
    } else if (error.message.includes('age')) {
      console.log('💡 Age-restricted video may require authentication');
    }
    return null;
  }
}
```

---

## Phase 5: Advanced Enhancements (Optional - Future)

### Enhancement 1: Language Detection
Add actual language detection for better Yoruba handling:

```bash
npm install franc-min
```

```javascript
import franc from 'franc-min';

async function fetchYoutubeTranscript(videoUrl) {
  // ... existing code ...

  const detectedLanguage = franc(fullText, { minLength: 50 });

  return {
    text: fullText,
    language: detectedLanguage === 'yor' ? 'yo' : 'en',
    segments: transcript,
    method: 'youtube_transcript',
  };
}
```

### Enhancement 2: Transcript Quality Scoring
Add intelligence to decide when to use transcript vs. fallback:

```javascript
function shouldUseTranscript(transcriptData) {
  const { text, segments } = transcriptData;

  // Quality checks
  const hasMinLength = text.length >= 300;
  const hasMultipleSegments = segments.length >= 10;
  const notJustMusic = !text.toLowerCase().includes('[music]');
  const hasActionWords = /\b(add|mix|cut|pour|heat|cook|make)\b/i.test(text);

  const qualityScore = [
    hasMinLength,
    hasMultipleSegments,
    notJustMusic,
    hasActionWords,
  ].filter(Boolean).length;

  // Need at least 3/4 checks to pass
  return qualityScore >= 3;
}

// Usage in processVideoUrl():
if (transcriptData && shouldUseTranscript(transcriptData)) {
  // Use transcript
} else {
  // Fallback to download
}
```

### Enhancement 3: Hybrid Approach
For critical videos, fetch transcript AND download for visual analysis:

```javascript
// Get transcript for text
const transcriptData = await fetchYoutubeTranscript(videoUrl);

// Also extract key frames for ingredients shown on screen
const frames = await extractKeyFrames(videoUrl, 3); // Just 3 frames

// Combine both for comprehensive guide
const guide = await extractGuideFromText(
  transcriptData.text,
  transcriptData.language,
  frames // Optional visual context
);
```

---

## Success Metrics

Track these metrics after implementation:

1. **Transcript Success Rate**: % of YouTube videos processed via transcript
   - Target: 60-70%

2. **Average Processing Time**:
   - Transcript method: < 2 seconds
   - Download method: 120-300 seconds

3. **Cost Reduction**:
   - Whisper API calls reduced by ~60-70%
   - Estimated savings: $0.024 per video × volume

4. **Guide Quality** (maintain existing quality):
   - User ratings should stay same or improve
   - No increase in "missing information" complaints

5. **Error Rate**:
   - Bot detection errors should drop to near-zero for YouTube
   - Overall success rate should increase

---

## Rollback Plan

If issues arise, rollback is simple:

1. Comment out transcript attempt in `processVideoUrl()`:
   ```javascript
   // if (isYouTube) {
   //   const transcriptData = await fetchYoutubeTranscript(videoUrl);
   //   ...
   // }
   ```

2. System reverts to existing download-only behavior

3. No database changes required - fully backward compatible

---

## Timeline Summary

- **Phase 1** (Setup): 10 minutes
- **Phase 2** (Implementation): 30 minutes
- **Phase 3** (Testing): 45 minutes
- **Phase 4** (Optimization): 1 hour
- **Total**: ~2.5 hours for full implementation

---

## Questions & Considerations

### Q: What about Yoruba videos?
**A**: Yoruba videos may have:
- Auto-generated English transcripts (less accurate)
- No transcripts at all (rare language)

**Solution**: If `detectedLanguage === 'yo'` and transcript quality is low, automatically fallback to Whisper for better Yoruba accuracy.

### Q: What about visual-only content?
**A**: Videos without narration (music-only, ASMR) will:
- Have no useful transcript
- Automatically fallback to download + frame analysis
- No change to user experience

### Q: Will this break TikTok/Instagram?
**A**: No. Transcript extraction only attempts for YouTube URLs:
```javascript
const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
if (isYouTube) {
  // Try transcript
}
// All other platforms go straight to download
```

### Q: What if YouTube changes their API?
**A**: The `@danielxceron/youtube-transcript` package:
- Uses YouTube's InnerTube API (internal but stable)
- Has fallback mechanisms
- Actively maintained (updated 5 months ago)
- If it breaks, system gracefully falls back to download

---

## Conclusion

This implementation is:
- ✅ **Low risk** - fully backward compatible
- ✅ **High impact** - solves bot detection for 60-70% of videos
- ✅ **Quick to implement** - ~2.5 hours
- ✅ **Cost-effective** - reduces API costs and server load
- ✅ **Better UX** - instant processing for most videos

**Recommendation**: Proceed with implementation in development environment, test thoroughly, then deploy to production.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-12
**Status**: Ready for Implementation
