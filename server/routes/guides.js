import express from 'express';
import { supabase } from '../index.js';
import { trackActivity, ACTIVITY_TYPES } from '../services/analytics.js';

const router = express.Router();

/**
 * GET /api/guides/:userId
 * Get all guides for a user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { search, type, category } = req.query;

let query = supabase
    .from('guides')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('pinned', { ascending: false })
    .order('pinned_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({
      error: 'Failed to fetch guides',
      message: error.message,
    });
  }
});

/**
 * GET /api/guides/detail/:guideId
 * Get a single guide by ID
 */
router.get('/detail/:guideId', async (req, res) => {
  try {
    const { guideId } = req.params;
    const { userId } = req.query; // Get userId from query params

    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .eq('id', guideId)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    // Track guide viewed activity
    if (userId) {
      await trackActivity(userId, ACTIVITY_TYPES.GUIDE_VIEWED, {
        guide_id: guideId,
        guide_title: data.title
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching guide:', error);
    res.status(500).json({
      error: 'Failed to fetch guide',
      message: error.message,
    });
  }
});

/**
 * POST /api/guides
 * Create a new guide
 */
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      title,
      type,
      category,
      language,
      ingredients,
      steps,
      duration,
      servings,
      difficulty,
      tips,
      summary,
      transcription,
      sourceUrl,
    } = req.body;

    if (!userId || !title) {
      return res.status(400).json({
        error: 'User ID and title are required',
      });
    }

    const { data, error } = await supabase
      .from('guides')
      .insert([
        {
          user_id: userId,
          title,
          type: type || 'howto',
          category,
          language: language || 'en',
          ingredients: ingredients || [],
          steps: steps || [],
          duration,
          servings,
          difficulty,
          tips: tips || [],
          summary,
          transcription,
          source_url: sourceUrl,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Track guide created activity
    await trackActivity(userId, ACTIVITY_TYPES.GUIDE_CREATED, {
      guide_id: data.id,
      guide_title: title,
      guide_type: type || 'howto'
    });

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error creating guide:', error);
    res.status(500).json({
      error: 'Failed to create guide',
      message: error.message,
    });
  }
});

 /**
   * PATCH /api/guides/:guideId/pin
   * Toggle pin status for a guide
   */
  router.patch('/:guideId/pin', async (req, res) => {
    try {
      const { guideId } = req.params;
      const { userId, pinned } = req.body;

      if (typeof pinned !== 'boolean') {
        return res.status(400).json({
          error: 'Pinned status must be a boolean',
        });
      }

      const updateData = {
        pinned,
        pinned_at: pinned ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('guides')
        .update(updateData)
        .eq('id', guideId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      res.status(500).json({
        error: 'Failed to toggle pin',
        message: error.message,
      });
    }
  });

/**
 * PATCH /api/guides/:guideId
 * Update a guide
 */
router.patch('/:guideId', async (req, res) => {
  try {
    const { guideId } = req.params;
    const updateData = req.body;

    // Extract userId before removing it
    const userId = updateData.userId || updateData.user_id;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.user_id;
    delete updateData.userId;
    delete updateData.created_at;

    const { data, error } = await supabase
      .from('guides')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', guideId)
      .select()
      .single();

    if (error) throw error;

    // Track guide edited activity
    if (userId) {
      await trackActivity(userId, ACTIVITY_TYPES.GUIDE_EDITED, {
        guide_id: guideId,
        guide_title: data.title
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating guide:', error);
    res.status(500).json({
      error: 'Failed to update guide',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/guides/:guideId
 * Delete a guide
 */
router.delete('/:guideId', async (req, res) => {
  try {
    const { guideId } = req.params;
    const { userId } = req.query; // Get userId from query params

    // Get guide title before deleting
    const { data: guide } = await supabase
      .from('guides')
      .select('title, user_id')
      .eq('id', guideId)
      .single();

    const { error } = await supabase
      .from('guides')
      .delete()
      .eq('id', guideId);

    if (error) throw error;

    // Track guide deleted activity
    const userIdToTrack = userId || guide?.user_id;
    if (userIdToTrack) {
      await trackActivity(userIdToTrack, ACTIVITY_TYPES.GUIDE_DELETED, {
        guide_id: guideId,
        guide_title: guide?.title || 'Unknown'
      });
    }

    res.json({
      success: true,
      message: 'Guide deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting guide:', error);
    res.status(500).json({
      error: 'Failed to delete guide',
      message: error.message,
    });
  }
});

/**
 * GET /api/guides/stats/:userId
 * Get user statistics
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('guides')
      .select('type, category')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (error) throw error;

    const stats = {
      total: data.length,
      byType: {},
      byCategory: {},
    };

    data.forEach((guide) => {
      stats.byType[guide.type] = (stats.byType[guide.type] || 0) + 1;
      if (guide.category) {
        stats.byCategory[guide.category] = (stats.byCategory[guide.category] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

export default router;
