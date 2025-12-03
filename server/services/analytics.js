import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key (admin access)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Track user activity
 * @param {string} userId - User ID
 * @param {string} activityType - Type of activity ('login', 'guide_created', 'guide_viewed', etc.)
 * @param {object} activityData - Additional data (guide_id, video_url, etc.)
 */
export const trackActivity = async (userId, activityType, activityData = {}) => {
  try {
    // Skip if no userId provided
    if (!userId) {
      console.log('No userId provided, skipping activity tracking');
      return { success: false, message: 'No userId' };
    }

    // Insert activity
    const { data, error } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData
      });

    if (error) {
      console.error('Failed to track activity:', error);
      return { success: false, error };
    }

    console.log(`✅ Activity tracked: ${activityType} for user ${userId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error tracking activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get analytics for a specific user
 * @param {string} userId - User ID
 */
export const getUserAnalytics = async (userId) => {
  try {
    // Get engagement summary
    const { data: summary, error: summaryError } = await supabase
      .from('user_engagement_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') { // Ignore "not found" error
      console.error('Error fetching engagement summary:', summaryError);
    }

    // Get recent activity (last 50 items)
    const { data: recentActivity, error: activityError } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (activityError) {
      console.error('Error fetching recent activity:', activityError);
    }

    return {
      success: true,
      summary: summary || {
        total_guides: 0,
        total_logins: 0,
        total_videos_processed: 0,
        engagement_score: 0
      },
      recentActivity: recentActivity || []
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get overall platform analytics (admin only)
 */
export const getPlatformAnalytics = async () => {
  try {
    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get active users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeUsers, error: activeError } = await supabase
      .from('user_engagement_summary')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', sevenDaysAgo);

    if (activeError) throw activeError;

    // Get total guides
    const { count: totalGuides, error: guidesError } = await supabase
      .from('guides')
      .select('*', { count: 'exact', head: true });

    if (guidesError) throw guidesError;

    // Get total videos processed
    const { data: videoData, error: videoError } = await supabase
      .from('user_engagement_summary')
      .select('total_videos_processed');

    if (videoError) throw videoError;

    const totalVideosProcessed = videoData?.reduce((sum, user) =>
      sum + (user.total_videos_processed || 0), 0
    ) || 0;

    // Get sign-ups by date (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: signupsData, error: signupsError } = await supabase
      .from('user_signups_log')
      .select('signed_up_at')
      .gte('signed_up_at', thirtyDaysAgo)
      .order('signed_up_at', { ascending: true });

    if (signupsError) throw signupsError;

    // Group sign-ups by date
    const signupsByDate = {};
    signupsData?.forEach(signup => {
      const date = new Date(signup.signed_up_at).toISOString().split('T')[0];
      signupsByDate[date] = (signupsByDate[date] || 0) + 1;
    });

    return {
      success: true,
      analytics: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalGuides: totalGuides || 0,
        totalVideosProcessed,
        signupsByDate
      }
    };
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all users with engagement data (admin dashboard)
 * @param {object} filters - Filter options (search, sortBy, sortOrder, limit, offset)
 */
export const getAllUsersWithEngagement = async (filters = {}) => {
  try {
    const {
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = filters;

    let query = supabase
      .from('profiles')
      .select(`
        *,
        user_engagement_summary (
          total_guides,
          total_logins,
          total_videos_processed,
          last_active_at,
          engagement_score
        )
      `)
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    const { data: users, error, count } = await query;

    if (error) throw error;

    // Calculate activity status for each user
    const usersWithStatus = users?.map(user => {
      const engagement = user.user_engagement_summary;
      const lastActive = engagement?.last_active_at;

      let activityStatus = 'inactive';
      if (lastActive) {
        const daysSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActive <= 7) activityStatus = 'active';
        else if (daysSinceActive <= 30) activityStatus = 'moderate';
      }

      return {
        ...user,
        total_guides: engagement?.total_guides || 0,
        total_logins: engagement?.total_logins || 0,
        total_videos_processed: engagement?.total_videos_processed || 0,
        last_active_at: engagement?.last_active_at || null,
        engagement_score: engagement?.engagement_score || 0,
        activity_status: activityStatus
      };
    });

    return {
      success: true,
      users: usersWithStatus || [],
      total: count
    };
  } catch (error) {
    console.error('Error getting users with engagement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user activity history
 * @param {string} userId - User ID
 * @param {number} limit - Number of activities to fetch
 */
export const getUserActivityHistory = async (userId, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      activities: data || []
    };
  } catch (error) {
    console.error('Error getting user activity history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get recent sign-ups
 * @param {number} limit - Number of sign-ups to fetch
 */
export const getRecentSignups = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('user_signups_log')
      .select('*')
      .order('signed_up_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      signups: data || []
    };
  } catch (error) {
    console.error('Error getting recent sign-ups:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Helper: Activity type constants
 */
export const ACTIVITY_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  GUIDE_CREATED: 'guide_created',
  GUIDE_VIEWED: 'guide_viewed',
  GUIDE_EDITED: 'guide_edited',
  GUIDE_DELETED: 'guide_deleted',
  VIDEO_PROCESSED: 'video_processed',
  SHOPPING_LIST_CREATED: 'shopping_list_created',
  REMINDER_SET: 'reminder_set',
  PROFILE_UPDATED: 'profile_updated'
};
