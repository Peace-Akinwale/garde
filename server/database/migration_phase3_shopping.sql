-- Phase 3: Shopping Lists Database Migration
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. SHOPPING LISTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON public.shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_at ON public.shopping_lists(created_at DESC);

-- Enable RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own shopping lists"
  ON public.shopping_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own shopping lists"
  ON public.shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists"
  ON public.shopping_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists"
  ON public.shopping_lists FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- 2. SHOPPING LIST GUIDES JUNCTION TABLE
-- ==========================================

-- Links shopping lists to the guides they were created from
CREATE TABLE IF NOT EXISTS public.shopping_list_guides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shopping_list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shopping_list_id, guide_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopping_list_guides_list_id ON public.shopping_list_guides(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_guides_guide_id ON public.shopping_list_guides(guide_id);

-- Enable RLS
ALTER TABLE public.shopping_list_guides ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can access if they own the shopping list)
CREATE POLICY "Users can view own shopping list guides"
  ON public.shopping_list_guides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = shopping_list_guides.shopping_list_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add guides to own shopping lists"
  ON public.shopping_list_guides FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = shopping_list_guides.shopping_list_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove guides from own shopping lists"
  ON public.shopping_list_guides FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = shopping_list_guides.shopping_list_id
      AND user_id = auth.uid()
    )
  );

-- ==========================================
-- 3. HELPER FUNCTION: UPDATE TIMESTAMP
-- ==========================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shopping_list_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS on_shopping_list_update ON public.shopping_lists;
CREATE TRIGGER on_shopping_list_update
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_shopping_list_timestamp();

-- ==========================================
-- ITEMS JSONB STRUCTURE
-- ==========================================

-- Each item in the items JSONB array has this structure:
-- {
--   "id": "uuid-v4",
--   "name": "Tomatoes",
--   "quantity": "3 large",
--   "category": "Vegetables",
--   "checked": false,
--   "source": "guide_id or manual"
-- }
