-- Migration: Add pinned_at timestamp for proper pin ordering
-- This ensures the most recently pinned card appears at the top

-- Add pinned_at column to track when a guide was pinned
ALTER TABLE public.guides
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE;

-- Update the index to sort by pinned_at for pinned cards
DROP INDEX IF EXISTS idx_guides_pinned;
CREATE INDEX idx_guides_pinned_order ON public.guides(pinned DESC, pinned_at DESC NULLS LAST, created_at DESC);

-- Add comment to document the new field
COMMENT ON COLUMN public.guides.pinned_at IS 'Timestamp when this guide was last pinned (for ordering pinned cards)';
