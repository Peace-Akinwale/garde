# Password Recovery Setup Guide

This guide explains how to configure password recovery for your Garde application on Supabase, Render, and Vercel.

## Overview

The password recovery feature allows users to reset their password if they forget it. The flow works as follows:

1. User clicks "Forgot your password?" on the login page
2. User enters their email address
3. Supabase sends a password reset email with a secure link
4. User clicks the link and is redirected to `/auth/reset-password`
5. User enters a new password
6. Password is updated and user is redirected to the home page

## Step 1: Configure Supabase Redirect URLs

You need to configure the redirect URL in your Supabase project settings so that password reset emails point to the correct URL.

### For Local Development:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration** (or **Settings** → **Auth**)
4. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth/reset-password
   ```
5. Click **Save**

### For Production (usegarde.com):

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add your production reset password URL:
   ```
   https://usegarde.com/auth/reset-password
   ```
   **Note:** Even though `usegarde.com` is already in your URL configuration, you need to add the full path `/auth/reset-password` for password resets to work correctly.
3. Also verify the Site URL is set to:
   ```
   https://usegarde.com
   ```
   (This should already be set if `usegarde.com` is in your configuration)
4. Click **Save**

### For Staging/Other Environments (Optional):

**Only if you have multiple environments** (staging, production, etc.), add all the URLs where your app is deployed:
```
https://staging.vercel.app/auth/reset-password
https://production.vercel.app/auth/reset-password
```

**If you only have one production site (like usegarde.com), you can skip this section.**

## Step 2: Configure Email Templates (Optional)

Supabase provides default email templates, but you can customize them:

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Select **Reset Password** template
3. Customize the email subject and body if desired
4. The reset link will automatically use the format: `{{ .ConfirmationURL }}`
5. Click **Save**

**Important:** The email template must include `{{ .ConfirmationURL }}` for the reset link to work.

## Step 3: Verify Environment Variables

Make sure your frontend has the correct environment variables set:

### Local Development (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Production (Vercel):

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Ensure these are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (your Render backend URL)

## Step 4: Test the Flow

### Local Testing:

1. Start your development server:
   ```bash
   cd client
   npm run dev
   ```

2. Open http://localhost:3000
3. Click "Sign In" or open the auth modal
4. Click "Forgot your password?"
5. Enter a valid email address
6. Check your email for the reset link
7. Click the link (it should redirect to `http://localhost:3000/auth/reset-password`)
8. Enter a new password
9. Verify you can log in with the new password

### Production Testing:

1. Test the flow on your live site at https://usegarde.com
2. Click "Forgot your password?" on the login page
3. Enter a valid email address
4. Check your email for the reset link
5. Click the link (it should redirect to `https://usegarde.com/auth/reset-password`)
6. Enter a new password
7. Verify you can log in with the new password

## Troubleshooting

### Issue: Reset link doesn't work / "Invalid or expired reset link"

**Solutions:**
- Verify the redirect URL is correctly configured in Supabase
- Check that the URL in Supabase matches exactly (including `https://` and the path `/auth/reset-password`)
- Make sure you're using the correct domain (localhost for dev, Vercel domain for production)
- Reset links expire after 1 hour by default - request a new one if expired

### Issue: Email not received

**Solutions:**
- Check spam/junk folder
- Verify the email address is correct
- Check Supabase Dashboard → Authentication → Users to see if the user exists
- Supabase free tier has email sending limits - check your quota
- Consider setting up custom SMTP (see below)

### Issue: Redirects to wrong URL

**Solutions:**
- Double-check the redirect URLs in Supabase settings
- Make sure you're testing with the correct environment (local vs production)
- Clear browser cache and cookies
- Check browser console for errors

### Issue: "Missing Supabase environment variables"

**Solutions:**
- Verify `.env.local` exists in the `client` folder
- Check that environment variables are set in Vercel
- Restart your development server after changing `.env.local`
- For Vercel, redeploy after adding environment variables

## Optional: Custom SMTP Configuration

For better email delivery and control, you can configure custom SMTP:

1. In Supabase Dashboard, go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure your SMTP provider (SendGrid, AWS SES, Resend, etc.)
4. Recommended providers:
   - **Resend** (if you're already using it for admin notifications)
   - **SendGrid** (free tier: 100 emails/day)
   - **AWS SES** (very affordable, pay-as-you-go)

### Example Resend Configuration:
- SMTP Host: `smtp.resend.com`
- SMTP Port: `465` (SSL) or `587` (TLS)
- SMTP User: `resend`
- SMTP Password: Your Resend API key
- Sender Email: Your verified domain email

## Security Notes

- Reset links expire after 1 hour (configurable in Supabase)
- Each reset link can only be used once
- Users must be authenticated (via the reset token) to change their password
- The reset page validates the token before allowing password changes

## Render Backend (No Configuration Needed)

The backend on Render doesn't need any special configuration for password recovery. The password reset flow is handled entirely by:
- Supabase (authentication and email sending)
- Next.js frontend (UI and token handling)

The backend API is not involved in the password reset process.

## Summary

**Required Steps:**
1. ✅ Add redirect URLs to Supabase (local and production)
2. ✅ Verify environment variables are set correctly
3. ✅ Test the flow in both local and production environments

**Optional Steps:**
- Customize email templates
- Set up custom SMTP for better delivery

That's it! Your password recovery feature should now be fully functional. 🎉

