# Security Fixes for Garde Application

This document contains all the security fixes needed to resolve:
1. **Bounced email issues** causing Supabase warnings
2. **SECURITY DEFINER view** vulnerability (ERROR level)
3. **Function search_path** vulnerabilities (10 warnings)
4. **Leaked password protection** (recommended security enhancement)

---

## Part 1: Email Validation Fixes (Already Applied)

### What Was Fixed

#### Client-Side (AuthModal.js)
- ✅ Added proper email validation using regex
- ✅ Added email trimming to remove whitespace
- ✅ Added full name validation for signups
- ✅ All emails are now validated before reaching Supabase

#### Server-Side (webhooks.js)
- ✅ Added server-side email validation
- ✅ Added email trimming on the server
- ✅ Added rate limiting (5 requests per minute per IP)
- ✅ Added email length validation (max 254 characters)

### Impact
These fixes prevent invalid emails from triggering Supabase Auth confirmation emails, which will stop the bounce-back issue.

---

## Part 2: Database Security Fixes (Manual Action Required)

### Step 1: Fix SECURITY DEFINER View

**What's the issue?**
The `admin_user_overview` view runs with elevated permissions, potentially exposing sensitive data.

**How to fix:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/snopyifslgkyubmtqwms
2. Click on "SQL Editor" in the left sidebar
3. Open the file: `database/migrations/001_fix_security_definer_view.sql`
4. Copy the entire contents of that file
5. Paste it into the SQL Editor
6. Click "Run" or press Ctrl+Enter

**Verification:**
After running, the Security Advisor should no longer show the "Security Definer View" error.

---

### Step 2: Fix Function Search Paths

**What's the issue?**
10 database functions don't have a fixed search_path, making them vulnerable to schema poisoning attacks.

**How to fix:**
1. In Supabase Dashboard, go to "SQL Editor"
2. Open the file: `database/migrations/002_fix_function_search_paths_simple.sql`
3. Copy the entire contents
4. Paste it into the SQL Editor
5. Click "Run" or press Ctrl+Enter

**Note:** If you get errors about function signatures not matching, you may need to adjust the ALTER statements. The error message will tell you the correct signature to use.

**Verification:**
After running, the Security Advisor should no longer show warnings for these 10 functions.

---

## Part 3: Enable Leaked Password Protection (Manual Action Required)

**What's the issue?**
Supabase can check passwords against 600M+ known compromised passwords from HaveIBeenPwned, but it's currently disabled.

**How to enable:**

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/snopyifslgkyubmtqwms
2. Click on "Authentication" in the left sidebar
3. Click on "Settings" or "Auth Settings"
4. Look for "Password Security" or "Security" section
5. Find the option for "Leaked Password Protection" or "HaveIBeenPwned Integration"
6. Toggle it **ON** or check the box to enable it
7. Save the settings

**Alternative location (if not found above):**
1. Go to "Project Settings" (gear icon)
2. Click on "Auth" tab
3. Scroll to "Password Security" section
4. Enable "Check against leaked passwords database"

**Impact:**
Users won't be able to use passwords that have been leaked in data breaches, significantly improving account security.

---

## Part 4: Additional Recommendations

### 1. Configure Custom SMTP (Optional but Recommended)

Supabase's warning message recommended setting up custom SMTP for better control over email delivery.

**Benefits:**
- More control over email sending
- Better delivery metrics
- Less likely to have sending privileges restricted

**How to set up:**
1. In Supabase Dashboard, go to "Project Settings" → "Auth"
2. Scroll to "SMTP Settings"
3. Configure your preferred email provider (SendGrid, AWS SES, Resend, etc.)

**Note:** You're already using Resend for admin notifications, so you could use Resend for Auth emails too:
- SMTP Host: `smtp.resend.com`
- SMTP Port: `587` or `465`
- Username: `resend`
- Password: Your Resend API key

### 2. Review Auth Email Templates

Check your auth email templates to ensure they're professional and reduce the chance of being marked as spam:
1. Dashboard → Authentication → Email Templates
2. Review: Confirmation, Password Reset, Magic Link templates

### 3. Monitor Bounce Rates

After these fixes are deployed:
1. Monitor your Supabase Auth logs for bounced emails
2. Check Supabase dashboard for any new warnings
3. Verify new signups are working correctly

---

## Implementation Checklist

- [x] Client-side email validation (AuthModal.js) - Auto-applied
- [x] Server-side email validation (webhooks.js) - Auto-applied
- [x] Rate limiting on signup endpoint - Auto-applied
- [ ] Run SQL migration: 001_fix_security_definer_view.sql
- [ ] Run SQL migration: 002_fix_function_search_paths_simple.sql  
- [ ] Enable leaked password protection in Supabase Dashboard
- [ ] (Optional) Configure custom SMTP in Supabase
- [ ] (Optional) Review auth email templates

---

## Testing After Implementation

### Test Email Validation
Try to sign up with these invalid emails (should all be rejected):
- `test@` (incomplete)
- `  test@example.com  ` (spaces - should be trimmed and accepted)
- `notanemail` (no @ symbol)
- `@example.com` (missing local part)

### Test Rate Limiting
Try to make 6+ signup requests from the same IP within 1 minute - the 6th should be rejected with error "Too many requests".

### Verify Database Security
Check Supabase Security Advisor:
1. Dashboard → Database → Security Advisor
2. Should show 0 errors and significantly fewer warnings

---

## Questions?

If you encounter any errors running the SQL migrations, check:
1. Function signatures might be different - adjust the ALTER statements
2. View definition might need tweaking based on your actual schema
3. Check Supabase logs for detailed error messages

You can also search the Supabase docs:
- Security Advisor: https://supabase.com/docs/guides/database/database-linter
- Auth Settings: https://supabase.com/docs/guides/auth

