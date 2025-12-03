# Reminders Not Working? Setup Guide

## Problem
Reminders aren't sending notifications (no emails, no push notifications).

## Root Cause
**CRITICAL BUG FOUND AND FIXED**: The reminder scheduler was only starting if VAPID keys were configured. This meant even **email reminders** wouldn't work without VAPID keys.

**FIX DEPLOYED**: The scheduler now always starts, and email reminders will work even without VAPID keys configured.

## Setup Checklist on Render

### 1. Add Environment Variables to Render

Go to your Render dashboard → Services → garde-server → Environment

Add these variables:

```bash
# Required for EMAIL reminders
RESEND_API_KEY=re_iYLnxs4y_NUMAtt4ykP4w2gm4fS9tTFvv
ADMIN_EMAIL=akindayopeaceakinwale@gmail.com

# Required for PUSH notifications (optional for email-only)
VAPID_PUBLIC_KEY=BPCrykINWlTPGBy072cnUI9_9kZDrCdaqji1VTIHIo1xWveoM8GTQb6MLz00UvQ-qoDe0Y2cYIhla1tglrgR6JQ
VAPID_PRIVATE_KEY=SyTXNAikx0HMRqBbYCW7lTgobWwGq_rGjTdiZWpwVgs

# Already have these (double-check)
SUPABASE_URL=<your_supabase_url>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
CLIENT_URL=https://garde-tau.vercel.app
```

### 2. Check Render Logs

After deploying, check the logs for these messages:

✅ **SUCCESS - All configured:**
```
🚀 Garde server running on http://localhost:3001
✅ New features enabled: Activity tracking, Email notifications, Admin dashboard, Shopping lists, Reminders
✅ Reminder scheduler started
```

⚠️ **WARNING - Missing Resend API key:**
```
⚠️  RESEND_API_KEY not configured - email notifications disabled
```

⚠️ **WARNING - Missing VAPID keys:**
```
⚠️  VAPID keys not configured - push notifications disabled
```

### 3. Test Email Reminders

1. Create a test reminder for 2 minutes from now
2. Choose "Email Only" as notification method
3. Wait 2 minutes
4. Check your email inbox

### 4. Test Push Notifications

1. Visit the app in a browser (Chrome recommended)
2. Grant notification permissions when prompted
3. Create a test reminder for 2 minutes from now
4. Choose "Push Only" or "Both"
5. Wait 2 minutes
6. Should see browser notification

## How the Scheduler Works

- **Cron Job**: Runs every minute checking for due reminders
- **Email**: Sends via Resend API if RESEND_API_KEY is configured
- **Push**: Sends via Web Push API if VAPID keys are configured
- **Database**: Marks reminders as `sent` after delivery

## Debugging

### Check if scheduler is running

Look for this line in Render logs:
```
✅ Reminder scheduler started
```

If you see:
```
Checking for due reminders...
```

Every minute, the scheduler is working!

### Check if reminders are in database

Run this SQL in Supabase SQL Editor:
```sql
SELECT * FROM reminders
WHERE scheduled_for <= NOW()
AND sent = FALSE
ORDER BY scheduled_for DESC;
```

If you see reminders that are past due and not sent, check:
1. Are environment variables configured on Render?
2. Check Render logs for errors
3. Verify Resend API key is valid

### Common Issues

**Issue**: No notifications at all
**Fix**: Add RESEND_API_KEY to Render environment variables and redeploy

**Issue**: Push notifications not working
**Fix**: Add VAPID keys to Render environment variables and redeploy

**Issue**: "Reminder set successfully" but nothing happens
**Fix**:
1. Check Render logs for scheduler messages
2. Verify environment variables are set
3. Check Supabase `reminders` table for the entry

## Environment Variable Security

⚠️ **DO NOT** commit `.env` file to GitHub
⚠️ The keys shown above are from your local `.env` and should be added to Render manually

## Need Help?

If reminders still don't work after:
1. Adding all environment variables to Render
2. Redeploying
3. Waiting 2-3 minutes

Check Render logs for error messages and share them for debugging.
