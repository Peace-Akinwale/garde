-- Phase 1 Migration: User Activity Tracking & Admin Features
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. ADD ADMIN COLUMN TO PROFILES
-- ==========================================

-- Add is_admin column to existing profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ==========================================
-- 2. USER ACTIVITY TRACKING TABLE
-- ==========================================

-- Table to track all user activities
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'login', 'guide_created', 'guide_viewed', 'guide_edited', 'guide_deleted', 'video_processed'
  activity_data JSONB DEFAULT '{}'::jsonb, -- Additional context (guide_id, video_url, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.user_activity(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view their own activity
CREATE POLICY "Users can view own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
  ON public.user_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ==========================================
-- 3. USER ENGAGEMENT SUMMARY TABLE
-- ==========================================

-- Materialized summary for performance
CREATE TABLE IF NOT EXISTS public.user_engagement_summary (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_guides INTEGER DEFAULT 0,
  total_logins INTEGER DEFAULT 0,
  total_videos_processed INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,
  days_active INTEGER DEFAULT 0,
  engagement_score DECIMAL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_engagement_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own engagement"
  ON public.user_engagement_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all engagement"
  ON public.user_engagement_summary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ==========================================
-- 4. USER SIGN-UPS LOG TABLE
-- ==========================================

-- Log all new user sign-ups
CREATE TABLE IF NOT EXISTS public.user_signups_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_sent BOOLEAN DEFAULT FALSE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_signups_signed_up_at ON public.user_signups_log(signed_up_at DESC);

-- Enable RLS (only admins can view)
ALTER TABLE public.user_signups_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all signups"
  ON public.user_signups_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ==========================================
-- 5. FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to update engagement summary when activity is logged
CREATE OR REPLACE FUNCTION update_user_engagement()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert engagement summary
  INSERT INTO public.user_engagement_summary (user_id, last_active_at, updated_at)
  VALUES (NEW.user_id, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_active_at = NOW(),
    updated_at = NOW(),
    total_logins = CASE
      WHEN NEW.activity_type = 'login'
      THEN public.user_engagement_summary.total_logins + 1
      ELSE public.user_engagement_summary.total_logins
    END,
    total_guides = CASE
      WHEN NEW.activity_type = 'guide_created'
      THEN public.user_engagement_summary.total_guides + 1
      ELSE public.user_engagement_summary.total_guides
    END,
    total_videos_processed = CASE
      WHEN NEW.activity_type = 'video_processed'
      THEN public.user_engagement_summary.total_videos_processed + 1
      ELSE public.user_engagement_summary.total_videos_processed
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update engagement on activity
CREATE TRIGGER on_activity_update_engagement
  AFTER INSERT ON public.user_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_user_engagement();

-- Function to log new sign-ups
CREATE OR REPLACE FUNCTION log_new_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_signups_log (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert (logs sign-ups)
DROP TRIGGER IF EXISTS on_user_signup_notification ON auth.users;
CREATE TRIGGER on_user_signup_notification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION log_new_signup();

-- ==========================================
-- 6. UPDATE RLS POLICIES FOR ADMIN ACCESS
-- ==========================================

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- Allow admins to view all guides
CREATE POLICY "Admins can view all guides"
  ON public.guides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ==========================================
-- 7. HELPER VIEWS FOR ANALYTICS
-- ==========================================

-- View for admin dashboard (combines user data)
CREATE OR REPLACE VIEW public.admin_user_overview AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.is_admin,
  p.created_at as joined_at,
  COALESCE(e.total_guides, 0) as total_guides,
  COALESCE(e.total_logins, 0) as total_logins,
  COALESCE(e.total_videos_processed, 0) as total_videos_processed,
  e.last_active_at,
  COALESCE(e.engagement_score, 0) as engagement_score,
  CASE
    WHEN e.last_active_at IS NULL THEN 'inactive'
    WHEN e.last_active_at > NOW() - INTERVAL '7 days' THEN 'active'
    WHEN e.last_active_at > NOW() - INTERVAL '30 days' THEN 'moderate'
    ELSE 'inactive'
  END as activity_status
FROM public.profiles p
LEFT JOIN public.user_engagement_summary e ON p.id = e.user_id
ORDER BY p.created_at DESC;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Set yourself as admin:
--    UPDATE public.profiles SET is_admin = TRUE WHERE email = 'your@email.com';
-- 3. Verify tables created:
--    SELECT * FROM public.user_activity LIMIT 1;
--    SELECT * FROM public.user_engagement_summary LIMIT 1;
--    SELECT * FROM public.user_signups_log LIMIT 1;
