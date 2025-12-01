# Frequently Asked Questions (FAQ)

## General Questions

### What is Garde?
Garde is a web app that helps you save recipes and how-to guides from videos. It uses AI to automatically extract ingredients, steps, and instructions from videos in any language - including Yoruba!

### Do I need coding experience?
No! Just follow the setup guide. You'll need to run a few commands, but everything is explained step-by-step.

### Is it really free?
The app itself is free. You only pay for:
- AI usage (OpenAI Whisper + Claude API) - around $5-10/month for moderate use
- Optional: Hosting ($0 with free tiers, or $7-10/month for always-on)

### What languages does it support?
99 languages including:
- Yoruba (yo)
- English (en)
- French (fr)
- Spanish (es)
- Arabic (ar)
- And 94 more!

## Setup & Installation

### I don't have Node.js. Where do I get it?
Download from https://nodejs.org/ - choose the LTS version. It's free and safe.

### What is Supabase?
Supabase is a free database service. Think of it like Google Drive for your app's data. Your recipes are stored there so you can access them from any device.

### Do I really need both OpenAI AND Anthropic?
Yes, because:
- **OpenAI Whisper** converts video speech to text (supports Yoruba)
- **Claude (Anthropic)** extracts the recipe/guide from that text

There's no single service that does both well with Yoruba support.

### Can I use ChatGPT instead of Claude?
Yes! You can modify the code to use GPT-4 instead of Claude. They cost about the same. Claude is slightly better at structured extraction.

### How much storage do I need?
Very little! Videos are processed and deleted immediately. Only text is saved (a few KB per guide). 500MB database (Supabase free tier) can store thousands of guides.

## Usage Questions

### What video platforms are supported?
- YouTube
- TikTok
- Instagram
- Facebook
- Any direct video link
- Or upload files directly

### What video formats can I upload?
MP4, MOV, AVI, MKV, and most common formats. Max 100MB per video.

### How long does processing take?
- Short video (1-2 min): 30-60 seconds
- Medium video (5-10 min): 2-3 minutes
- Long video (30+ min): 5-10 minutes

### Can I edit the extracted recipes?
Yes! Click on any guide card to open it, then click "Edit". You can modify:
- Title
- Ingredients
- Steps
- Tips
- Duration, servings, difficulty

### What if the AI gets something wrong?
Just click Edit and fix it manually. The AI is very good but not perfect. It's designed to be a starting point that you can refine.

### Can I add recipes manually without a video?
Currently no, but you can:
1. Create a short voice recording explaining the recipe
2. Upload that as a video
3. The AI will extract it
4. Or modify the code to add manual entry (feature request!)

## Technical Questions

### Can I use this offline?
Partially. Once you install it to your home screen:
- You can VIEW saved guides offline
- You CANNOT process new videos offline (requires internet for AI)

### Why do I need to run two terminals?
One runs the backend (processes videos), one runs the frontend (what you see). They work together. Once deployed, you won't need to do this.

### Can multiple people use this?
Yes! Each person creates their own account. Recipes are private to each account.

### How secure is it?
- Passwords are hashed (not stored as plain text)
- Communication is encrypted (HTTPS when deployed)
- Your recipes are private (Row Level Security in database)
- API keys are never exposed to users

### Can I use this on my iPad?
Yes! It works on any device with a web browser. Install it to your home screen for the best experience.

## Cost & Billing

### How much does it actually cost?
**Setup (one-time):**
- $0 for everything
- $10-20 credit for API services (lasts months)

**Monthly (pay-as-you-go):**
- 10 videos/month: ~$1-2
- 50 videos/month: ~$5-7
- 200 videos/month: ~$15-20

### What if I run out of API credits?
Processing will stop until you add more credit. Your saved guides remain accessible. Just add $10 credit when needed.

### Can I set a spending limit?
Yes! In both OpenAI and Anthropic dashboards, you can set monthly spending limits to prevent surprises.

### Is there a cheaper option?
You could:
- Use Google's free speech-to-text (but limited Yoruba support)
- Use GPT-3.5 instead of Claude (slightly lower quality)
- Process videos less frequently

But honestly, $5-10/month for the best experience is very reasonable!

## Troubleshooting

### "Port 3000 is already in use"
Another app is using that port. Either:
- Close other dev servers
- Change port in `package.json`: `"dev": "next dev -p 3005"`

### Video download fails for TikTok
TikTok frequently changes their download protection. Try:
- Uploading the video file instead
- Using a different TikTok video
- Using a TikTok download site first, then upload the file

### Processing very slow (5+ minutes)
- Video might be very long - try shorter clips
- Free tier servers spin down - first request is slow
- Check your internet speed
- Try uploading instead of URL

### "Failed to transcribe audio"
- Check OpenAI API key is valid
- Check you have credit on OpenAI account
- Video might have no clear audio
- Try a video with clearer speech

### Database errors after deployment
- Make sure you ran the SQL schema
- Check Supabase keys are correct in environment variables
- Wait a few minutes - Supabase might still be initializing

### App works locally but not when deployed
- Check all environment variables are set in deployment
- Verify API URLs are correct (no localhost in production)
- Check browser console for errors
- Look at server logs in Render/Vercel

## Feature Requests

### Can you add [feature]?
This is an open-source project! You can:
- Modify the code yourself
- Submit a feature request
- Hire a developer to add it

### Planned features?
Potential future additions:
- Manual recipe entry
- Recipe sharing
- Recipe collections/folders
- Cooking timers
- Shopping list generation
- Meal planning
- Print formatting

### Can I contribute?
Yes! This is your project. Feel free to modify, improve, and customize it for your needs.

## Mobile App Questions

### Is there a real mobile app?
No, but the web app works like a native app when you "Add to Home Screen". It:
- Has an app icon
- Opens in fullscreen
- Works offline (for viewing)
- Receives updates automatically

### Will you publish to App Store/Play Store?
Not currently planned. The PWA (Progressive Web App) approach:
- No app store approval needed
- No app store fees
- Updates instantly
- Works on all platforms

But you could package it as a native app using tools like Capacitor or React Native if you want!

### Does it use my phone's camera?
When you click "Upload File", you can:
- Choose existing videos
- Record new video (if browser supports it)
- Take photos (not useful for this app though)

## Privacy & Data

### Where is my data stored?
- Database: Supabase (encrypted, backed up)
- Videos: Temporarily during processing, then deleted
- No data is sold or shared

### Can anyone see my recipes?
No. Each user only sees their own guides. The database has Row Level Security to enforce this.

### Can I export my data?
Currently no built-in export, but you can:
- Copy/paste from the app
- Access Supabase directly and export as JSON
- Add an export feature to the code

### Can I delete my account?
Currently no built-in deletion, but you can:
- Stop using the app (no ongoing costs)
- Delete your guides manually
- Delete your data from Supabase dashboard

## Deployment Questions

### Do I have to deploy it?
No! You can use it locally forever. Deploy only if you want:
- Access from anywhere
- Use on multiple devices easily
- Share with family

### Which is better: Render or Railway?
Both are good. Render has a more generous free tier. Railway gives $5/month credit.

### Can I use my own server?
Yes! If you have a VPS or home server, you can host there instead. You'll need:
- Node.js
- FFmpeg
- Domain name (optional)
- SSL certificate (Let's Encrypt is free)

### How do I add a custom domain?
See the [Deployment Guide](./DEPLOYMENT.md) for detailed instructions.

---

## Still Have Questions?

- Check the main [README](../README.md)
- Review the [Quick Start Guide](./QUICK_START.md)
- Check [Deployment Guide](./DEPLOYMENT.md)
- Open an issue on GitHub

We're here to help! 🙂
