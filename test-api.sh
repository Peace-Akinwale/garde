#!/bin/bash
# Test the YouTube Transcript API

echo "==================================="
echo "TESTING YOUTUBE TRANSCRIPT FEATURE"
echo "==================================="
echo ""
echo "Submitting YouTube video with captions..."
echo "Video: TED Talk (has English captions)"
echo ""

# Submit a YouTube video
curl -X POST http://localhost:3001/api/video/process-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
    "userId": "test-user-transcript"
  }' | jq .

echo ""
echo "==================================="
echo "Job submitted! Copy the jobId above to check status."
echo "==================================="
