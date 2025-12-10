-- Migration: Fix Function Search Path Issues (Simple Version)
-- This adds search_path to all functions to prevent security vulnerabilities
-- Run this in Supabase SQL Editor

-- NOTE: These are simple ALTER statements that add search_path to existing functions
-- They won't change the function logic, just add the security setting

-- Function 1: update_user_engagement
ALTER FUNCTION public.update_user_engagement() SET search_path = public, pg_temp;

-- Function 2: log_new_signup
ALTER FUNCTION public.log_new_signup() SET search_path = public, pg_temp;

-- Function 3: update_review_helpful_count
ALTER FUNCTION public.update_review_helpful_count() SET search_path = public, pg_temp;

-- Function 4: get_user_badges
-- Note: May need to adjust parameters if function signature is different
ALTER FUNCTION public.get_user_badges(UUID) SET search_path = public, pg_temp;

-- Function 5: get_review_stats
ALTER FUNCTION public.get_review_stats() SET search_path = public, pg_temp;

-- Function 6: cleanup_old_jobs
ALTER FUNCTION public.cleanup_old_jobs() SET search_path = public, pg_temp;

-- Function 7: is_admin
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;

-- Function 8: update_shopping_list_timestamp
ALTER FUNCTION public.update_shopping_list_timestamp() SET search_path = public, pg_temp;

-- Function 9: update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

-- Function 10: handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

-- Verify the changes
SELECT 
  routine_schema,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'update_user_engagement',
  'log_new_signup',
  'update_review_helpful_count',
  'get_user_badges',
  'get_review_stats',
  'cleanup_old_jobs',
  'is_admin',
  'update_shopping_list_timestamp',
  'update_updated_at_column',
  'handle_new_user'
);

