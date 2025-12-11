#!/bin/bash
# Render build script - Install FFmpeg and yt-dlp
# Updated for reliable YouTube downloads

set -e  # Exit on error

echo "=== Garde Build Script ==="
echo ""

# --- FFmpeg ---
echo "[1/3] Downloading FFmpeg static binary..."
mkdir -p ffmpeg-bin
cd ffmpeg-bin

if [ ! -f "ffmpeg" ] || [ ! -f "ffprobe" ]; then
  wget -q https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
  tar -xf ffmpeg-release-amd64-static.tar.xz --strip-components=1
  rm -f ffmpeg-release-amd64-static.tar.xz
  chmod +x ffmpeg ffprobe
  echo "✓ FFmpeg downloaded and extracted"
else
  echo "✓ FFmpeg already present, skipping download"
fi
cd ..

# --- yt-dlp ---
echo "[2/3] Installing yt-dlp..."
mkdir -p yt-dlp-bin

# Always download latest yt-dlp (YouTube changes frequently, so latest is important)
echo "Downloading latest yt-dlp from GitHub..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp-bin/yt-dlp || \
  wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O yt-dlp-bin/yt-dlp

# Make executable
chmod a+rx yt-dlp-bin/yt-dlp

# Verify installation and show version
echo "Verifying yt-dlp installation..."
YT_DLP_VERSION=$(./yt-dlp-bin/yt-dlp --version 2>/dev/null || echo "unknown")
echo "✓ yt-dlp installed: v${YT_DLP_VERSION}"

# --- Optional: Copy cookies file if present in environment ---
if [ -n "$YTDLP_COOKIES_BASE64" ]; then
  echo "Detected YTDLP_COOKIES_BASE64 env var, decoding cookies file..."
  echo "$YTDLP_COOKIES_BASE64" | base64 -d > yt-dlp-bin/cookies.txt
  chmod 600 yt-dlp-bin/cookies.txt
  echo "✓ Cookies file created at yt-dlp-bin/cookies.txt"
fi

# --- Node.js dependencies ---
echo "[3/3] Installing Node.js dependencies..."
npm install

echo ""
echo "=== Build complete! ==="
echo "FFmpeg: $(./ffmpeg-bin/ffmpeg -version 2>/dev/null | head -1 || echo 'not found')"
echo "yt-dlp: v${YT_DLP_VERSION}"
