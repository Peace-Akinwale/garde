import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/shopping/:userId
 * Get all shopping lists for a user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: lists, error } = await supabase
      .from('shopping_lists')
      .select(`
        *,
        shopping_list_guides (
          guide_id,
          added_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: lists || []
    });
  } catch (error) {
    console.error('Error fetching shopping lists:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/shopping
 * Create a new shopping list
 * Body: { userId, name, items?, guideIds? }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, name, items = [], guideIds = [] } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        error: 'userId and name are required'
      });
    }

    // Create shopping list
    const { data: newList, error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: userId,
        name,
        items
      })
      .select()
      .single();

    if (listError) throw listError;

    // If guide IDs provided, link them
    if (guideIds.length > 0) {
      const guideLinks = guideIds.map(guideId => ({
        shopping_list_id: newList.id,
        guide_id: guideId
      }));

      const { error: linkError } = await supabase
        .from('shopping_list_guides')
        .insert(guideLinks);

      if (linkError) {
        console.error('Error linking guides:', linkError);
        // Don't fail the request if linking fails
      }
    }

    res.json({
      success: true,
      data: newList
    });
  } catch (error) {
    console.error('Error creating shopping list:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/shopping/from-guide
 * Create shopping list from a guide's ingredients
 * Body: { userId, guideId, listName? }
 */
router.post('/from-guide', async (req, res) => {
  try {
    const { userId, guideId, listName } = req.body;

    if (!userId || !guideId) {
      return res.status(400).json({
        success: false,
        error: 'userId and guideId are required'
      });
    }

    // Fetch the guide
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .select('title, ingredients')
      .eq('id', guideId)
      .single();

    if (guideError) throw guideError;

    if (!guide) {
      return res.status(404).json({
        success: false,
        error: 'Guide not found'
      });
    }

    // Convert ingredients array to shopping list items
    const items = (guide.ingredients || []).map(ingredient => ({
      id: uuidv4(),
      name: ingredient,
      quantity: '',
      category: 'Uncategorized',
      checked: false,
      source: guideId
    }));

    // Create shopping list
    const name = listName || `${guide.title} - Shopping List`;
    const { data: newList, error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: userId,
        name,
        items
      })
      .select()
      .single();

    if (listError) throw listError;

    // Link the guide
    const { error: linkError } = await supabase
      .from('shopping_list_guides')
      .insert({
        shopping_list_id: newList.id,
        guide_id: guideId
      });

    if (linkError) {
      console.error('Error linking guide:', linkError);
    }

    res.json({
      success: true,
      data: newList
    });
  } catch (error) {
    console.error('Error creating shopping list from guide:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/shopping/:listId
 * Update a shopping list
 * Body: { name?, items? }
 */
router.patch('/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    const { name, items } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (items !== undefined) updates.items = items;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }

    const { data: updatedList, error } = await supabase
      .from('shopping_lists')
      .update(updates)
      .eq('id', listId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: updatedList
    });
  } catch (error) {
    console.error('Error updating shopping list:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/shopping/:listId
 * Delete a shopping list
 */
router.delete('/:listId', async (req, res) => {
  try {
    const { listId } = req.params;

    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Shopping list deleted'
    });
  } catch (error) {
    console.error('Error deleting shopping list:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/shopping/:listId/guides/:guideId
 * Add a guide's ingredients to an existing shopping list
 */
router.post('/:listId/guides/:guideId', async (req, res) => {
  try {
    const { listId, guideId } = req.params;

    // Fetch the guide
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .select('ingredients')
      .eq('id', guideId)
      .single();

    if (guideError) throw guideError;

    // Fetch current shopping list
    const { data: list, error: listError } = await supabase
      .from('shopping_lists')
      .select('items')
      .eq('id', listId)
      .single();

    if (listError) throw listError;

    // Convert ingredients to items
    const newItems = (guide.ingredients || []).map(ingredient => ({
      id: uuidv4(),
      name: ingredient,
      quantity: '',
      category: 'Uncategorized',
      checked: false,
      source: guideId
    }));

    // Merge with existing items
    const updatedItems = [...(list.items || []), ...newItems];

    // Update shopping list
    const { data: updatedList, error: updateError } = await supabase
      .from('shopping_lists')
      .update({ items: updatedItems })
      .eq('id', listId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Link the guide
    const { error: linkError } = await supabase
      .from('shopping_list_guides')
      .insert({
        shopping_list_id: listId,
        guide_id: guideId
      });

    if (linkError && linkError.code !== '23505') { // Ignore duplicate key error
      console.error('Error linking guide:', linkError);
    }

    res.json({
      success: true,
      data: updatedList
    });
  } catch (error) {
    console.error('Error adding guide to shopping list:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
