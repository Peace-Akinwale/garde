import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  getPlatformAnalytics,
  getAllUsersWithEngagement,
  getUserActivityHistory,
  getRecentSignups
} from '../services/analytics.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware to check if user is admin
 */
const checkAdmin = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required'
      });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error || !profile || !profile.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Admin access required'
      });
    }

    req.adminUserId = userId;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify admin status'
    });
  }
};

/**
 * GET /api/admin/dashboard
 * Get overview analytics for admin dashboard
 */
router.get('/dashboard', checkAdmin, async (req, res) => {
  try {
    const analytics = await getPlatformAnalytics();

    if (!analytics.success) {
      throw new Error(analytics.error);
    }

    res.json({
      success: true,
      data: analytics.analytics
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with engagement data
 * Query params: search, sortBy, sortOrder, limit, offset
 */
router.get('/users', checkAdmin, async (req, res) => {
  try {
    const {
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = req.query;

    const result = await getAllUsersWithEngagement({
      search,
      sortBy,
      sortOrder,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      data: result.users,
      total: result.total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/activity/:userId
 * Get activity history for a specific user
 */
router.get('/activity/:userId', checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const result = await getUserActivityHistory(userId, parseInt(limit));

    if (!result.success) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      data: result.activities
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/signups
 * Get recent sign-ups
 */
router.get('/signups', checkAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const result = await getRecentSignups(parseInt(limit));

    if (!result.success) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      data: result.signups
    });
  } catch (error) {
    console.error('Error fetching signups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sign-ups',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/user/:userId
 * Get detailed info for a specific user
 */
router.get('/user/:userId', checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Get engagement summary
    const { data: engagement, error: engagementError } = await supabase
      .from('user_engagement_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (engagementError && engagementError.code !== 'PGRST116') {
      throw engagementError;
    }

    // Get guides count
    const { count: guidesCount, error: guidesError } = await supabase
      .from('guides')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (guidesError) throw guidesError;

    // Get recent activity
    const activityResult = await getUserActivityHistory(userId, 20);

    res.json({
      success: true,
      data: {
        profile,
        engagement: engagement || {
          total_guides: guidesCount || 0,
          total_logins: 0,
          total_videos_processed: 0,
          engagement_score: 0
        },
        recentActivity: activityResult.activities || []
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user details',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/test-email
 * Test email configuration (admin only)
 */
router.post('/test-email', checkAdmin, async (req, res) => {
  try {
    const { sendTestEmail } = await import('../services/emailNotifications.js');
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address required'
      });
    }

    const result = await sendTestEmail(email);

    res.json(result);
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      message: error.message
    });
  }
});

export default router;
