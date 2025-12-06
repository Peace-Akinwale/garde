-- Migration: Add pin functionality to guides
-- This allows users to pin important guides to the top of their list

-- Add pinned column to guides table
ALTER TABLE public.guides
ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for pinned field to optimize sorting queries
CREATE INDEX IF NOT EXISTS idx_guides_pinned ON public.guides(pinned DESC, created_at DESC);

-- Update the comment to document the new field
COMMENT ON COLUMN public.guides.pinned IS 'Whether this guide is pinned to the top of the user''s list';
