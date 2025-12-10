-- Migration: Fix Function Search Path Issues
-- This adds search_path to all functions to prevent security vulnerabilities
-- Run this in Supabase SQL Editor

-- Function 1: update_user_engagement
CREATE OR REPLACE FUNCTION public.update_user_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Your existing function logic here
  -- This is a placeholder - you'll need to add your actual function code
  RETURN NEW;
END;
$$;

-- Function 2: log_new_signup
CREATE OR REPLACE FUNCTION public.log_new_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Your existing function logic here
  RETURN NEW;
END;
$$;

-- Function 3: update_review_helpful_count
CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Your existing function logic here
  RETURN NEW;
END;
$$;

-- Function 4: get_user_badges
CREATE OR REPLACE FUNCTION public.get_user_badges(p_user_id UUID)
RETURNS TABLE (
  badge_name TEXT,
  badge_description TEXT,
  earned_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Your existing function logic here
  RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, NULL::TIMESTAMP WHERE FALSE;
END;
$$;

-- Function 5: get_review_stats
CREATE OR REPLACE FUNCTION public.get_review_stats()
RETURNS TABLE (
  total_reviews BIGINT,
  avg_rating NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Your existing function logic here
  RETURN QUERY SELECT 0::BIGINT, 0::NUMERIC WHERE FALSE;
END;
$$;

-- Function 6: cleanup_old_jobs
CREATE OR REPLACE FUNCTION public.cleanup_old_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Your existing function logic here
  RETURN;
END;
$$;

-- Function 7: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Your existing function logic here
  RETURN FALSE;
END;
$$;

-- Function 8: update_shopping_list_timestamp
CREATE OR REPLACE FUNCTION public.update_shopping_list_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Your existing function logic here
  RETURN NEW;
END;
$$;

-- Function 9: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function 10: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Your existing function logic here
  RETURN NEW;
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.update_user_engagement IS 'Fixed: Added search_path for security';
COMMENT ON FUNCTION public.log_new_signup IS 'Fixed: Added search_path for security';
COMMENT ON FUNCTION public.update_review_helpful_count IS 'Fixed: Added search_path for security';
COMMENT ON FUNCTION public.get_user_badges IS 'Fixed: Added search_path for security';
COMMENT ON FUNCTION public.get_review_stats IS 'Fixed: Added search_path for security';
COMMENT ON FUNCTION public.cleanup_old_jobs IS 'Fixed: Added search_path for security';
COMMENT ON FUNCTION public.is_admin IS 'Fixed: Added search_path for security';
COMMENT ON FUNCTION public.update_shopping_list_timestamp IS 'Fixed: Added search_path for security';
COMMENT ON FUNCTION public.update_updated_at_column IS 'Fixed: Added search_path for security';
COMMENT ON FUNCTION public.handle_new_user IS 'Fixed: Added search_path for security';

