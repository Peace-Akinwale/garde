import express from 'express';
import { supabase } from '../index.js';

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

    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .eq('id', guideId)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Guide not found' });
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
 * PATCH /api/guides/:guideId
 * Update a guide
 */
router.patch('/:guideId', async (req, res) => {
  try {
    const { guideId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.user_id;
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

    const { error } = await supabase
      .from('guides')
      .delete()
      .eq('id', guideId);

    if (error) throw error;

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
      .eq('user_id', userId);

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
