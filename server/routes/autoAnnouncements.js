import express from 'express';
import { 
  createFeatureAnnouncement, 
  createFeatureAnnouncements,
  syncFeatureAnnouncements,
  getAvailableFeatures
} from '../services/autoAnnouncements.js';
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
    let userId = req.headers['x-user-id'] || req.body.userId;

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

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error || !profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUserId = userId;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

/**
 * GET /api/auto-announcements/features
 * Get list of available features that can auto-create announcements
 */
router.get('/features', checkAdmin, (req, res) => {
  try {
    const features = getAvailableFeatures();
    res.json({ features });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get features' });
  }
});

/**
 * POST /api/auto-announcements/create
 * Create announcement for a specific feature
 * Body: { featureKey: 'password-recovery' }
 */
router.post('/create', checkAdmin, async (req, res) => {
  try {
    const { featureKey } = req.body;

    if (!featureKey) {
      return res.status(400).json({ error: 'featureKey is required' });
    }

    const result = await createFeatureAnnouncement(featureKey);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

/**
 * POST /api/auto-announcements/sync
 * Sync all features - creates announcements for any missing ones
 */
router.post('/sync', checkAdmin, async (req, res) => {
  try {
    const result = await syncFeatureAnnouncements();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync announcements' });
  }
});

export default router;

