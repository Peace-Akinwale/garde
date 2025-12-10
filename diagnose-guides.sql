-- Run this in Supabase SQL Editor to see what's happening

-- Check the actual state of your guides
SELECT
  id,
  title,
  user_id,
  is_deleted,
  deleted_at,
  created_at
FROM guides
ORDER BY created_at DESC
LIMIT 10;

-- Count by status
SELECT
  is_deleted,
  COUNT(*) as count
FROM guides
GROUP BY is_deleted;

-- Check if any guides are "stuck" in deleted state
SELECT
  COUNT(*) as stuck_in_trash
FROM guides
WHERE is_deleted = TRUE;
