# Quick Start Guide

Get Garde running in 15 minutes!

## Checklist

Before you start, get these ready:

- [ ] Node.js installed ([Download](https://nodejs.org/))
- [ ] Supabase account ([Sign up](https://supabase.com/))
- [ ] OpenAI API key ([Get here](https://platform.openai.com/api-keys))
- [ ] Anthropic API key ([Get here](https://console.anthropic.com/))
- [ ] FFmpeg installed ([Instructions below](#installing-ffmpeg))

## Step-by-Step Setup

### 1. Install FFmpeg (5 minutes)

**Windows:**
1. Download: https://www.gyan.dev/ffmpeg/builds/
2. Get "ffmpeg-release-essentials.zip"
3. Extract to `C:\ffmpeg`
4. Add to PATH:
   - Search Windows for "Environment Variables"
   - Edit "Path"
   - Add new: `C:\ffmpeg\bin`
   - Click OK, restart Command Prompt

Test: Open Command Prompt and run `ffmpeg -version`

### 2. Set Up Supabase Database (3 minutes)

1. Go to https://supabase.com/ → Create New Project
2. Wait for project to be ready
3. Go to **SQL Editor**
4. Open `C:\AKINWALE\Garde\server\database\schema.sql`
5. Copy all the SQL code
6. Paste into Supabase SQL Editor → Run
7. Go to **Settings → API**
8. Copy:
   - **URL** (Project URL)
   - **anon public** key

### 3. Get API Keys (3 minutes)

**OpenAI:**
1. https://platform.openai.com/api-keys
2. Create new key → Copy it
3. Add $5-10 credit to account

**Anthropic:**
1. https://console.anthropic.com/
2. Get API key → Copy it
3. Add $5-10 credit to account

### 4. Configure Backend (2 minutes)

Open Command Prompt:

```bash
cd C:\AKINWALE\Garde\server
copy .env.example .env
notepad .env
```

Fill in your keys in the `.env` file:
```
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
OPENAI_API_KEY=sk-your_key_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

Save and close. Then:
```bash
npm install
```

### 5. Configure Frontend (2 minutes)

Open NEW Command Prompt:

```bash
cd C:\AKINWALE\Garde\client
copy .env.local.example .env.local
notepad .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Save and close. Then:
```bash
npm install
```

### 6. Run the App!

**Terminal 1 (Backend):**
```bash
cd C:\AKINWALE\Garde\server
npm run dev
```

Wait for: `🚀 Garde server running on http://localhost:3001`

**Terminal 2 (Frontend):**
```bash
cd C:\AKINWALE\Garde\client
npm run dev
```

Wait for: `Ready on http://localhost:3000`

### 7. Open in Browser

Go to: **http://localhost:3000**

1. Sign up with your email
2. Click "Add Guide"
3. Try a short YouTube video first
4. Wait for AI to extract the guide
5. Done!

## Quick Test

Try this short cooking video to test:
```
https://www.youtube.com/watch?v=SHORT_VIDEO_ID
```

Or upload a short video file from your phone.

## Common Issues

**"FFmpeg not found"**
- Restart Command Prompt after installing FFmpeg
- Check PATH was added correctly

**"Failed to connect to database"**
- Check Supabase URL and key are correct
- Make sure you ran the SQL schema

**"Invalid API key"**
- Check OpenAI and Anthropic keys are correct
- Make sure you have credit on both accounts

**Video processing fails**
- Try a shorter video (under 1 minute)
- Check API keys have sufficient credits
- Some platforms block downloads - try uploading file instead

## Next Steps

- Read the full [README](../README.md) for more details
- Check [FAQ](./FAQ.md) for common questions
- Deploy to the internet: [Deployment Guide](./DEPLOYMENT.md)

## Daily Usage

Every time you want to use the app:

1. Open two Command Prompts
2. Run backend: `cd C:\AKINWALE\Garde\server && npm run dev`
3. Run frontend: `cd C:\AKINWALE\Garde\client && npm run dev`
4. Open http://localhost:3000

Or create a batch file to start both automatically!

---

Need help? Check the FAQ or main README!
