-- Migration: Add index on source_url for faster cache lookups
-- This significantly speeds up cache checks when processing video URLs

-- Add index on source_url column (for cache lookups)
CREATE INDEX IF NOT EXISTS idx_guides_source_url ON public.guides(source_url) 
WHERE source_url IS NOT NULL;

-- Add composite index for cache queries (source_url + source_type)
CREATE INDEX IF NOT EXISTS idx_guides_source_url_type ON public.guides(source_url, source_type) 
WHERE source_url IS NOT NULL AND source_type = 'url';

-- Add comment explaining the indexes
COMMENT ON INDEX idx_guides_source_url IS 'Index for fast cache lookups by video URL';
COMMENT ON INDEX idx_guides_source_url_type IS 'Composite index for cache lookups filtering by URL and type';






