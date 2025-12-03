# Phase 1 Setup Guide - Email & Analytics

This guide will walk you through setting up Phase 1 features for your Garde app.

## What We've Built So Far ✅

1. **Dependencies Installed:** resend, node-cron, web-push
2. **Database Migration Created:** `database/migration_phase1_tracking.sql`
3. **Services Created:**
   - `services/emailNotifications.js` - Email notifications via Resend
   - `services/analytics.js` - User activity tracking
4. **Routes Created:**
   - `routes/webhooks.js` - Handle sign-up notifications

## Next Steps (Your Action Required!)

### Step 1: Create Resend Account (5 minutes)

1. Go to: **https://resend.com**
2. Click "Sign Up" (top right)
3. Sign up with your email (FREE tier - 3,000 emails/month)
4. Verify your email
5. Once logged in, go to: **API Keys** (in sidebar)
6. Click "Create API Key"
7. Name it: `Garde Production`
8. Copy the API key (starts with `re_...`)
9. **IMPORTANT:** Save this key - you'll only see it once!

### Step 2: Run Database Migration (3 minutes)

1. Go to your Supabase dashboard: **https://supabase.com/dashboard**
2. Select your Garde project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Open the file: `server/database/migration_phase1_tracking.sql`
6. Copy ALL the SQL code from that file
7. Paste it into the Supabase SQL Editor
8. Click "Run" (or press Ctrl/Cmd + Enter)
9. Wait for confirmation: "Success. No rows returned"

### Step 3: Set Yourself as Admin (1 minute)

Still in Supabase SQL Editor, run this command (replace with YOUR email):

```sql
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'your@email.com';
```

Replace `your@email.com` with the email you use to log into Garde!

### Step 4: Add Environment Variables (2 minutes)

Add these to your `.env` file in the `server` folder:

```env
# Email Notifications (Resend)
RESEND_API_KEY=re_your_actual_key_here
ADMIN_EMAIL=your@email.com

# Client URL
CLIENT_URL=https://garde-tau.vercel.app
```

**Replace:**
- `re_your_actual_key_here` with the Resend API key from Step 1
- `your@email.com` with your email address

## Verification Steps

After completing the above steps, let's verify everything works:

### 1. Check Database Tables

Run this in Supabase SQL Editor:

```sql
-- Check if tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_activity', 'user_engagement_summary', 'user_signups_log');
```

You should see all 3 tables listed.

### 2. Check Admin Status

```sql
SELECT email, is_admin
FROM public.profiles
WHERE is_admin = TRUE;
```

You should see your email with `is_admin = true`.

### 3. Test Email (Optional - we'll do this together)

We can test the email notification after you complete the steps above.

## What Happens Next?

Once you've completed these steps:

1. Tell me: "Done with setup!"
2. I'll integrate the tracking into existing routes
3. I'll create the admin dashboard routes
4. We'll test everything together
5. Push to GitHub and deploy!

## Need Help?

If you get stuck on any step, just let me know which step you're on and what error you see!

---

**Time Estimate:** 10-15 minutes total
