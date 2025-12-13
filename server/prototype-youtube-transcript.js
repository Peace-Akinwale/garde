/**
 * PROTOTYPE: YouTube Transcript-Based Guide Extraction
 *
 * This is a proof-of-concept demonstrating how to extract guides
 * from YouTube videos using native transcripts instead of downloading.
 *
 * To test this prototype:
 * 1. npm install @danielxceron/youtube-transcript
 * 2. node server/prototype-youtube-transcript.js
 */

import { YoutubeTranscript } from '@danielxceron/youtube-transcript';

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // If it's already just the ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  throw new Error('Invalid YouTube URL or video ID');
}

/**
 * Fetch YouTube transcript for a video
 *
 * @param {string} videoUrl - YouTube URL or video ID
 * @returns {Object|null} - { text: string, language: string, timestamps: array } or null if unavailable
 */
async function fetchYoutubeTranscript(videoUrl) {
  try {
    console.log('🔍 Attempting to fetch YouTube transcript...');

    // The package accepts both URLs and video IDs
    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);

    if (!transcript || transcript.length === 0) {
      console.log('⚠️  Transcript is empty');
      return null;
    }

    // Combine all text segments
    const fullText = transcript.map(segment => segment.text).join(' ');

    // YouTube API doesn't return language, but we can detect from content
    // For now, default to 'en' - can enhance with language detection library
    const language = 'en';

    console.log(`✅ Transcript fetched successfully (${transcript.length} segments, ${fullText.length} characters)`);

    return {
      text: fullText,
      language: language,
      segments: transcript, // Keep original with timestamps for future use
      segmentCount: transcript.length,
      characterCount: fullText.length,
    };
  } catch (error) {
    console.error('❌ Failed to fetch transcript:', error.message);

    // Common error cases
    if (error.message.includes('Transcript is disabled')) {
      console.log('💡 This video has disabled transcripts');
    } else if (error.message.includes('No transcript found')) {
      console.log('💡 This video has no available transcripts');
    } else {
      console.log('💡 Unknown error - video may be private, deleted, or have other restrictions');
    }

    return null;
  }
}

/**
 * HYBRID APPROACH: Try transcript first, fallback to download
 *
 * This is the recommended implementation strategy
 */
async function processYoutubeVideo(videoUrl) {
  console.log('\\n🎬 Processing YouTube video:', videoUrl);
  console.log('═'.repeat(60));

  // STEP 1: Try to fetch transcript (instant, free)
  console.log('\\n📝 STEP 1: Attempting transcript extraction...');
  const transcriptData = await fetchYoutubeTranscript(videoUrl);

  if (transcriptData) {
    console.log('\\n🎉 SUCCESS: Using YouTube transcript!');
    console.log('═'.repeat(60));
    console.log('Advantages:');
    console.log('  ✅ Instant (< 1 second)');
    console.log('  ✅ Free ($0 cost)');
    console.log('  ✅ No download required');
    console.log('  ✅ Bypasses bot detection');
    console.log('\\nTranscript Preview:');
    console.log('─'.repeat(60));
    console.log(transcriptData.text.substring(0, 500) + '...');
    console.log('─'.repeat(60));
    console.log(`\\nStats: ${transcriptData.segmentCount} segments, ${transcriptData.characterCount} characters`);

    // TODO: Pass to extractGuideFromText() (same function as before!)
    console.log('\\n💡 Next Step: Pass to extractGuideFromText() for guide extraction');
    console.log('   (Uses existing Claude API logic - no changes needed!)');

    return {
      success: true,
      method: 'transcript',
      data: transcriptData,
      processingTime: '< 1 second',
      cost: '$0.00',
    };
  }

  // STEP 2: Fallback to video download (existing approach)
  console.log('\\n⚠️  Transcript unavailable - falling back to video download...');
  console.log('═'.repeat(60));
  console.log('Fallback Process:');
  console.log('  1. Download video with yt-dlp');
  console.log('  2. Extract audio with FFmpeg');
  console.log('  3. Transcribe with Whisper API');
  console.log('  4. Extract frames for visual analysis');
  console.log('  5. Combine audio + visual for guide extraction');
  console.log('\\n💰 Cost: ~$0.048 for 8-minute video');
  console.log('⏱️  Time: ~2-5 minutes');

  // TODO: Call existing downloadAndProcessVideo() function
  console.log('\\n💡 Implementation: Call existing videoProcessor.downloadAndProcessVideo()');

  return {
    success: false,
    method: 'fallback_required',
    reason: 'No transcript available',
    fallbackAction: 'Download video and use Whisper',
  };
}

/**
 * Analyze transcript quality to decide if we should use it
 *
 * Some transcripts are too short, garbled, or low-quality to be useful
 */
function analyzeTranscriptQuality(transcriptData) {
  if (!transcriptData) return { quality: 'none', useTranscript: false };

  const { text, segmentCount, characterCount } = transcriptData;

  // Quality checks
  const checks = {
    hasMinimumLength: characterCount >= 200, // At least 200 characters
    hasMultipleSegments: segmentCount >= 5, // At least 5 segments
    notJustMusic: !text.toLowerCase().includes('[music]') || characterCount > 500,
    hasActionWords: /\b(add|mix|cut|pour|heat|cook|make|create|build)\b/i.test(text),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const qualityScore = passedChecks / totalChecks;

  let quality, useTranscript;

  if (qualityScore >= 0.75) {
    quality = 'excellent';
    useTranscript = true;
  } else if (qualityScore >= 0.5) {
    quality = 'good';
    useTranscript = true;
  } else if (qualityScore >= 0.25) {
    quality = 'fair';
    useTranscript = false; // Fallback to download for better quality
  } else {
    quality = 'poor';
    useTranscript = false;
  }

  return {
    quality,
    useTranscript,
    qualityScore,
    checks,
    recommendation: useTranscript
      ? 'Use transcript for instant processing'
      : 'Download video for better accuracy',
  };
}

/**
 * DEMO: Test with real YouTube videos
 */
async function runDemo() {
  console.log('\\n🚀 YOUTUBE TRANSCRIPT EXTRACTION - PROOF OF CONCEPT');
  console.log('═'.repeat(60));

  // Test videos (replace with real video IDs)
  const testVideos = [
    {
      name: 'How-to Tutorial (likely has good transcript)',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with real URL
    },
    // Add more test cases as needed
  ];

  console.log('\\n⚠️  NOTE: Replace test video URLs with real cooking/how-to videos');
  console.log('\\nTo run this demo:');
  console.log('  1. Install package: npm install @danielxceron/youtube-transcript');
  console.log('  2. Update testVideos array with real YouTube URLs');
  console.log('  3. Run: node server/prototype-youtube-transcript.js');
  console.log('\\n' + '═'.repeat(60));

  // Uncomment to test with real videos
  /*
  for (const video of testVideos) {
    console.log('\\n\\n📹 Testing:', video.name);
    const result = await processYoutubeVideo(video.url);

    if (result.success && result.data) {
      const qualityAnalysis = analyzeTranscriptQuality(result.data);
      console.log('\\n📊 Quality Analysis:', qualityAnalysis);
    }

    console.log('\\n' + '─'.repeat(60));
  }
  */
}

// Export functions for use in main application
export {
  fetchYoutubeTranscript,
  processYoutubeVideo,
  analyzeTranscriptQuality,
  extractVideoId,
};

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}
