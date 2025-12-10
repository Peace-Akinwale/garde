-- Migration: Add stages column for stage-based progress tracking
-- This enables showing individual processing stages with checkmarks

-- Add stages column to processing_jobs table
ALTER TABLE public.processing_jobs
ADD COLUMN IF NOT EXISTS stages JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.processing_jobs.stages IS 'Array of processing stages with status, progress, and timing';

-- Example stages structure:
-- [
--   {
--     "id": "download",
--     "name": "Analyzing video",
--     "status": "completed",
--     "progress": 100,
--     "duration": "3.2s",
--     "startTime": 1234567890
--   },
--   {
--     "id": "extract",
--     "name": "Processing content",
--     "status": "processing",
--     "progress": 67,
--     "duration": null,
--     "startTime": 1234567920
--   },
--   ...
-- ]
