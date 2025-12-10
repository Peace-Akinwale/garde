-- ==========================================
-- ANNOUNCEMENTS TABLE MIGRATION
-- ==========================================
-- This migration creates the announcements table for in-app notifications
-- Run this in Supabase SQL Editor

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  icon TEXT DEFAULT 'sparkles' CHECK (icon IN ('camera', 'video', 'palette', 'sparkles', 'tag', 'hammer', 'chefhat')),
  color TEXT DEFAULT 'blue' CHECK (color IN ('pink', 'purple', 'blue', 'green', 'orange', 'red', 'yellow')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for date sorting
CREATE INDEX IF NOT EXISTS idx_announcements_date ON public.announcements(date DESC);

-- Enable Row Level Security (public read, admin write)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read announcements (public)
CREATE POLICY "Anyone can view announcements"
  ON public.announcements
  FOR SELECT
  USING (true);

-- RLS Policy: Only admins can insert announcements
CREATE POLICY "Admins can create announcements"
  ON public.announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policy: Only admins can update announcements
CREATE POLICY "Admins can update announcements"
  ON public.announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policy: Only admins can delete announcements
CREATE POLICY "Admins can delete announcements"
  ON public.announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Add comment
COMMENT ON TABLE public.announcements IS 'In-app announcements/notifications for users about new features and updates';

