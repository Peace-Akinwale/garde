# Garde - Project Summary

## What Was Built

A complete full-stack web application for extracting and managing recipes and how-to guides from videos with AI-powered multilingual support (including Yoruba).

## Project Structure

```
C:\AKINWALE\Garde\
├── server/                 # Backend API (Express.js)
│   ├── routes/            # API endpoints
│   │   ├── video.js       # Video processing endpoints
│   │   └── guides.js      # Guide management (CRUD)
│   ├── services/          # Business logic
│   │   └── videoProcessor.js  # Video download, transcription, extraction
│   ├── database/          # Database schema
│   │   └── schema.sql     # Supabase PostgreSQL schema
│   ├── index.js           # Main server file
│   ├── package.json       # Dependencies
│   └── .env.example       # Environment variables template
│
├── client/                # Frontend (Next.js 14)
│   ├── app/              # Next.js App Router
│   │   ├── page.js       # Main dashboard
│   │   ├── layout.js     # Root layout
│   │   └── globals.css   # Global styles
│   ├── components/        # React components
│   │   ├── AuthModal.js          # Login/signup
│   │   ├── GuideCard.js          # Recipe/guide cards (Google Keep style)
│   │   ├── GuideDetailModal.js   # Full guide view with editing
│   │   ├── AddGuideModal.js      # Video upload/URL processing
│   │   └── SearchBar.js          # Search and filters
│   ├── lib/              # Utilities
│   │   ├── supabase.js   # Supabase client
│   │   └── api.js        # API service layer
│   ├── public/           # Static files
│   │   └── manifest.json # PWA manifest
│   ├── package.json      # Dependencies
│   └── .env.local.example # Environment variables template
│
├── docs/                 # Documentation
│   ├── QUICK_START.md   # Quick setup guide
│   ├── DEPLOYMENT.md    # Deploy to internet
│   └── FAQ.md           # Common questions
│
├── README.md            # Main documentation
├── .gitignore          # Git ignore rules
└── start-app.bat       # Easy startup script (Windows)
```

## Tech Stack

### Backend
- **Node.js + Express.js** - REST API server
- **OpenAI Whisper API** - Audio transcription (99 languages including Yoruba)
- **Anthropic Claude API** - Recipe/guide extraction from text
- **yt-dlp** - Download videos from TikTok, YouTube, Instagram
- **FFmpeg** - Extract audio from video files
- **Supabase** - PostgreSQL database with authentication

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Beautiful icons
- **Progressive Web App (PWA)** - Installable on mobile devices

### Database Schema
- **profiles** - User accounts (extends Supabase auth)
- **guides** - Saved recipes and how-to guides with:
  - Basic info (title, type, category, language, summary)
  - Content (ingredients, steps, tips)
  - Metadata (duration, servings, difficulty)
  - Source tracking (URL, transcription)

## Features Implemented

✅ **User Authentication**
- Email/password signup and login
- Secure authentication via Supabase
- Profile management

✅ **Video Processing**
- Process videos from URLs (TikTok, YouTube, Instagram, etc.)
- Upload video files directly (max 100MB)
- Automatic audio extraction
- AI transcription with Whisper (multilingual)
- Smart guide extraction with Claude

✅ **Guide Management**
- Google Keep-style card interface
- Create, read, update, delete guides
- Search and filter by type
- Categorization (recipe, craft, howto, other)
- Language detection

✅ **Editing Capabilities**
- Edit titles, ingredients, steps
- Add/remove ingredients and steps
- Update metadata (duration, servings, difficulty)
- Add custom tips and notes

✅ **Mobile Experience**
- Responsive design (mobile-first)
- PWA installable to home screen
- Works offline for viewing saved guides
- Touch-optimized interface

✅ **Cross-Device Sync**
- Cloud-based database
- Login from any device
- Automatic synchronization

## What You Need to Do Next

### 1. Install Prerequisites (15 minutes)

**Required Software:**
- [ ] Node.js 18+ from https://nodejs.org/
- [ ] FFmpeg from https://www.gyan.dev/ffmpeg/builds/
  - Extract to `C:\ffmpeg`
  - Add `C:\ffmpeg\bin` to Windows PATH

**Required Accounts & API Keys:**
- [ ] Supabase account (https://supabase.com/)
  - Create project
  - Run SQL from `server/database/schema.sql`
  - Get URL and anon key
- [ ] OpenAI API key (https://platform.openai.com/api-keys)
  - Add $10 credit
- [ ] Anthropic API key (https://console.anthropic.com/)
  - Add $10 credit

### 2. Configure Environment Variables (5 minutes)

**Backend** (`server/.env`):
```bash
cd C:\AKINWALE\Garde\server
copy .env.example .env
notepad .env
```
Fill in all the keys.

**Frontend** (`client/.env.local`):
```bash
cd C:\AKINWALE\Garde\client
copy .env.local.example .env.local
notepad .env.local
```
Fill in Supabase URL and key.

### 3. Install Dependencies (5 minutes)

```bash
# Backend
cd C:\AKINWALE\Garde\server
npm install

# Frontend
cd C:\AKINWALE\Garde\client
npm install
```

### 4. Run the App (2 minutes)

**Option A: Use the batch file**
```bash
cd C:\AKINWALE\Garde
start-app.bat
```

**Option B: Manual start**

Terminal 1:
```bash
cd C:\AKINWALE\Garde\server
npm run dev
```

Terminal 2:
```bash
cd C:\AKINWALE\Garde\client
npm run dev
```

**Then open:** http://localhost:3000

### 5. Test It Out!

1. Sign up with your email
2. Click "Add Guide"
3. Paste a YouTube or TikTok URL (or upload a video)
4. Wait for AI to process (30-60 seconds)
5. View and edit your extracted guide!

## Detailed Documentation

- **Quick Setup**: Read `docs/QUICK_START.md`
- **Full Guide**: Read `README.md`
- **Deployment**: Read `docs/DEPLOYMENT.md`
- **Troubleshooting**: Read `docs/FAQ.md`

## Cost Breakdown

**One-Time:**
- $0 (everything is free to download/sign up)
- $10-20 API credits (lasts for months)

**Monthly (Pay-as-you-go):**
- Light use (10-20 videos): $2-4/month
- Moderate use (50-100 videos): $5-10/month
- Heavy use (200+ videos): $15-25/month

**Optional Always-On Hosting:**
- $0 with free tiers (Vercel + Render + Supabase)
- $7-10/month for always-on servers

## Current Limitations

- Videos must be under 100MB
- Some platforms (TikTok) may block downloads - use file upload instead
- Free hosting spins down after 15 mins (30s cold start)
- No built-in export feature yet
- No recipe sharing yet
- No manual recipe entry yet

## Future Enhancement Ideas

- Manual recipe entry form
- Recipe sharing with friends/family
- Collections and folders
- Shopping list generation
- Cooking timers
- Meal planning calendar
- Print-friendly formatting
- Recipe import from websites
- Bulk video processing
- Voice notes support
- Image recognition for ingredients

## Support & Customization

This is YOUR app now! Feel free to:
- Modify the code
- Add new features
- Change the styling
- Customize for your needs

All code is well-commented and organized for easy modification.

## What Makes This Special

1. **Yoruba Language Support** - One of very few apps with real Yoruba transcription
2. **Versatile Use Cases** - Not just recipes, but ANY how-to content (soap, furniture, crafts)
3. **AI-Powered** - Saves hours of manual typing
4. **Privacy-First** - Your recipes, your data, your control
5. **Cross-Platform** - Works on phone, tablet, computer
6. **Fully Customizable** - Open source, modify as you wish

## Getting Help

1. Check `docs/FAQ.md` for common questions
2. Review `README.md` for detailed instructions
3. Check `docs/QUICK_START.md` for setup help
4. Review code comments for technical details

---

## Ready to Start?

1. Read `docs/QUICK_START.md`
2. Set up your API keys
3. Run the setup commands
4. Start using it!

Estimated total setup time: **30 minutes**

Enjoy your personal recipe keeper! 🎉👨‍🍳
