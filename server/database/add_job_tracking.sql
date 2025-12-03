-- Job Tracking System for Background Video Processing
-- This allows users to submit videos and close the browser while processing continues

CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('video_url', 'video_upload')),

  -- Input data
  video_url TEXT,
  video_file_path TEXT,

  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0, -- 0-100 percentage
  current_step TEXT, -- e.g., 'downloading', 'extracting_audio', 'transcribing', 'analyzing'

  -- Results
  transcription JSONB,
  guide JSONB,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON public.processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON public.processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON public.processing_jobs(created_at DESC);

-- RLS Policies
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view their own jobs"
  ON public.processing_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "Users can create their own jobs"
  ON public.processing_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can update all jobs (backend processing)
CREATE POLICY "Service role can update jobs"
  ON public.processing_jobs
  FOR UPDATE
  USING (true);

-- Function to clean up old completed/failed jobs (optional, run weekly)
CREATE OR REPLACE FUNCTION cleanup_old_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.processing_jobs
  WHERE (status = 'completed' OR status = 'failed')
  AND completed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.processing_jobs IS 'Tracks background video processing jobs so users can close browser while processing';
COMMENT ON COLUMN public.processing_jobs.progress IS 'Processing progress from 0-100';
COMMENT ON COLUMN public.processing_jobs.current_step IS 'Current processing step for UI display';
