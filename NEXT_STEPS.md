# Next Steps - Start Here! 🚀

Your Garde app is built! Here's exactly what to do next.

## Step 1: Install Node.js (5 minutes)

1. Go to https://nodejs.org/
2. Download the **LTS version** (recommended)
3. Run the installer (accept all defaults)
4. Restart your computer (important!)
5. Verify installation:
   - Open Command Prompt
   - Type: `node --version`
   - Should show: v18.x.x or higher

## Step 2: Install FFmpeg (5 minutes)

FFmpeg is required to extract audio from videos.

1. Go to https://www.gyan.dev/ffmpeg/builds/
2. Download **ffmpeg-release-essentials.zip**
3. Extract the ZIP file
4. Move the extracted folder to `C:\ffmpeg`
5. Add to Windows PATH:
   - Press Windows key
   - Type "Environment Variables"
   - Click "Edit the system environment variables"
   - Click "Environment Variables" button
   - Under "System variables", find and select "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\ffmpeg\bin`
   - Click OK on all windows
6. **Restart Command Prompt**
7. Verify: Type `ffmpeg -version`

## Step 3: Create Supabase Account & Database (10 minutes)

1. Go to https://supabase.com/
2. Click "Start your project"
3. Sign up with GitHub or email
4. Click "New Project"
5. Fill in:
   - Name: "garde"
   - Password: (create a strong password - save it!)
   - Region: Choose closest to you
6. Wait 2-3 minutes for project to initialize
7. When ready, go to **SQL Editor** (left sidebar)
8. Click "New query"
9. Open file: `C:\AKINWALE\Garde\server\database\schema.sql`
10. Copy ALL the SQL code
11. Paste into Supabase SQL Editor
12. Click "Run" or press Ctrl+Enter
13. You should see "Success. No rows returned"
14. Go to **Settings → API** (left sidebar)
15. Copy and save:
    - **Project URL** (under "Project URL")
    - **anon public** key (under "Project API keys")

## Step 4: Get OpenAI API Key (5 minutes)

1. Go to https://platform.openai.com/signup
2. Sign up with email
3. Verify your email
4. Go to https://platform.openai.com/api-keys
5. Click "Create new secret key"
6. Give it a name: "Garde"
7. Copy the key (starts with `sk-...`) - **save it immediately!**
8. Go to "Billing" → "Add payment method"
9. Add a credit card
10. Add $10 credit (should last months)

## Step 5: Get Anthropic (Claude) API Key (5 minutes)

1. Go to https://console.anthropic.com/
2. Sign up with email
3. Verify your email
4. Go to "API Keys" section
5. Click "Create Key"
6. Name it: "Garde"
7. Copy the key (starts with `sk-ant-...`) - **save it!**
8. Go to "Billing" or "Settings"
9. Add payment method
10. Add $10 credit

## Step 6: Configure the App (5 minutes)

### Backend Configuration:

1. Open Command Prompt
2. Navigate to server:
   ```
   cd C:\AKINWALE\Garde\server
   ```
3. Create .env file:
   ```
   copy .env.example .env
   ```
4. Open the .env file:
   ```
   notepad .env
   ```
5. Fill in ALL the values:
   ```
   PORT=3001
   NODE_ENV=development

   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...your_key...

   OPENAI_API_KEY=sk-...your_key...
   ANTHROPIC_API_KEY=sk-ant-...your_key...

   MAX_FILE_SIZE=104857600
   TEMP_UPLOAD_DIR=./uploads
   ```
6. Save and close (Ctrl+S, then close Notepad)

### Frontend Configuration:

1. Open NEW Command Prompt
2. Navigate to client:
   ```
   cd C:\AKINWALE\Garde\client
   ```
3. Create .env.local file:
   ```
   copy .env.local.example .env.local
   ```
4. Open the file:
   ```
   notepad .env.local
   ```
5. Fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_key...
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
6. Save and close

## Step 7: Install Dependencies (5 minutes)

### Backend:
```bash
cd C:\AKINWALE\Garde\server
npm install
```
Wait for installation to complete (2-3 minutes).

### Frontend:
```bash
cd C:\AKINWALE\Garde\client
npm install
```
Wait for installation to complete (2-3 minutes).

## Step 8: Run the App! (2 minutes)

### Option A: Easy Way (Recommended)

1. Double-click: `C:\AKINWALE\Garde\start-app.bat`
2. Wait 15-20 seconds
3. Press any key when prompted
4. Browser will open automatically
5. You're ready!

### Option B: Manual Way

**Terminal 1 - Backend:**
```bash
cd C:\AKINWALE\Garde\server
npm run dev
```
Wait for: "🚀 Garde server running on http://localhost:3001"

**Terminal 2 - Frontend:**
```bash
cd C:\AKINWALE\Garde\client
npm run dev
```
Wait for: "Ready on http://localhost:3000"

**Open browser to:** http://localhost:3000

## Step 9: Test It Out!

1. On the signup page, create an account:
   - Email: your email
   - Password: create a password
   - Click "Sign Up"

2. Click "+ Add Guide"

3. Try with a YouTube URL:
   - Paste any cooking or how-to video URL
   - Click "Process Video"
   - Wait 30-60 seconds
   - Magic! ✨

4. View your extracted guide:
   - Click on the card to view details
   - Click "Edit" to make changes
   - Save when done

## Troubleshooting

**"Node is not recognized"**
- Node.js not installed or need to restart computer
- Reinstall Node.js

**"FFmpeg not found"**
- FFmpeg not in PATH
- Restart Command Prompt after adding to PATH
- Verify with `ffmpeg -version`

**"Failed to connect to database"**
- Check Supabase URL and key in .env files
- Make sure you ran the SQL schema
- Check Supabase project is active

**"Invalid API key"**
- Check OpenAI and Anthropic keys are correct
- Make sure there are no extra spaces
- Verify you have credit in both accounts

**"npm install" fails**
- Make sure you're in the right directory
- Delete `node_modules` folder and try again
- Check internet connection

**Video processing fails**
- Try a shorter video first (under 1 minute)
- Check API keys have credit
- Some platforms block downloads - try uploading file instead

## Daily Usage

Every time you want to use the app:

**Easy way:**
- Double-click `start-app.bat`
- Wait 15 seconds
- Open http://localhost:3000

**Manual way:**
1. Open two Command Prompts
2. In first: `cd C:\AKINWALE\Garde\server && npm run dev`
3. In second: `cd C:\AKINWALE\Garde\client && npm run dev`
4. Open http://localhost:3000

## What's Next?

**After you're comfortable using it locally:**
- Read `docs/DEPLOYMENT.md` to deploy to the internet
- Access your app from anywhere
- Use on your phone/tablet
- Share with your wife and family

**Want to customize?**
- All code is well-commented
- Modify colors in `client/tailwind.config.js`
- Add features as you learn
- Check `PROJECT_SUMMARY.md` for code structure

## Need More Help?

- **Quick Setup**: `docs/QUICK_START.md`
- **Full Details**: `README.md`
- **Common Issues**: `docs/FAQ.md`
- **Deployment**: `docs/DEPLOYMENT.md`

---

## Quick Checklist

- [ ] Node.js installed (verified with `node --version`)
- [ ] FFmpeg installed (verified with `ffmpeg -version`)
- [ ] Supabase account created
- [ ] Database schema executed in Supabase
- [ ] Supabase URL and keys copied
- [ ] OpenAI API key obtained ($10 credit added)
- [ ] Anthropic API key obtained ($10 credit added)
- [ ] Backend .env configured
- [ ] Frontend .env.local configured
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Both servers running
- [ ] Tested with a video

## Total Time Estimate

- Prerequisites: 20 minutes
- Configuration: 10 minutes
- Installation: 10 minutes
- Testing: 5 minutes

**Total: ~45 minutes** (first time)

After that, starting the app takes 30 seconds!

---

Congratulations! You're about to have your own AI-powered recipe keeper! 🎉

Start with Step 1 and work your way down. You've got this! 💪
