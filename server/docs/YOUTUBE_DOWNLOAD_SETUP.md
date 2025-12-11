# YouTube Download Configuration

This document explains how Garde handles YouTube video downloads and how to configure it for optimal reliability.

## How It Works

Garde uses **yt-dlp** as the primary video downloader, with fallback to **ytdl-core** for YouTube specifically.

### Download Flow

```
User submits YouTube URL
        ↓
    yt-dlp (primary)
        ↓ success → process video
        ↓ fails
    ytdl-core (fallback)
        ↓ success → process video
        ↓ fails
    Error message → suggest "Upload File"
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `YTDLP_COOKIES_PATH` | Path to a Netscape-format cookies.txt file for YouTube authentication | (none) |
| `YTDLP_COOKIES_BASE64` | Base64-encoded cookies.txt content (for Render deployment) | (none) |
| `YTDLP_GEO_BYPASS` | Set to `true` to enable geo-bypass for region-restricted videos | `false` |

### Using Cookies for Authentication

YouTube heavily rate-limits and blocks automated downloads. Providing cookies from a logged-in browser session significantly improves success rates.

#### Step 1: Export Cookies

Use a browser extension to export YouTube cookies:
- **Chrome**: "Get cookies.txt LOCALLY" extension
- **Firefox**: "cookies.txt" extension

Export cookies for `youtube.com` only.

#### Step 2: Configure Garde

**Option A: Local Development**
```bash
export YTDLP_COOKIES_PATH="/path/to/cookies.txt"
```

**Option B: Render Deployment**

1. Base64-encode your cookies file:
   ```bash
   base64 -w 0 cookies.txt > cookies_base64.txt
   ```

2. Add to Render environment variables:
   - Key: `YTDLP_COOKIES_BASE64`
   - Value: (contents of cookies_base64.txt)

The build script will automatically decode this to `yt-dlp-bin/cookies.txt`.

### Geo-Bypass

Some videos are region-restricted. Enable geo-bypass to attempt to circumvent this:

```bash
export YTDLP_GEO_BYPASS=true
```

Note: This may not work for all region restrictions.

## Common YouTube Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Too many requests" / 429 | Rate limiting | Wait 10-15 min, or provide cookies |
| "Access forbidden" / 403 | Bot detection | Provide cookies, or user uploads file |
| "Private video" | Video is private | User must make video public or upload file |
| "Sign in required" | Login wall | Provide cookies, or user uploads file |
| "Age-restricted" | Age verification required | Provide cookies (logged-in account), or user uploads file |
| "Video unavailable" | Deleted or region-blocked | Try geo-bypass, or video is gone |
| "Members-only" | Channel membership required | User must be member, or uploads file |

## Testing Downloads

### Local Testing

```bash
cd server

# Test with default URL
node test-youtube-download.js

# Test with specific URL
node test-youtube-download.js "https://www.youtube.com/watch?v=VIDEO_ID"

# Test with cookies
YTDLP_COOKIES_PATH="./cookies.txt" node test-youtube-download.js

# Test with geo-bypass
YTDLP_GEO_BYPASS=true node test-youtube-download.js
```

### Render Shell Testing

```bash
cd /opt/render/project/src/server
./yt-dlp-bin/yt-dlp --version
node test-youtube-download.js
```

## Recommended User Flow

Since YouTube actively blocks server-side downloads, the recommended approach for users is:

1. **Try URL first** - Works for many videos, especially shorter/newer ones
2. **Fall back to Upload** - If URL fails, prompt user to:
   - Download video to their device (using browser or YouTube app)
   - Use the "Upload File" option in Garde

This fallback is built into the error messages returned by the API.

## Updating yt-dlp

YouTube frequently changes their systems. Keep yt-dlp updated:

**Local:**
```bash
pip install -U yt-dlp
# or
yt-dlp -U
```

**Render:**
The build script (`render-build.sh`) always downloads the latest yt-dlp on each deploy. To force an update, trigger a new deploy.

## Troubleshooting

### yt-dlp Not Found

```bash
# Check if installed
which yt-dlp
yt-dlp --version

# Install
pip install yt-dlp
# or (on macOS)
brew install yt-dlp
```

### Downloads Always Fail

1. Check yt-dlp version (should be recent)
2. Try the URL in browser - is video accessible?
3. Check server logs for specific error messages
4. Try with cookies enabled
5. Check if video is region-restricted (try geo-bypass)

### Videos Process But Have No Audio

This usually means the format selection got video-only. Check:
1. FFmpeg is installed and working
2. The format string includes audio (current config handles this)

## Architecture Notes

### Format Selection

The hardened format string prioritizes:
1. MP4 video (1080p max) + M4A audio (best combined format)
2. Best MP4 up to 1080p
3. Best video + best audio (any format, FFmpeg merges)
4. Absolute best available

This ensures compatibility with FFmpeg for audio extraction.

### Download Speed

YouTube downloads run at full speed (no rate limiting). If YouTube blocks the download, users will be prompted to upload the video file instead.

### Timeouts

- YouTube: 3 minutes (long videos can take time)
- TikTok: 2 minutes
- Instagram: 2 minutes
- Other: 90 seconds

