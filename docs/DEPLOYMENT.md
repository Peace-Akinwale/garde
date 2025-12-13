# Deployment Guide

Deploy Garde to the internet so you can use it from anywhere!

## Overview

We'll deploy to three free services:
- **Vercel** - Frontend (Next.js app)
- **Render** - Backend (Express API)
- **Supabase** - Database (already set up)

Total cost: **$0** for hosting + pay-as-you-go for AI APIs

## Prerequisites

- GitHub account
- Vercel account (sign up with GitHub)
- Render account (sign up with GitHub)
- Your Supabase, OpenAI, and Anthropic keys

## Step 1: Push Code to GitHub

1. Create a new repository on GitHub
2. In Command Prompt:
   ```bash
   cd C:\AKINWALE\Garde
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/garde.git
   git push -u origin main
   ```

## Step 2: Deploy Backend to Render

1. Go to https://render.com/ and sign up with GitHub
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `garde-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   - Click **Environment** tab
   - Add all variables from your `.env` file:
     ```
     PORT=3001
     NODE_ENV=production
     SUPABASE_URL=your_url
     SUPABASE_ANON_KEY=your_key
     OPENAI_API_KEY=your_key
     ANTHROPIC_API_KEY=your_key
     SUPADATA_API_KEY=your_supadata_key
     MAX_FILE_SIZE=104857600
     TEMP_UPLOAD_DIR=./uploads
     ```

6. Click **Create Web Service**
7. Wait for deployment (5-10 minutes)
8. Copy your service URL (e.g., `https://garde-api.onrender.com`)

### Important: Install FFmpeg on Render

Add this to a new file `server/render-build.sh`:
```bash
#!/bin/bash
apt-get update
apt-get install -y ffmpeg
npm install
```

Then update `server/package.json`:
```json
{
  "scripts": {
    "build": "chmod +x render-build.sh && ./render-build.sh",
    "start": "node index.js"
  }
}
```

Redeploy the service.

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com/ and sign up with GitHub
2. Click **New Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variables:
   - Click **Environment Variables**
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
     NEXT_PUBLIC_API_URL=https://garde-api.onrender.com
     ```
   (Use your Render backend URL from Step 2)

6. Click **Deploy**
7. Wait for deployment (2-3 minutes)
8. Your app is live! (e.g., `https://garde.vercel.app`)

## Step 4: Update CORS Settings

Update `server/index.js` to allow your Vercel domain:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://garde.vercel.app', // Add your Vercel URL
    'https://your-custom-domain.com' // If you have a custom domain
  ]
}));
```

Commit and push to GitHub - Render will auto-deploy.

## Step 5: Test Your Deployed App

1. Visit your Vercel URL
2. Sign up/login
3. Add a guide from a video URL
4. Verify everything works!

## Using on Mobile

1. Open your Vercel URL on your phone
2. **iOS**: Tap Share → Add to Home Screen
3. **Android**: Tap Menu (⋮) → Install App

Now it works like a native app!

## Custom Domain (Optional)

### Vercel (Frontend)
1. Go to your project settings
2. Click **Domains**
3. Add your domain (e.g., `garde.com`)
4. Follow DNS instructions

### Render (Backend)
1. Go to your service settings
2. Click **Custom Domain**
3. Add subdomain (e.g., `api.garde.com`)
4. Update frontend `NEXT_PUBLIC_API_URL`

## Monitoring & Limits

### Render Free Tier
- Spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month free
- **Upgrade to paid ($7/month) for always-on**

### Vercel Free Tier
- Unlimited bandwidth
- 100 GB-hours compute
- More than enough for personal use

### Supabase Free Tier
- 500 MB database
- 50,000 monthly active users
- 1 GB file storage
- More than enough for personal use

## Costs After Free Tier

If you exceed free limits:

**Hosting:**
- Render (backend): $7/month for always-on
- Vercel (frontend): Free (or $20/month for team features)
- Supabase: Free (or $25/month for more storage)

**AI APIs (pay-as-you-go):**
- OpenAI Whisper: $0.006/minute
- Claude API: ~$0.002/request

**Total for personal use: $0-10/month**

## Troubleshooting

### Backend deployment fails
- Check all environment variables are set
- Make sure `render-build.sh` is executable
- Check logs in Render dashboard

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Make sure backend is deployed and running

### Videos not processing
- Render free tier spins down - first request is slow
- Check FFmpeg is installed (check build logs)
- Verify API keys have sufficient credits

### Database connection errors
- Check Supabase URL and keys
- Make sure you ran the SQL schema
- Check Supabase is not down (status.supabase.com)

## Updating Your App

When you make changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Both Vercel and Render will automatically deploy the updates!

## Backup Your Data

Regularly backup your Supabase database:
1. Go to Supabase dashboard
2. Click **Database** → **Backups**
3. Download backup

Store backups safely!

---

Congratulations! Your app is now live and accessible from anywhere! 🎉
