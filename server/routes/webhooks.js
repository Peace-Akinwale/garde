import express from 'express';
import dotenv from 'dotenv';
import { sendSignupNotification } from '../services/emailNotifications.js';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/webhooks/user-signup
 * Handle new user sign-up notifications
 * This can be called manually or via Supabase webhook
 */
router.post('/user-signup', async (req, res) => {
  try {
    const { user_id, email, full_name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Send email notification to admin
    const result = await sendSignupNotification(email, full_name);

    // Update signup log to mark notification as sent
    if (result.success && user_id) {
      await supabase
        .from('user_signups_log')
        .update({ notification_sent: true })
        .eq('user_id', user_id);
    }

    res.json({
      success: true,
      message: 'Sign-up notification processed',
      emailSent: result.success
    });
  } catch (error) {
    console.error('Error processing signup webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/webhooks/pending-signups
 * Get sign-ups that haven't had notification sent yet
 * Can be used for batch processing if real-time webhooks fail
 */
router.get('/pending-signups', async (req, res) => {
  try {
    const { data: pendingSignups, error } = await supabase
      .from('user_signups_log')
      .select('*')
      .eq('notification_sent', false)
      .order('signed_up_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: pendingSignups?.length || 0,
      signups: pendingSignups || []
    });
  } catch (error) {
    console.error('Error fetching pending signups:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/webhooks/process-pending
 * Process all pending sign-up notifications
 */
router.post('/process-pending', async (req, res) => {
  try {
    const { data: pendingSignups, error } = await supabase
      .from('user_signups_log')
      .select('*')
      .eq('notification_sent', false)
      .order('signed_up_at', { ascending: true });

    if (error) throw error;

    if (!pendingSignups || pendingSignups.length === 0) {
      return res.json({
        success: true,
        message: 'No pending sign-ups to process',
        processed: 0
      });
    }

    let successCount = 0;
    let failCount = 0;

    // Process each pending signup
    for (const signup of pendingSignups) {
      const result = await sendSignupNotification(signup.email, signup.full_name);

      if (result.success) {
        // Mark as sent
        await supabase
          .from('user_signups_log')
          .update({ notification_sent: true })
          .eq('id', signup.id);
        successCount++;
      } else {
        failCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.json({
      success: true,
      message: `Processed ${successCount + failCount} sign-ups`,
      successCount,
      failCount
    });
  } catch (error) {
    console.error('Error processing pending signups:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
