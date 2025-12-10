-- Migration: Fix SECURITY DEFINER View Issue
-- This fixes the admin_user_overview view to remove SECURITY DEFINER
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS public.admin_user_overview;

-- Step 2: Recreate the view WITHOUT security definer
-- This will use the permissions of the querying user instead of the creator
CREATE VIEW public.admin_user_overview AS
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    p.full_name,
    p.role,
    (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) as total_reviews,
    (SELECT COUNT(*) FROM shopping_lists WHERE user_id = u.id) as total_lists
FROM 
    auth.users u
LEFT JOIN 
    profiles p ON u.id = p.id;

-- Step 3: Grant appropriate permissions
-- Only admins should be able to query this view
GRANT SELECT ON public.admin_user_overview TO authenticated;

-- Step 4: Add RLS policy to restrict access to admins only
ALTER VIEW public.admin_user_overview SET (security_invoker = true);

-- Add a comment explaining the change
COMMENT ON VIEW public.admin_user_overview IS 
'Admin overview of users. Uses security_invoker instead of security_definer for better security.';

