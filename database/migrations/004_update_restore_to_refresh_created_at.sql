-- Update restore functions to refresh created_at timestamp
-- When guides are restored from trash, update their created_at to NOW()
-- so they appear at the top of the list (after pinned guides)

-- Update single restore function
CREATE OR REPLACE FUNCTION restore_guide(p_guide_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE public.guides
  SET
    deleted_at = NULL,
    is_deleted = FALSE,
    created_at = NOW(),
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

COMMENT ON FUNCTION restore_guide IS 'Restores a single guide from trash back to active guides. Updates created_at to NOW() so restored guide appears at top (after pinned guides).';

-- Update bulk restore function
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
      created_at = NOW(),
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

COMMENT ON FUNCTION bulk_restore_guides IS 'Restores multiple guides from trash at once. Updates created_at to NOW() so restored guides appear at top (after pinned guides). Returns count of successfully restored guides.';
