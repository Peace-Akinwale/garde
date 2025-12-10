-- Run this in Supabase SQL Editor to restore ALL guides from trash
-- This will let you start with a clean slate

UPDATE guides
SET
  is_deleted = FALSE,
  deleted_at = NULL,
  updated_at = NOW()
WHERE is_deleted = TRUE;

-- Check results
SELECT
  COUNT(*) FILTER (WHERE is_deleted = TRUE) as "In Trash",
  COUNT(*) FILTER (WHERE is_deleted = FALSE) as "Active"
FROM guides;
