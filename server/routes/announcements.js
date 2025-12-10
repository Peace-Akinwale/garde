import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware to check if user is admin
 */
const checkAdmin = async (req, res, next) => {
  try {
    // Try to get user ID from x-user-id header first (matches admin routes pattern)
    let userId = req.headers['x-user-id'] || req.body.userId;

    // Fallback: try authorization header
    if (!userId) {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && user) {
          userId = user.id;
        }
      }
    }

    // Last fallback: try query param
    if (!userId) {
      userId = req.query.userId;
    }

    if (!userId) {
      console.error('No user ID found in request');
      return res.status(401).json({
        error: 'User ID required. Please log in and try again.'
      });
    }

    // Check if user is admin
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return res.status(500).json({
        error: 'Failed to verify admin status'
      });
    }

    if (!profile || !profile.is_admin) {
      console.error('User is not admin:', userId);
      return res.status(403).json({
        error: 'Unauthorized: Admin access required'
      });
    }

    req.adminUserId = userId;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      error: 'Failed to verify admin status'
    });
  }
};

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

    res.json({ announcements: announcements || [] });
  } catch (error) {
    console.error('Error in announcements endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/announcements
 * Create a new announcement (admin only)
 */
router.post('/', checkAdmin, async (req, res) => {
  try {
    const { title, description, date, icon, color } = req.body;

    // Validate required fields
    if (!title || !description || !date) {
      return res.status(400).json({ error: 'Title, description, and date are required' });
    }

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        title,
        description,
        date,
        icon: icon || 'sparkles',
        color: color || 'blue'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      return res.status(500).json({ error: 'Failed to create announcement' });
    }

    res.json({ announcement });
  } catch (error) {
    console.error('Error in create announcement endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/announcements/:id
 * Update an announcement (admin only)
 */
router.put('/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, icon, color } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;

    const { data: announcement, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating announcement:', error);
      return res.status(500).json({ error: 'Failed to update announcement' });
    }

    res.json({ announcement });
  } catch (error) {
    console.error('Error in update announcement endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/announcements/:id
 * Delete an announcement (admin only)
 */
router.delete('/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      return res.status(500).json({ error: 'Failed to delete announcement' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in delete announcement endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
