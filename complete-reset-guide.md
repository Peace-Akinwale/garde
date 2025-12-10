# Complete Reset - Fix Trash Issues

## Step 1: Force Update ALL Guides in Database

Run this in Supabase SQL Editor:

```sql
-- Force reset EVERYTHING
UPDATE guides
SET
  is_deleted = FALSE,
  deleted_at = NULL
WHERE is_deleted = TRUE OR deleted_at IS NOT NULL;

-- Verify it worked
SELECT COUNT(*) FROM guides WHERE is_deleted = TRUE;
-- Should return 0
```

## Step 2: Clear Browser Completely

1. **Open Developer Tools**: Press `F12`
2. **Right-click the refresh button** (while dev tools are open)
3. **Select "Empty Cache and Hard Reload"**

OR manually:
- Chrome: Settings → Privacy → Clear browsing data → Cached images and files
- Firefox: Ctrl+Shift+Delete → Cache

## Step 3: Logout and Login Again

This ensures your auth session is fresh:
1. Click logout in your app
2. Close the browser tab
3. Open new tab → localhost:3000
4. Login again

## Step 4: Test Delete

1. Try deleting a guide
2. If it still fails, open browser console (F12) → Console tab
3. Take screenshot of any errors
4. Also check the Network tab when you click delete

## Alternative: Check User ID Match

Run this in Supabase SQL Editor to see if guides belong to your current user:

```sql
-- Get your current user ID
SELECT auth.uid();

-- Check if any guides don't match your user ID
SELECT
  id,
  title,
  user_id,
  is_deleted,
  (user_id = auth.uid()) as "Belongs to me"
FROM guides
ORDER BY created_at DESC
LIMIT 10;
```

If "Belongs to me" shows FALSE for any guides, that's the problem!
