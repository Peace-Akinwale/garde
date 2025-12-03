import express from 'express';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * GET /api/reminders/:userId
 * Get all reminders for a user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('reminders')
      .select(`
        *,
        guides (
          id,
          title,
          type
        )
      `)
      .eq('user_id', userId)
      .order('scheduled_for', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/reminders
 * Create a new reminder
 */
router.post('/', async (req, res) => {
  try {
    const { userId, guideId, reminderType, scheduledFor, title, message } = req.body;

    if (!userId || !guideId || !reminderType || !scheduledFor || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        guide_id: guideId,
        reminder_type: reminderType,
        scheduled_for: scheduledFor,
        title,
        message: message || null
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/reminders/:reminderId
 * Delete a reminder
 */
router.delete('/:reminderId', async (req, res) => {
  try {
    const { reminderId } = req.params;

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/reminders/push/subscribe
 * Subscribe to push notifications
 */
router.post('/push/subscribe', async (req, res) => {
  try {
    const { userId, subscription, userAgent } = req.body;

    if (!userId || !subscription) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or subscription'
      });
    }

    // Store subscription in database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        subscription_data: subscription,
        user_agent: userAgent || null
      })
      .select()
      .single();

    if (error) {
      // If duplicate, update instead
      if (error.code === '23505') {
        const { data: updateData, error: updateError } = await supabase
          .from('push_subscriptions')
          .update({
            subscription_data: subscription,
            user_agent: userAgent || null
          })
          .eq('user_id', userId)
          .eq('subscription_data->endpoint', subscription.endpoint)
          .select()
          .single();

        if (updateError) throw updateError;
        return res.json({ success: true, data: updateData });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/reminders/push/unsubscribe
 * Unsubscribe from push notifications
 */
router.post('/push/unsubscribe', async (req, res) => {
  try {
    const { userId, endpoint } = req.body;

    if (!userId || !endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or endpoint'
      });
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('subscription_data->endpoint', endpoint);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
