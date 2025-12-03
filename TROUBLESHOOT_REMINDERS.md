# Reminders Troubleshooting Guide

## Step-by-Step Debugging

### Step 1: Verify Reminder Was Created in Database

Run this in **Supabase SQL Editor**:

```sql
SELECT
  id,
  user_id,
  guide_id,
  reminder_type,
  scheduled_for,
  title,
  message,
  sent,
  sent_at,
  created_at,
  -- Calculate if it's due
  CASE
    WHEN scheduled_for <= NOW() THEN 'DUE NOW'
    ELSE 'FUTURE'
  END as status
FROM reminders
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result**: You should see your reminder with:
- `sent` = `false`
- `scheduled_for` = the time you set
- `status` = `DUE NOW` (if past the scheduled time)

**If no reminders appear**: The frontend isn't creating them properly.

**If reminder appears but `sent` = `true`**: It was already processed.

---

### Step 2: Check Render Logs

Go to **Render Dashboard** → Your Service → **Logs** tab

Look for these messages:

✅ **Scheduler Started Successfully**:
```
🚀 Garde server running on http://localhost:3001
✅ Reminder scheduler started
```

✅ **Scheduler Running (Every Minute)**:
```
Checking for due reminders...
```

✅ **Reminder Processed**:
```
Found 1 due reminder(s)
Reminder email sent to akindayopeaceakinwale@gmail.com
✅ Email sent successfully: { id: '...' }
Reminder <uuid> sent successfully
```

❌ **Errors to Look For**:
```
⚠️  RESEND_API_KEY not configured
Error sending email: ...
Error checking reminders: ...
Failed to send email: ...
```

---

### Step 3: Verify Environment Variables on Render

Go to **Render Dashboard** → Your Service → **Environment** tab

Check these variables exist AND have values:

Required for Email Reminders:
- ✅ `RESEND_API_KEY` = `re_iYLnxs4y_NUMAtt4ykP4w2gm4fS9tTFvv`
- ✅ `ADMIN_EMAIL` = `akindayopeaceakinwale@gmail.com`
- ✅ `SUPABASE_URL` = (your Supabase URL)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
- ✅ `CLIENT_URL` = `https://garde-tau.vercel.app`

Optional for Push Notifications:
- `VAPID_PUBLIC_KEY` = `BPCrykINWlTPGBy072cnUI9_9kZDrCdaqji1VTIHIo1xWveoM8GTQb6MLz00UvQ-qoDe0Y2cYIhla1tglrgR6JQ`
- `VAPID_PRIVATE_KEY` = `SyTXNAikx0HMRqBbYCW7lTgobWwGq_rGjTdiZWpwVgs`

**CRITICAL**: After adding/changing environment variables, you MUST click **"Manual Deploy"** → **"Deploy latest commit"** for changes to take effect!

---

### Step 4: Check Render Service Status

In Render Dashboard → Your Service:

- **Status**: Should be "Live" (green)
- **Last Deploy**: Should be recent (within last hour)
- **Health Check**: Should be passing

If status is "Deploy failed" or "Build failed":
- Click on the failed deploy
- Read the error logs
- Fix the issue and redeploy

---

### Step 5: Test Email Sending Manually

You can test if Resend is working by running this in your local server:

Create a test file `test-email.js`:

```javascript
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Garde <notifications@resend.dev>',
      to: 'akindayopeaceakinwale@gmail.com',
      subject: 'Test Email from Garde',
      html: '<h1>Test Successful!</h1><p>If you see this, Resend is working.</p>'
    });

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Email sent:', data);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testEmail();
```

Run it:
```bash
cd server
node test-email.js
```

Expected output:
```
✅ Email sent: { id: 'xxxx-xxxx-xxxx' }
```

If error:
```
❌ Error: { message: 'API key is invalid' }
```
→ Your Resend API key is wrong

---

### Step 6: Check Resend Dashboard

Go to https://resend.com/emails

You should see:
- **Sent emails** (if emails were sent)
- **Delivery status**: Delivered / Bounced / Failed
- **Error messages** (if any)

Common issues:
- **API Key Invalid**: Get a new key from Resend
- **Daily Limit Reached**: Free tier is 100 emails/day
- **Email Bounced**: Check if email address is valid

---

### Step 7: Force Manual Reminder Check

If scheduler isn't running, you can trigger it manually.

Add this endpoint to `server/index.js` temporarily:

```javascript
import { checkReminders } from './services/reminderScheduler.js';

// Add this route
app.get('/api/test/check-reminders', async (req, res) => {
  try {
    await checkReminders();
    res.json({ success: true, message: 'Checked reminders' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Then visit: `https://your-render-url.onrender.com/api/test/check-reminders`

This will manually trigger the reminder check and you can see errors in the response.

---

## Common Issues & Fixes

### Issue 1: "Scheduler not starting"

**Symptom**: No "Checking for due reminders..." in logs

**Fix**:
1. Check Render logs for startup errors
2. Verify VAPID keys are set (or remove them if not using push)
3. Redeploy on Render

### Issue 2: "Emails not sending"

**Symptom**: Scheduler runs but no emails arrive

**Fix**:
1. Check RESEND_API_KEY is set on Render
2. Test email manually (Step 5)
3. Check Resend dashboard for errors
4. Verify email address is correct

### Issue 3: "Reminder created but never processed"

**Symptom**: Reminder in database with `sent = false`, but scheduler isn't finding it

**Fix**:
1. Check `scheduled_for` is in the past
2. Verify scheduler is running (see logs)
3. Check Supabase Service Role Key is correct
4. Run manual check (Step 7)

### Issue 4: "Push notifications not working"

**Symptom**: Email works but push doesn't

**Fix**:
1. Add VAPID keys to Render
2. Subscribe to push in browser (check for prompt)
3. Check browser console for errors
4. Verify service worker is registered

---

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Reminder exists in database (`SELECT * FROM reminders`)
- [ ] Reminder has `sent = false`
- [ ] `scheduled_for` is in the past
- [ ] Render service is "Live"
- [ ] Render logs show "Reminder scheduler started"
- [ ] Render logs show "Checking for due reminders..." every minute
- [ ] RESEND_API_KEY is set on Render
- [ ] ADMIN_EMAIL is set on Render
- [ ] SUPABASE_SERVICE_ROLE_KEY is set on Render
- [ ] Test email works (Step 5)
- [ ] No errors in Render logs

If ALL boxes are checked and it still doesn't work, there's a deeper issue. Share:
1. Render logs (last 100 lines)
2. Database query results (Step 1)
3. Resend dashboard screenshot

---

## Next Steps After Troubleshooting

Once you identify the issue:

1. **Fix it** (update env vars, fix code, etc.)
2. **Redeploy** on Render
3. **Wait 2-3 minutes** for deploy
4. **Create test reminder** (2 minutes from now)
5. **Watch Render logs** in real-time
6. **Check email** after 2 minutes

Good luck! 🚀
