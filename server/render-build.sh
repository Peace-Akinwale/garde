#!/bin/bash
# Render build script - Install FFmpeg and yt-dlp

echo "Downloading FFmpeg static binary..."
mkdir -p ffmpeg-bin
cd ffmpeg-bin
wget -q https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz --strip-components=1
chmod +x ffmpeg ffprobe
cd ..

echo "Installing yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp || wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

echo "Verifying yt-dlp installation..."
yt-dlp --version

echo "Installing Node.js dependencies..."
npm install

echo "Build complete!"
