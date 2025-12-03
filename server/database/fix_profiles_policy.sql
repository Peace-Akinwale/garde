-- Fix: Remove circular reference in profiles RLS policy
-- Run this in Supabase SQL Editor

-- First, create a function that bypasses RLS to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- This bypasses RLS
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create fixed version using the function (no recursion)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    -- Users can view their own profile
    auth.uid() = id
    OR
    -- OR if user is admin (uses function that bypasses RLS)
    public.is_admin()
  );
