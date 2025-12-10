# How to Change Supabase SMTP Sender Email to peace@usegarde.com

This guide will help you change your Supabase authentication email sender from `noreply@usegarde.com` to `peace@usegarde.com`.

## Prerequisites

Before you start, make sure:
- ✅ You have access to your Resend account
- ✅ The email `peace@usegarde.com` is verified in Resend
- ✅ You have access to your Supabase project dashboard

## Step 1: Verify Email in Resend

First, make sure `peace@usegarde.com` is verified in your Resend account:

1. Go to https://resend.com/ and log in
2. Navigate to **Domains** in the left sidebar
3. Find `usegarde.com` in your domains list
4. Check that `peace@usegarde.com` is allowed to send emails
   - If you're using a domain API key, any email from that domain should work
   - If you need to verify a specific email, check the **Emails** section

**Note:** With Resend, once your domain (`usegarde.com`) is verified, you can send from any email address on that domain (e.g., `peace@usegarde.com`, `noreply@usegarde.com`, etc.).

## Step 2: Update Supabase SMTP Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (project_ref: `snopyifslqkyubmtqwms`)
3. Navigate to **Project Settings** (gear icon in the left sidebar)
4. Click on **Auth** tab
5. Scroll down to **SMTP Settings** section
6. Find the **Sender Email** field (or **From Email** field)
7. Change it from `noreply@usegarde.com` to:
   ```
   peace@usegarde.com
   ```
8. Click **Save** or **Update**

## Step 3: Verify SMTP Configuration

Make sure your SMTP settings are still correct:

- **SMTP Host:** `smtp.resend.com`
- **SMTP Port:** `465` (SSL) or `587` (TLS)
- **SMTP User:** `resend`
- **SMTP Password:** Your Resend API key (should start with `re_...`)
- **Sender Email:** `peace@usegarde.com` ← **This is what you're changing**

## Step 4: Test the Email Change

After updating the sender email, test it:

1. Go to your app at https://usegarde.com
2. Click "Sign In"
3. Click "Forgot your password?"
4. Enter a test email address
5. Check the email inbox
6. Verify that the email is **from:** `peace@usegarde.com` (instead of `noreply@usegarde.com`)

## Step 5: Update Email Templates (Optional)

You may want to update the email templates to reflect the new sender:

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. For each template (Sign Up, Password Reset, etc.):
   - Check the "From" field or sender name
   - Update if needed to match your branding
   - The sender email will automatically use `peace@usegarde.com` based on your SMTP settings

## Troubleshooting

### Issue: Email still shows as noreply@usegarde.com

**Solutions:**
- Clear your browser cache
- Wait a few minutes for changes to propagate
- Check that you saved the SMTP settings in Supabase
- Verify the sender email field is set to `peace@usegarde.com`

### Issue: Emails not sending

**Solutions:**
- Verify your Resend API key is correct in Supabase SMTP settings
- Check Resend dashboard for any sending errors
- Make sure your Resend account has sending credits/quota
- Verify the domain `usegarde.com` is still verified in Resend

### Issue: "Sender email not verified" error

**Solutions:**
- Make sure `peace@usegarde.com` is allowed for your verified domain in Resend
- If using Resend domain verification, any email from `@usegarde.com` should work
- Check Resend domain settings to ensure the domain is active

## What Emails Will Use the New Sender?

Once updated, all authentication emails from Supabase will be sent from `peace@usegarde.com`:

- ✅ Password reset emails
- ✅ Email confirmation emails
- ✅ Magic link emails
- ✅ Email change confirmation emails
- ✅ Any other authentication-related emails

## Summary

**What you changed:**
- SMTP Sender Email: `noreply@usegarde.com` → `peace@usegarde.com`

**What stays the same:**
- SMTP Host: `smtp.resend.com`
- SMTP Port: `465` or `587`
- SMTP User: `resend`
- SMTP Password: Your Resend API key

**Result:**
All authentication emails will now be sent from `peace@usegarde.com` instead of `noreply@usegarde.com`.

---

**Note:** Changes to SMTP settings may take a few minutes to propagate. Test after 2-3 minutes to confirm the change is active.

