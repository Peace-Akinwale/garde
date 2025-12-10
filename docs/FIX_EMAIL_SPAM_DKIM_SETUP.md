# Fix Email Spam Issues - DKIM, SPF, and DMARC Setup

This guide will help you prevent authentication emails from going to spam by properly configuring email authentication records (DKIM, SPF, DMARC) in your DNS.

## Understanding the Problem

When emails go to spam, it's usually because:
1. **Missing or incorrect SPF record** - Email servers don't know Resend is authorized to send for your domain
2. **Missing or incorrect DKIM record** - Emails can't be cryptographically verified
3. **Missing DMARC record** - No policy for handling authentication failures

## Step 1: Find Your DNS Provider

Your DNS records are managed where your domain's nameservers point. This could be:
- **Namecheap** (if you're using Namecheap's nameservers)
- **Cloudflare** (if you've moved DNS there)
- **Another DNS provider**

### How to Check:

1. Go to https://www.whatsmydns.net/
2. Enter `usegarde.com`
3. Look at the nameservers shown
   - If they show `dns1.registrar-servers.com` or similar → DNS is at **Namecheap**
   - If they show `*.cloudflare.com` → DNS is at **Cloudflare**
   - If they show something else → Check with that provider

## Step 2: Get Resend's DNS Records

1. Go to https://resend.com/ and log in
2. Navigate to **Domains** in the left sidebar
3. Find `usegarde.com` in your domains list
4. Click on it to view domain details
5. You'll see several DNS records you need to add:
   - **SPF Record** (TXT record)
   - **DKIM Record** (TXT record with a selector like `resend._domainkey`)
   - **DMARC Record** (TXT record for `_dmarc`)

**Important:** Copy all these records exactly as Resend shows them.

## Step 3: Add Records to Namecheap DNS

### If DNS is at Namecheap:

1. Log in to Namecheap: https://www.namecheap.com/
2. Go to **Domain List** → Click **Manage** next to `usegarde.com`
3. Go to **Advanced DNS** tab
4. Find the **Host Records** section

### Add SPF Record:

**IMPORTANT:** The SPF record must be on the root domain (`@`), NOT on a subdomain like `send`.

1. Click **Add New Record**
2. Select **TXT Record**
3. Fill in:
   - **Host:** `@` (this is the root domain - usegarde.com)
   - **Value:** `v=spf1 include:resend.com ~all`
   - **TTL:** `Automatic` or `3600`
4. Click **Save**

**If you also use Amazon SES or other email services:**
- **Value:** `v=spf1 include:resend.com include:amazonses.com ~all`

**Note:** 
- You can have SPF records on both `@` (root) and subdomains like `send` - they don't conflict
- The root domain (`@`) SPF is what email servers check for emails from `peace@usegarde.com`
- Subdomain SPF records only apply to that subdomain

### Add DKIM Record:

1. Click **Add New Record**
2. Select **TXT Record**
3. Fill in:
   - **Host:** `resend._domainkey` (or exactly what Resend shows)
   - **Value:** (Copy the entire value from Resend - it's a long string starting with `v=DKIM1;`)
   - **TTL:** `Automatic` or `3600`
4. Click **Save**

### Add DMARC Record:

1. Click **Add New Record**
2. Select **TXT Record**
3. Fill in:
   - **Host:** `_dmarc`
   - **Value:** `v=DMARC1; p=quarantine; rua=mailto:peace@usegarde.com`
   - **TTL:** `Automatic` or `3600`
4. Click **Save**

**DMARC Policy Options:**
- `p=none` - Monitor only (safest to start)
- `p=quarantine` - Send failures to spam (recommended)
- `p=reject` - Reject failures completely (strictest)

## Step 4: Verify Records Are Added

After adding records, wait 5-10 minutes for DNS propagation, then verify:

1. Go to https://mxtoolbox.com/spf.aspx
2. Enter `usegarde.com`
3. Check that SPF record is found and includes `resend.com`

4. Go to https://mxtoolbox.com/dkim.aspx
5. Enter `usegarde.com` and selector `resend`
6. Check that DKIM record is found

7. Go to https://mxtoolbox.com/dmarc.aspx
8. Enter `usegarde.com`
9. Check that DMARC record is found

## Step 5: Test Email Deliverability

1. Send a test password reset email from your app
2. Check if it lands in inbox or spam
3. If still in spam, check the email headers:
   - Gmail: Click the three dots → "Show original"
   - Look for:
     - `SPF: PASS`
     - `DKIM: PASS`
     - `DMARC: PASS`

## Common Issues and Solutions

### Issue: "SPF record too many lookups"

**Solution:** You might have multiple SPF records. You can only have ONE SPF record per domain. Combine them:
```
v=spf1 include:resend.com include:other-provider.com ~all
```

### Issue: DKIM not found

**Solutions:**
- Make sure the host/name is exactly `resend._domainkey` (or what Resend specifies)
- Wait longer for DNS propagation (can take up to 48 hours, usually 5-30 minutes)
- Check for typos in the record value

### Issue: Still going to spam after setup

**Additional steps:**
1. **Warm up your domain** - Send emails gradually over a few days
2. **Check sender reputation** - Use https://www.sender-score.org/
3. **Avoid spam trigger words** - Don't use words like "free", "urgent", "click here" in subject lines
4. **Use a proper "From" name** - Instead of just `peace@usegarde.com`, use `Garde <peace@usegarde.com>`
5. **Monitor DMARC reports** - Check the email address you set in DMARC (`peace@usegarde.com`) for reports

## Quick Checklist

- [ ] Found where DNS is hosted (Namecheap/Cloudflare/etc.)
- [ ] Got SPF, DKIM, and DMARC records from Resend
- [ ] Added SPF record to DNS
- [ ] Added DKIM record to DNS
- [ ] Added DMARC record to DNS
- [ ] Waited 10-30 minutes for propagation
- [ ] Verified records using MXToolbox
- [ ] Tested email delivery
- [ ] Checked email headers for SPF/DKIM/DMARC passes

## Expected Results

After proper setup:
- ✅ SPF: PASS
- ✅ DKIM: PASS  
- ✅ DMARC: PASS
- ✅ Emails land in inbox instead of spam
- ✅ Better email deliverability overall

## Need Help?

If records aren't working:
1. Double-check you copied them exactly from Resend
2. Verify DNS propagation with MXToolbox
3. Check for typos or extra spaces
4. Make sure you're editing DNS at the correct provider (where nameservers point)

---

**Important Note:** DNS changes can take 5 minutes to 48 hours to fully propagate, but usually work within 30 minutes. Be patient and verify before testing again.

