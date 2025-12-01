#!/bin/bash
# Render build script - Installs FFmpeg and dependencies

echo "Installing FFmpeg..."
apt-get update
apt-get install -y ffmpeg

echo "Installing Node.js dependencies..."
npm install

echo "Build complete!"
