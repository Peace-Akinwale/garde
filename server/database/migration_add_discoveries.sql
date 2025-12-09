-- Migration: Add discoveries column for live guide building
-- This enables real-time streaming of discovered ingredients and steps

-- Add discoveries column to processing_jobs table
ALTER TABLE public.processing_jobs
ADD COLUMN IF NOT EXISTS discoveries JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.processing_jobs.discoveries IS 'Real-time discoveries (title, ingredients, steps) for engaging UI during processing';

-- Example discoveries structure:
-- {
--   "title": "Homemade Lavender Soap",
--   "ingredients": ["Olive oil (500ml)", "Lye (150g)", ...],
--   "steps": ["Step 1: Mix ingredients", "Step 2: Heat to 100°F", ...],
--   "metadata": {
--     "ingredientCount": 8,
--     "stepCount": 12,
--     "duration": "45 minutes",
--     "difficulty": "medium",
--     "servings": "Makes 6 bars"
--   }
-- }
