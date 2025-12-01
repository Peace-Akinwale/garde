#!/bin/bash
# Render build script - Download static FFmpeg binary

echo "Downloading FFmpeg static binary..."
mkdir -p ffmpeg-bin
cd ffmpeg-bin
wget -q https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz --strip-components=1
chmod +x ffmpeg ffprobe
cd ..

echo "Installing Node.js dependencies..."
npm install

echo "Build complete!"
