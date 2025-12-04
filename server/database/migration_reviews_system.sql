-- ==========================================
-- REVIEW SYSTEM MIGRATION
-- ==========================================
-- This migration adds a comprehensive review system to Garde
-- Features: Star ratings, text reviews, screenshot uploads, admin responses
-- Run this in Supabase SQL Editor

-- Add is_admin column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN public.profiles.is_admin IS 'Admin users can manage reviews and access admin dashboard';
  END IF;
END $$;

-- ==========================================
-- REVIEWS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  screenshots TEXT[], -- Array of Supabase Storage URLs

  -- Status management
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'hidden')),
  is_read BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.reviews IS 'User reviews with star ratings and optional screenshots';
COMMENT ON COLUMN public.reviews.status IS 'pending: awaiting approval, published: visible to all, hidden: removed from public view';
COMMENT ON COLUMN public.reviews.is_read IS 'Admin has viewed this review';

-- ==========================================
-- REVIEW RESPONSES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.review_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Response content
  response_text TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.review_responses IS 'Admin responses to user reviews';

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_read ON public.reviews(is_read);
CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON public.review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_admin_user_id ON public.review_responses(admin_user_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for safe re-run)
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own pending reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view responses to published reviews" ON public.review_responses;
DROP POLICY IF EXISTS "Users can view responses to own reviews" ON public.review_responses;
DROP POLICY IF EXISTS "Admins can create responses" ON public.review_responses;
DROP POLICY IF EXISTS "Admins can update responses" ON public.review_responses;
DROP POLICY IF EXISTS "Admins can delete responses" ON public.review_responses;

-- Reviews policies
CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view published reviews"
  ON public.reviews FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can view own reviews"
  ON public.reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update reviews"
  ON public.reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete reviews"
  ON public.reviews FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Review responses policies
CREATE POLICY "Anyone can view responses to published reviews"
  ON public.review_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_responses.review_id
      AND reviews.status = 'published'
    )
  );

CREATE POLICY "Users can view responses to own reviews"
  ON public.review_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_responses.review_id
      AND reviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create responses"
  ON public.review_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update responses"
  ON public.review_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete responses"
  ON public.review_responses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- ==========================================
-- UPDATE TRIGGERS
-- ==========================================
-- Reuse existing update_updated_at_column function

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_responses_updated_at
  BEFORE UPDATE ON public.review_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- STORAGE BUCKET FOR SCREENSHOTS
-- ==========================================
-- Create storage bucket for review screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-screenshots', 'review-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload review screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view review screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any screenshots" ON storage.objects;

CREATE POLICY "Users can upload review screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'review-screenshots'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view review screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-screenshots');

CREATE POLICY "Users can delete own screenshots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-screenshots'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can delete any screenshots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-screenshots'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to get review statistics
CREATE OR REPLACE FUNCTION get_review_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'published', COUNT(*) FILTER (WHERE status = 'published'),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'hidden', COUNT(*) FILTER (WHERE status = 'hidden'),
    'average_rating', ROUND(AVG(rating)::numeric, 2),
    'five_star', COUNT(*) FILTER (WHERE rating = 5),
    'four_star', COUNT(*) FILTER (WHERE rating = 4),
    'three_star', COUNT(*) FILTER (WHERE rating = 3),
    'two_star', COUNT(*) FILTER (WHERE rating = 2),
    'one_star', COUNT(*) FILTER (WHERE rating = 1)
  ) INTO result
  FROM public.reviews;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_review_stats() IS 'Get comprehensive statistics about reviews';

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
-- Verify tables were created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_responses') THEN
    RAISE NOTICE '✅ Review system migration completed successfully!';
    RAISE NOTICE 'Tables created: reviews, review_responses';
    RAISE NOTICE 'Storage bucket created: review-screenshots';
    RAISE NOTICE 'RLS policies configured';
    RAISE NOTICE 'Ready to accept user reviews!';
  ELSE
    RAISE EXCEPTION '❌ Migration failed - tables were not created';
  END IF;
END $$;
