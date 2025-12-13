/**
 * Auto-Announcement System
 * Automatically creates announcements when new features are added
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Feature Registry
 * Add new features here and they'll automatically create announcements
 */
const FEATURE_REGISTRY = {
  'password-recovery': {
    title: 'Password Recovery Feature Added',
    description: 'Forgot your password? You can now reset it directly from the login page! Click "Forgot your password?" to get started.',
    icon: 'sparkles',
    color: 'green',
    date: '2025-01-15'
  },
  'show-password-toggle': {
    title: 'Show/Hide Password Toggle',
    description: 'You can now toggle password visibility when logging in or resetting your password. Look for the eye icon!',
    icon: 'video',
    color: 'blue',
    date: '2025-01-15'
  },
  'bulk-delete': {
    title: 'Bulk Delete Guides',
    description: 'You can now select multiple guides and delete them at once! Click "Select" to choose guides, then delete them in bulk. Deleted guides can be restored from trash within 7 days.',
    icon: 'tag',
    color: 'orange',
    date: '2025-01-15'
  },
  'trash-restore': {
    title: 'Trash & Restore Feature',
    description: 'Deleted guides are now moved to trash instead of being permanently deleted. You can restore them within 7 days from the Trash page.',
    icon: 'hammer',
    color: 'purple',
    date: '2025-01-15'
  }
};

/**
 * Check if an announcement for a feature already exists
 */
async function featureAnnouncementExists(featureKey) {
  const feature = FEATURE_REGISTRY[featureKey];
  if (!feature) return false;

  const { data, error } = await supabase
    .from('announcements')
    .select('id')
    .eq('title', feature.title)
    .limit(1)
    .single();

  return !error && data !== null;
}

/**
 * Create an announcement for a feature
 * @param {string} featureKey - Key from FEATURE_REGISTRY
 * @returns {Promise<{success: boolean, announcement?: object, error?: string}>}
 */
export async function createFeatureAnnouncement(featureKey) {
  try {
    const feature = FEATURE_REGISTRY[featureKey];
    
    if (!feature) {
      return {
        success: false,
        error: `Feature "${featureKey}" not found in registry`
      };
    }

    // Check if announcement already exists
    const exists = await featureAnnouncementExists(featureKey);
    if (exists) {
      return {
        success: false,
        error: 'Announcement for this feature already exists'
      };
    }

    // Create the announcement
    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        title: feature.title,
        description: feature.description,
        date: feature.date,
        icon: feature.icon,
        color: feature.color
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating feature announcement:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log(`✅ Auto-created announcement for feature: ${featureKey}`);
    return {
      success: true,
      announcement
    };
  } catch (error) {
    console.error('Error in createFeatureAnnouncement:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create announcements for multiple features
 * @param {string[]} featureKeys - Array of feature keys
 */
export async function createFeatureAnnouncements(featureKeys) {
  const results = [];
  
  for (const key of featureKeys) {
    const result = await createFeatureAnnouncement(key);
    results.push({ featureKey: key, ...result });
  }

  return results;
}

/**
 * Get all available features in the registry
 */
export function getAvailableFeatures() {
  return Object.keys(FEATURE_REGISTRY).map(key => ({
    key,
    ...FEATURE_REGISTRY[key]
  }));
}

/**
 * Auto-create announcements for newly added features
 * Call this after deploying new features
 */
export async function syncFeatureAnnouncements() {
  const featureKeys = Object.keys(FEATURE_REGISTRY);
  const results = await createFeatureAnnouncements(featureKeys);
  
  const created = results.filter(r => r.success).length;
  const skipped = results.filter(r => !r.success && r.error?.includes('already exists')).length;
  const errors = results.filter(r => !r.success && !r.error?.includes('already exists'));

  return {
    total: featureKeys.length,
    created,
    skipped,
    errors: errors.length,
    details: results
  };
}







