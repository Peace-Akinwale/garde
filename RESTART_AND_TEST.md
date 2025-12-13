# Restart Server and Test Changes

## Changes Made Today:

### 1. Vision API Error Handling with Retry Logic
- Detects poor Vision API responses (error phrases)
- Automatically retries failed frames (up to 2 attempts)
- Rejects videos if >70% of frames fail
- Shows helpful error messages

### 2. Video Preview UI Restored
- YouTube videos show embedded player
- TikTok/Instagram/Facebook show styled clickable buttons
- All platforms have proper hover effects and branding

## How to Test:

### Step 1: Restart the Server

The server needs to be restarted to load the new Vision API error handling code.

**Option A: Find and kill the server process (PID 7348 or similar)**
```bash
tasklist | findstr "node"
# Find the one using ~400MB memory (that's likely the server)
# Then kill it
taskkill /PID <pid> /F
```

**Option B: Close the terminal running the server**
Just close the terminal window where you started `npm start` or `node index.js`

**Then restart:**
```bash
cd C:\AKINWALE\Garde\server
npm start
```

### Step 2: Test the Silent Video Again

**Via Browser UI (Recommended):**
1. Open Garde app in browser
2. Add new guide with URL: `https://youtu.be/YKBaKwVR6W8`
3. Watch the terminal logs - you should see:
   - "Analyzing X frames with Vision API..."
   - If a frame fails: "⚠️ Frame X attempt 1: Poor Vision API response detected"
   - If retry succeeds: "✅ Frame X: Success on attempt 2"
   - At the end: Either successful guide OR helpful error if too many frames failed

**Via API (Alternative):**
```bash
curl -X POST http://localhost:3001/api/video/process-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://youtu.be/YKBaKwVR6W8",
    "userId": "your-actual-user-id-from-database"
  }'
```

### Step 3: Test Video Preview UI

1. Open any processed guide that has a video source
2. Click to open fullscreen view
3. Scroll to bottom - you should see:
   - **YouTube videos**: Embedded player you can watch directly
   - **TikTok videos**: Black button saying "View on TikTok"
   - **Instagram videos**: Gradient purple/pink button
   - **Facebook videos**: Blue button
   - **File uploads**: Simple source text link

## Expected Results:

### For Silent Video Test:
- **Best case**: Vision API works better now, creates a good guide
- **Good case**: Still fails, but with clear helpful error message instead of creating bad guide
- **Either way**: You'll see retry attempts in logs, proving error handling works

### For Video Preview:
- You should see beautiful video previews instead of plain text links
- YouTube embeds should be playable directly in the app

## Troubleshooting:

If server won't restart:
```bash
# Force kill all node processes (be careful, this kills ALL node processes)
taskkill /F /IM node.exe

# Then start fresh
cd C:\AKINWALE\Garde\server
npm start
```

If you want to see detailed logs:
```bash
# The server logs will show all Vision API calls and retries in real-time
# Watch for these messages:
# - "⚠️ Frame X attempt Y: Poor Vision API response detected"
# - "✅ Frame X: Success on attempt 2"
# - "❌ Frame X: All retry attempts failed"
```
