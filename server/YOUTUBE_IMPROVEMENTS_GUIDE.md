# YouTube Download Improvements Guide

## Summary of Changes Needed

This guide outlines the changes needed to restore ytdl-core fallback for YouTube and improve bot detection bypass.

## Current Status

✅ **ytdl-core is imported** (line 2)
✅ **TikTok/Instagram use full retries** (NOT configured to fail fast)
❌ **YouTube fallback function** - NEEDS TO BE ADDED
❌ **YouTube rate limiting** - NEEDS TO BE ADDED
❌ **downloadVideo fallback logic** - NEEDS TO BE UPDATED

---

## Change 1: Add Rate Limiting to YouTube yt-dlp Options

**Location:** `services/videoProcessor.js` around line 325-333

**Find this block:**
```javascript
  if (isYouTube) {
    platformName = 'YouTube';
    // YouTube format: prefer mp4 video + m4a audio, fallback to best combined
    // This ensures we get a format FFmpeg can process
    // No rate limiting or quality restrictions - let it download at full speed
    formatString = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/bestvideo+bestaudio/best';
    timeout = 120000; // 2 minutes for YouTube (same as other platforms)

    console.log('Applying YouTube-specific options (2min timeout, no rate limit)');
```

**Replace with:**
```javascript
  if (isYouTube) {
    platformName = 'YouTube';
    // YouTube format: prefer mp4 video + m4a audio, up to 1080p to keep file size reasonable
    formatString = 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/bestvideo+bestaudio/best';
    timeout = 180000; // 3 minutes for YouTube (longer to allow for rate limiting)

    // IMPORTANT: Rate limit YouTube downloads to bypass bot detection
    // Limiting to 500K/s makes the download appear more human-like
    baseFlags.push('--limit-rate', '500K');

    // Add more human-like behavior flags for YouTube
    baseFlags.push('--sleep-interval', '1');  // Sleep 1 second between requests
    baseFlags.push('--max-sleep-interval', '3');  // Max 3 seconds sleep

    console.log('Applying YouTube-specific options (3min timeout, 500KB/s rate limit, human-like delays)');
```

**Why this helps:** Rate limiting makes downloads appear more human-like, bypassing YouTube's bot detection that looks for very fast, automated patterns.

---

## Change 2: Add YouTube Fallback Function

**Location:** `services/videoProcessor.js` BEFORE the `downloadVideo` function (around line 467)

**Add this complete function:**
```javascript
/**
 * Download YouTube video using ytdl-core (fallback method)
 * This is slower but can work when yt-dlp is blocked by YouTube's bot detection
 */
async function downloadYouTubeVideo(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log('Using ytdl-core fallback for YouTube:', url);

    try {
      // Use lowest quality to download faster and appear more human-like
      const stream = ytdl(url, {
        quality: 'lowest',
        filter: 'videoandaudio',
        // Additional options to bypass bot detection
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        }
      });

      const writer = fs.createWriteStream(outputPath);
      let downloadedBytes = 0;
      let lastLogTime = Date.now();

      stream.on('data', (chunk) => {
        downloadedBytes += chunk.length;

        // Log progress every 5 seconds
        const now = Date.now();
        if (now - lastLogTime > 5000) {
          console.log(`YouTube download progress: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
          lastLogTime = now;
        }
      });

      stream.on('info', (info) => {
        console.log('YouTube video info:', info.videoDetails.title);
        console.log('Duration:', info.videoDetails.lengthSeconds, 'seconds');
      });

      stream.pipe(writer);

      writer.on('finish', async () => {
        console.log(`✓ ytdl-core download complete: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);

        // Verify file
        try {
          const stats = await fsPromises.stat(outputPath);
          if (stats.size === 0) {
            reject(new Error('Downloaded YouTube file is empty'));
            return;
          }
          console.log('YouTube file verified:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
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

      // Set timeout (3 minutes for YouTube fallback)
      setTimeout(() => {
        stream.destroy();
        writer.destroy();
        reject(new Error('YouTube download timeout - video took too long to download'));
      }, 180000);

    } catch (error) {
      console.error('YouTube download error:', error);
      reject(error);
    }
  });
}
```

---

## Change 3: Update downloadVideo Function

**Location:** `services/videoProcessor.js` around line 473-507

**Find this block:**
```javascript
export async function downloadVideo(url, outputPath) {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  console.log('Attempting to download from:', url);
  console.log('Platform detected:', isYouTube ? 'YouTube' : 'Other');

  // Try yt-dlp (only method - no fallback for speed)
  try {
    return await downloadWithYtDlp(url, outputPath);
  } catch (ytDlpError) {
    console.log('yt-dlp failed:', ytDlpError.message);

    // For YouTube, provide clear upload guidance
    if (isYouTube) {
      // Check if error already contains upload guidance (from downloadWithYtDlp)
      if (ytDlpError.message.includes('Upload File') || ytDlpError.message.includes('upload')) {
        // Error already has upload guidance, re-throw as-is
        throw ytDlpError;
      }

      // Generic YouTube failure - prompt upload
      throw new Error(
        'Could not download this YouTube video. YouTube may be blocking automated downloads. ' +
        'Please download the video to your device first, then use the "Upload File" option to process it.'
      );
    }

    // For non-YouTube platforms, suggest upload
    const platform = url.includes('tiktok.com') ? 'TikTok' :
                     url.includes('instagram.com') ? 'Instagram' : 'this platform';
    throw new Error(
      `Could not download video from ${platform}. ` +
      `Please download the video to your device first, then use the "Upload File" option.`
    );
  }
}
```

**Replace with:**
```javascript
export async function downloadVideo(url, outputPath) {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  console.log('Attempting to download from:', url);
  console.log('Platform detected:', isYouTube ? 'YouTube' : 'Other');

  // Try yt-dlp first (works for all platforms)
  try {
    return await downloadWithYtDlp(url, outputPath);
  } catch (ytDlpError) {
    console.log('yt-dlp failed:', ytDlpError.message);

    // For YouTube ONLY, try ytdl-core fallback
    if (isYouTube) {
      console.log('Attempting YouTube fallback with ytdl-core...');
      try {
        return await downloadYouTubeVideo(url, outputPath);
      } catch (ytdlCoreError) {
        console.error('ytdl-core fallback also failed:', ytdlCoreError.message);

        // Both methods failed - provide helpful error
        if (ytdlCoreError.message.includes('bot') || ytdlCoreError.message.includes('Sign in')) {
          throw new Error(
            'YouTube has blocked automated downloads from this server (tried 2 methods). ' +
            'Please download the video to your device first, then use the "Upload File" option to process it.'
          );
        }

        // Generic YouTube error
        throw new Error(
          'Could not download this YouTube video after trying multiple methods. ' +
          'Please download the video to your device first, then use the "Upload File" option to process it.'
        );
      }
    }

    // For non-YouTube platforms, no fallback - suggest upload
    const platform = url.includes('tiktok.com') ? 'TikTok' :
                     url.includes('instagram.com') ? 'Instagram' : 'this platform';
    throw new Error(
      `Could not download video from ${platform}. ` +
      `Please download the video to your device first, then use the "Upload File" option.`
    );
  }
}
```

---

## Expected Behavior After Changes

### YouTube Downloads:
1. **First attempt:** yt-dlp with 500KB/s rate limiting + human-like delays
2. **If that fails:** ytdl-core fallback
3. **If both fail:** Clear error message suggesting manual upload

### TikTok/Instagram/Other Platforms:
- **Full speed** with 2-minute timeout
- **5 retries** on extraction, fragments, and general errors
- **NO fail-fast behavior** - they'll keep trying to succeed

---

## Why These Changes Help

1. **Rate Limiting (500KB/s):**
   - Makes downloads appear human-like instead of automated
   - YouTube's bot detection looks for very fast, scripted patterns
   - Slower is actually better for bypassing detection

2. **Sleep Intervals (1-3 seconds):**
   - Mimics human behavior between requests
   - Avoids rapid-fire requests that trigger bot detection

3. **ytdl-core Fallback:**
   - Different download method that may work when yt-dlp is blocked
   - Uses different API endpoints and request patterns
   - Provides a second chance before failing

4. **Longer Timeout (3 minutes for YouTube):**
   - Accommodates slower rate-limited downloads
   - Ensures larger videos have time to complete

---

## Testing

After making these changes, test with:

1. **Public YouTube video:**
   Should work with yt-dlp (rate-limited)

2. **Age-restricted/sign-in YouTube video:**
   May work with ytdl-core fallback, or fail with clear error

3. **TikTok video:**
   Should work fast with full retries (no change)

4. **Instagram video:**
   Should work fast with full retries (no change)

---

## Automated Patch

If you want to automate these changes, run:

```bash
cd C:/AKINWALE/Garde/server
node apply-manual-youtube-patch.js
```

(Note: This file isn't created yet - you'd need to create it based on this guide)
