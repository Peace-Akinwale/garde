-- Migration: Add Trash/Recycle Bin Feature
-- Date: 2025-12-09
-- Description: Implements soft-delete functionality with 7-day retention and auto-cleanup
-- Features: Move to trash, restore, permanent delete, bulk operations

-- ============================================================================
-- STEP 1: ADD SOFT DELETE COLUMNS TO GUIDES TABLE
-- ============================================================================

ALTER TABLE public.guides
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create indexes for faster trash queries
CREATE INDEX IF NOT EXISTS idx_guides_deleted_at ON public.guides(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guides_is_deleted ON public.guides(is_deleted) WHERE is_deleted = TRUE;
CREATE INDEX IF NOT EXISTS idx_guides_user_deleted ON public.guides(user_id, is_deleted) WHERE is_deleted = TRUE;

COMMENT ON COLUMN public.guides.deleted_at IS 'Timestamp when guide was moved to trash. NULL = active, NOT NULL = in trash';
COMMENT ON COLUMN public.guides.is_deleted IS 'Quick boolean flag to check if guide is in trash';

-- ============================================================================
-- STEP 2: UPDATE RLS POLICIES TO EXCLUDE TRASH FROM NORMAL VIEWS
-- ============================================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own guides" ON public.guides;

-- Recreate policy to exclude trash
CREATE POLICY "Users can view own guides"
  ON public.guides FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    AND (is_deleted = FALSE OR is_deleted IS NULL)
  );

-- New policy: Users can view their own trash
CREATE POLICY "Users can view own trash"
  ON public.guides FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    AND is_deleted = TRUE
  );

COMMENT ON POLICY "Users can view own guides" ON public.guides IS 'Users can only see their active (non-deleted) guides';
COMMENT ON POLICY "Users can view own trash" ON public.guides IS 'Users can view guides in their trash bin';

-- ============================================================================
-- STEP 3: SOFT DELETE FUNCTION (SINGLE GUIDE)
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_guide(p_guide_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE public.guides
  SET
    deleted_at = NOW(),
    is_deleted = TRUE,
    updated_at = NOW()
  WHERE id = p_guide_id
    AND user_id = (SELECT auth.uid())
    AND (is_deleted = FALSE OR is_deleted IS NULL)
  RETURNING jsonb_build_object(
    'success', TRUE,
    'id', id,
    'title', title,
    'deleted_at', deleted_at
  ) INTO v_result;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Guide not found, already deleted, or you do not have permission'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION soft_delete_guide IS 'Moves a single guide to trash (soft delete). Can be restored within 7 days.';

-- ============================================================================
-- STEP 4: BULK SOFT DELETE FUNCTION (MULTIPLE GUIDES)
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_soft_delete_guides(p_guide_ids UUID[])
RETURNS JSONB AS $$
DECLARE
  v_updated_count INTEGER;
  v_updated_titles TEXT[];
BEGIN
  WITH updated AS (
    UPDATE public.guides
    SET
      deleted_at = NOW(),
      is_deleted = TRUE,
      updated_at = NOW()
    WHERE id = ANY(p_guide_ids)
      AND user_id = (SELECT auth.uid())
      AND (is_deleted = FALSE OR is_deleted IS NULL)
    RETURNING id, title
  )
  SELECT COUNT(*)::INTEGER, ARRAY_AGG(title)
  INTO v_updated_count, v_updated_titles
  FROM updated;

  RETURN jsonb_build_object(
    'success', TRUE,
    'deleted_count', COALESCE(v_updated_count, 0),
    'titles', COALESCE(v_updated_titles, ARRAY[]::TEXT[])
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION bulk_soft_delete_guides IS 'Moves multiple guides to trash at once. Returns count of successfully deleted guides.';

-- ============================================================================
-- STEP 5: RESTORE FUNCTION (SINGLE GUIDE)
-- ============================================================================

CREATE OR REPLACE FUNCTION restore_guide(p_guide_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE public.guides
  SET
    deleted_at = NULL,
    is_deleted = FALSE,
    updated_at = NOW()
  WHERE id = p_guide_id
    AND user_id = (SELECT auth.uid())
    AND is_deleted = TRUE
  RETURNING jsonb_build_object(
    'success', TRUE,
    'id', id,
    'title', title,
    'restored', TRUE
  ) INTO v_result;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Guide not found, not in trash, or you do not have permission'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_guide IS 'Restores a single guide from trash back to active guides';

-- ============================================================================
-- STEP 6: BULK RESTORE FUNCTION (MULTIPLE GUIDES)
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_restore_guides(p_guide_ids UUID[])
RETURNS JSONB AS $$
DECLARE
  v_restored_count INTEGER;
  v_restored_titles TEXT[];
BEGIN
  WITH restored AS (
    UPDATE public.guides
    SET
      deleted_at = NULL,
      is_deleted = FALSE,
      updated_at = NOW()
    WHERE id = ANY(p_guide_ids)
      AND user_id = (SELECT auth.uid())
      AND is_deleted = TRUE
    RETURNING id, title
  )
  SELECT COUNT(*)::INTEGER, ARRAY_AGG(title)
  INTO v_restored_count, v_restored_titles
  FROM restored;

  RETURN jsonb_build_object(
    'success', TRUE,
    'restored_count', COALESCE(v_restored_count, 0),
    'titles', COALESCE(v_restored_titles, ARRAY[]::TEXT[])
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION bulk_restore_guides IS 'Restores multiple guides from trash at once. Returns count of successfully restored guides.';

-- ============================================================================
-- STEP 7: PERMANENT DELETE FUNCTION (SINGLE GUIDE)
-- ============================================================================

CREATE OR REPLACE FUNCTION permanently_delete_guide(p_guide_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_title TEXT;
BEGIN
  DELETE FROM public.guides
  WHERE id = p_guide_id
    AND user_id = (SELECT auth.uid())
    AND is_deleted = TRUE
  RETURNING title INTO v_title;

  IF v_title IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Guide not found, not in trash, or you do not have permission'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'title', v_title,
    'permanently_deleted', TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION permanently_delete_guide IS 'Permanently deletes a guide from trash. This action cannot be undone.';

-- ============================================================================
-- STEP 8: BULK PERMANENT DELETE FUNCTION (MULTIPLE GUIDES)
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_permanently_delete_guides(p_guide_ids UUID[])
RETURNS JSONB AS $$
DECLARE
  v_deleted_count INTEGER;
  v_deleted_titles TEXT[];
BEGIN
  WITH deleted AS (
    DELETE FROM public.guides
    WHERE id = ANY(p_guide_ids)
      AND user_id = (SELECT auth.uid())
      AND is_deleted = TRUE
    RETURNING id, title
  )
  SELECT COUNT(*)::INTEGER, ARRAY_AGG(title)
  INTO v_deleted_count, v_deleted_titles
  FROM deleted;

  RETURN jsonb_build_object(
    'success', TRUE,
    'deleted_count', COALESCE(v_deleted_count, 0),
    'titles', COALESCE(v_deleted_titles, ARRAY[]::TEXT[])
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION bulk_permanently_delete_guides IS 'Permanently deletes multiple guides from trash. This action cannot be undone.';

-- ============================================================================
-- STEP 9: EMPTY ENTIRE TRASH (DELETE ALL TRASH FOR USER)
-- ============================================================================

CREATE OR REPLACE FUNCTION empty_trash()
RETURNS JSONB AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.guides
    WHERE user_id = (SELECT auth.uid())
      AND is_deleted = TRUE
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER
  INTO v_deleted_count
  FROM deleted;

  RETURN jsonb_build_object(
    'success', TRUE,
    'deleted_count', COALESCE(v_deleted_count, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION empty_trash IS 'Permanently deletes all guides in trash for the current user. Cannot be undone.';

-- ============================================================================
-- STEP 10: AUTO-CLEANUP OLD TRASH (7+ DAYS) - RUNS VIA CRON
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_trash()
RETURNS TABLE (
  deleted_count INTEGER,
  guide_ids UUID[]
) AS $$
DECLARE
  v_deleted_count INTEGER;
  v_guide_ids UUID[];
BEGIN
  -- Delete guides that have been in trash for more than 7 days
  WITH deleted AS (
    DELETE FROM public.guides
    WHERE is_deleted = TRUE
      AND deleted_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER, ARRAY_AGG(id)
  INTO v_deleted_count, v_guide_ids
  FROM deleted;

  RETURN QUERY SELECT v_deleted_count, v_guide_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_trash IS 'Automatically deletes guides that have been in trash for more than 7 days. Should be run daily via cron job.';

-- ============================================================================
-- STEP 11: GET TRASH SUMMARY FOR USER
-- ============================================================================

CREATE OR REPLACE FUNCTION get_trash_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_in_trash', COUNT(*),
    'expiring_soon', COUNT(*) FILTER (WHERE deleted_at < NOW() - INTERVAL '6 days'),
    'expiring_today', COUNT(*) FILTER (WHERE deleted_at < NOW() - INTERVAL '6 days 23 hours'),
    'oldest_deletion', MIN(deleted_at),
    'newest_deletion', MAX(deleted_at)
  )
  INTO v_summary
  FROM public.guides
  WHERE user_id = p_user_id
    AND is_deleted = TRUE;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_trash_summary IS 'Returns summary statistics of guides in trash for a user';

-- ============================================================================
-- STEP 12: SCHEDULE AUTO-CLEANUP (CRON JOB)
-- ============================================================================

-- Note: You need to enable pg_cron extension first in Supabase Dashboard
-- Then run this in SQL editor to schedule the daily cleanup:

/*
SELECT cron.schedule(
  'cleanup-old-trash-daily',
  '0 2 * * *',  -- Every day at 2 AM UTC
  'SELECT cleanup_old_trash();'
);
*/

-- Alternatively, create a Supabase Edge Function and schedule it via Supabase Dashboard

-- ============================================================================
-- STEP 13: MIGRATE EXISTING DATA (SET DEFAULTS FOR EXISTING GUIDES)
-- ============================================================================

-- Set is_deleted to FALSE for all existing guides (if NULL)
UPDATE public.guides
SET is_deleted = FALSE
WHERE is_deleted IS NULL;

-- Make is_deleted NOT NULL with default FALSE
ALTER TABLE public.guides
  ALTER COLUMN is_deleted SET DEFAULT FALSE,
  ALTER COLUMN is_deleted SET NOT NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of what was added:
-- ✅ 2 new columns: deleted_at, is_deleted
-- ✅ 3 indexes for performance
-- ✅ 2 updated RLS policies
-- ✅ 10 new functions (single + bulk operations)
-- ✅ Auto-cleanup function for 7-day retention
-- ✅ Trash summary function

SELECT 'Trash feature migration completed successfully!' AS status;
