-- ==========================================
-- REVIEW ENHANCEMENTS MIGRATION
-- ==========================================
-- This adds: Review Voting, Badges, Auto-moderation flags
-- Run this in Supabase SQL Editor

-- ==========================================
-- REVIEW VOTES TABLE (Helpful Voting)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate votes
  UNIQUE(review_id, user_id)
);

COMMENT ON TABLE public.review_votes IS 'Tracks helpful votes on reviews';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON public.review_votes(user_id);

-- RLS Policies
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can vote on reviews"
  ON public.review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes"
  ON public.review_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can delete their own votes"
  ON public.review_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- ADD COLUMNS TO REVIEWS TABLE
-- ==========================================
-- Add helpful_count column to cache vote counts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'helpful_count'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
    COMMENT ON COLUMN public.reviews.helpful_count IS 'Cached count of helpful votes';
  END IF;
END $$;

-- Add auto-moderation flags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'flagged_for_review'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN flagged_for_review BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN public.reviews.flagged_for_review IS 'Auto-flagged for potential spam';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'flag_reason'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN flag_reason TEXT;
    COMMENT ON COLUMN public.reviews.flag_reason IS 'Reason why review was flagged';
  END IF;
END $$;

-- Index for helpful reviews (sorting)
CREATE INDEX IF NOT EXISTS idx_reviews_helpful_count ON public.reviews(helpful_count DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON public.reviews(flagged_for_review) WHERE flagged_for_review = TRUE;

-- ==========================================
-- TRIGGER: Update helpful_count when votes change
-- ==========================================
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews
    SET helpful_count = GREATEST(0, helpful_count - 1)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_vote_count_trigger ON public.review_votes;
CREATE TRIGGER review_vote_count_trigger
  AFTER INSERT OR DELETE ON public.review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- ==========================================
-- HELPER FUNCTIONS FOR BADGES
-- ==========================================

-- Function to get user's review badges
CREATE OR REPLACE FUNCTION get_user_badges(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  guide_count INTEGER;
  review_count INTEGER;
  helpful_votes INTEGER;
  signup_date TIMESTAMPTZ;
  badges JSON;
BEGIN
  -- Get guide count
  SELECT COUNT(*) INTO guide_count
  FROM public.guides
  WHERE user_id = user_uuid;

  -- Get review count
  SELECT COUNT(*) INTO review_count
  FROM public.reviews
  WHERE user_id = user_uuid;

  -- Get total helpful votes received
  SELECT COALESCE(SUM(helpful_count), 0) INTO helpful_votes
  FROM public.reviews
  WHERE user_id = user_uuid;

  -- Get signup date
  SELECT created_at INTO signup_date
  FROM public.profiles
  WHERE id = user_uuid;

  -- Build badges JSON
  badges := json_build_object(
    'verified_user', guide_count >= 5,
    'power_user', guide_count >= 25,
    'super_user', guide_count >= 100,
    'early_adopter', signup_date < (NOW() - INTERVAL '30 days'),
    'top_reviewer', helpful_votes >= 10,
    'active_reviewer', review_count >= 3
  );

  RETURN badges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_badges(UUID) IS 'Returns JSON of user badges based on activity';

-- ==========================================
-- ENHANCED STATS FUNCTION
-- ==========================================
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
    'flagged', COUNT(*) FILTER (WHERE flagged_for_review = TRUE),
    'average_rating', ROUND(AVG(rating)::numeric, 2),
    'five_star', COUNT(*) FILTER (WHERE rating = 5),
    'four_star', COUNT(*) FILTER (WHERE rating = 4),
    'three_star', COUNT(*) FILTER (WHERE rating = 3),
    'two_star', COUNT(*) FILTER (WHERE rating = 2),
    'one_star', COUNT(*) FILTER (WHERE rating = 1),
    'total_votes', (SELECT COUNT(*) FROM public.review_votes)
  ) INTO result
  FROM public.reviews;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_votes') THEN
    RAISE NOTICE '✅ Review enhancements migration completed successfully!';
    RAISE NOTICE 'Features added:';
    RAISE NOTICE '  - Review voting system (helpful votes)';
    RAISE NOTICE '  - Review badges (verified, power user, early adopter)';
    RAISE NOTICE '  - Auto-moderation flags';
    RAISE NOTICE '  - Enhanced statistics';
    RAISE NOTICE 'Ready for Phase 2 features!';
  ELSE
    RAISE EXCEPTION '❌ Migration failed - review_votes table not created';
  END IF;
END $$;
