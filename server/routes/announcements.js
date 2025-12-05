import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/announcements
 * Fetch all announcements, sorted by date (newest first)
 * Public endpoint - no authentication required
 */
router.get('/', async (req, res) => {
  try {
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      return res.status(500).json({ error: 'Failed to fetch announcements' });
    }

    res.json({ announcements });
  } catch (error) {
    console.error('Error in announcements endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
