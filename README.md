# Garde

Your personal recipe and how-to guide keeper with AI-powered extraction from videos in any language, including Yoruba.

## Features

- 📹 **Extract recipes from videos** - Upload videos or paste links from TikTok, YouTube, Instagram
- 🌍 **Multilingual support** - Supports Yoruba and 98+ other languages
- 🤖 **AI-powered extraction** - Automatically extracts ingredients, steps, and instructions
- 📱 **Mobile-first design** - Works beautifully on phones and tablets
- 💾 **Offline capable** - Save to home screen, works like a native app
- 🔄 **Cross-device sync** - Access your guides from any device
- ✏️ **Editable guides** - Manually edit any extracted content
- 🔍 **Search & filter** - Easily find your saved guides
- 🎨 **Google Keep style** - Beautiful card-based interface

## What Can You Save?

- 🍳 **Cooking recipes** - Nigerian, international, any cuisine
- 🧼 **Craft tutorials** - Soap making, DIY projects
- 🪑 **Furniture guides** - Woodworking, assembly
- 👗 **Sewing patterns** - Clothing, alterations
- 📚 **Any how-to video** - If it has instructions, we can extract it!

## Installation Guide

### Prerequisites

Before you start, make sure you have:

1. **Node.js 18 or higher** - [Download here](https://nodejs.org/)
2. **Git** (optional but recommended) - [Download here](https://git-scm.com/)
3. **OpenAI API key** - [Get one here](https://platform.openai.com/api-keys)
4. **Anthropic API key** - [Get one here](https://console.anthropic.com/)
5. **Supabase account** - [Sign up here](https://supabase.com/)

### Step 1: Install Node.js

1. Download Node.js from https://nodejs.org/ (choose LTS version)
2. Run the installer
3. Open Command Prompt and verify:
   ```bash
   node --version
   ```
   Should show v18.0.0 or higher

### Step 2: Set Up Supabase (Database)

1. Go to https://supabase.com/ and sign up
2. Create a new project
3. Go to **SQL Editor** and run the SQL from `server/database/schema.sql`
4. Go to **Settings** → **API**
5. Copy your:
   - Project URL (looks like: `https://xxxxx.supabase.co`)
   - Anon/Public key (long string starting with `eyJ...`)

### Step 3: Get API Keys

#### OpenAI (for Whisper transcription)
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy and save it (starts with `sk-...`)
5. Add $5-10 credit to your account

#### Anthropic (for Claude extraction)
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to API Keys
4. Create a new key
5. Copy and save it (starts with `sk-ant-...`)
6. Add $5-10 credit to your account

### Step 4: Configure the Backend

1. Open Command Prompt
2. Navigate to the project:
   ```bash
   cd C:\AKINWALE\Garde\server
   ```

3. Create a `.env` file by copying the example:
   ```bash
   copy .env.example .env
   ```

4. Open `.env` in Notepad and fill in your keys:
   ```
   PORT=3001
   NODE_ENV=development

   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   OPENAI_API_KEY=sk-...your_key...
   ANTHROPIC_API_KEY=sk-ant-...your_key...

   MAX_FILE_SIZE=104857600
   TEMP_UPLOAD_DIR=./uploads
   ```

5. Install dependencies:
   ```bash
   npm install
   ```

### Step 5: Configure the Frontend

1. Open a new Command Prompt
2. Navigate to the client folder:
   ```bash
   cd C:\AKINWALE\Garde\client
   ```

3. Create a `.env.local` file:
   ```bash
   copy .env.local.example .env.local
   ```

4. Open `.env.local` in Notepad and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

5. Install dependencies:
   ```bash
   npm install
   ```

### Step 6: Install FFmpeg (Required for Video Processing)

FFmpeg is required to extract audio from videos.

#### Windows:
1. Download from: https://www.gyan.dev/ffmpeg/builds/
2. Download "ffmpeg-release-essentials.zip"
3. Extract to `C:\ffmpeg`
4. Add to PATH:
   - Search for "Environment Variables" in Windows
   - Edit "Path" under System Variables
   - Add `C:\ffmpeg\bin`
   - Click OK

5. Verify installation:
   ```bash
   ffmpeg -version
   ```

### Step 7: Run the Application

You need to run both the backend and frontend:

#### Terminal 1 - Backend:
```bash
cd C:\AKINWALE\Garde\server
npm run dev
```

You should see: `🚀 Garde server running on http://localhost:3001`

#### Terminal 2 - Frontend:
```bash
cd C:\AKINWALE\Garde\client
npm run dev
```

You should see: `Ready on http://localhost:3000`

### Step 8: Use the App!

1. Open your browser to **http://localhost:3000**
2. Sign up with your email
3. Click "Add Guide"
4. Paste a TikTok/YouTube/Instagram link or upload a video
5. Wait for the AI to extract the recipe/guide
6. Edit if needed and save!

## Using on Your Phone

1. While the app is running locally, find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. On your phone, open the browser to:
   ```
   http://YOUR_IP:3000
   ```

3. For best experience:
   - iOS: Tap Share → Add to Home Screen
   - Android: Tap Menu → Install App

## Deploying to the Internet (Free)

Once you're ready to use it from anywhere, follow the deployment guide in `docs/DEPLOYMENT.md`.

Quick overview:
- Frontend: Deploy to **Vercel** (free)
- Backend: Deploy to **Render** (free tier)
- Database: Already on **Supabase** (free tier)

## Cost Estimate

For personal use (50 videos/month):
- Supabase: **$0** (free tier)
- OpenAI Whisper: **~$3-5/month**
- Claude API: **~$1-2/month**

**Total: $4-7/month**

For heavy use (200 videos/month): **$12-18/month**

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### FFmpeg not found
Make sure FFmpeg is installed and added to PATH (see Step 6)

### "Failed to process video"
- Check your API keys are correct
- Make sure you have credit on OpenAI and Anthropic accounts
- Try a shorter video first (under 1 minute)

### Database errors
- Make sure you ran the SQL schema in Supabase
- Check your Supabase URL and keys are correct

### Video download fails
- Some platforms may block downloads
- Try uploading the video file directly instead

## Support

For issues or questions, check `docs/FAQ.md` or create an issue.

## License

MIT License - Free to use and modify!

---

Made with ❤️ for preserving recipes and how-to guides in all languages!
