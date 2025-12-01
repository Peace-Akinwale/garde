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
mkdir -p yt-dlp-bin
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp-bin/yt-dlp || wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O yt-dlp-bin/yt-dlp
chmod a+rx yt-dlp-bin/yt-dlp

echo "Verifying yt-dlp installation..."
./yt-dlp-bin/yt-dlp --version

echo "Installing Node.js dependencies..."
npm install

echo "Build complete!"
