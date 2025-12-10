// Garde Trash/Recycle Bin Actions
// Handles soft-delete, restore, and permanent delete operations

import { supabase } from '@/lib/supabase';

/**
 * Move a single guide to trash (soft delete)
 * @param {string} guideId - UUID of the guide to delete
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function moveToTrash(guideId) {
  const { data, error } = await supabase
    .rpc('soft_delete_guide', { p_guide_id: guideId });

  if (error) {
    console.error('Error moving guide to trash:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Move multiple guides to trash at once (bulk soft delete)
 * @param {string[]} guideIds - Array of guide UUIDs to delete
 * @returns {Promise<{success: boolean, deleted_count: number, titles: string[], error?: string}>}
 */
export async function bulkMoveToTrash(guideIds) {
  if (!guideIds || guideIds.length === 0) {
    return { success: false, error: 'No guides selected' };
  }

  const { data, error } = await supabase
    .rpc('bulk_soft_delete_guides', { p_guide_ids: guideIds });

  if (error) {
    console.error('Error bulk moving guides to trash:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Restore a single guide from trash
 * @param {string} guideId - UUID of the guide to restore
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function restoreFromTrash(guideId) {
  const { data, error } = await supabase
    .rpc('restore_guide', { p_guide_id: guideId });

  if (error) {
    console.error('Error restoring guide:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Restore multiple guides from trash at once
 * @param {string[]} guideIds - Array of guide UUIDs to restore
 * @returns {Promise<{success: boolean, restored_count: number, titles: string[], error?: string}>}
 */
export async function bulkRestoreFromTrash(guideIds) {
  if (!guideIds || guideIds.length === 0) {
    return { success: false, error: 'No guides selected' };
  }

  const { data, error } = await supabase
    .rpc('bulk_restore_guides', { p_guide_ids: guideIds });

  if (error) {
    console.error('Error bulk restoring guides:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Permanently delete a single guide from trash (cannot be undone)
 * @param {string} guideId - UUID of the guide to permanently delete
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function permanentlyDelete(guideId) {
  const { data, error } = await supabase
    .rpc('permanently_delete_guide', { p_guide_id: guideId });

  if (error) {
    console.error('Error permanently deleting guide:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Permanently delete multiple guides from trash (cannot be undone)
 * @param {string[]} guideIds - Array of guide UUIDs to permanently delete
 * @returns {Promise<{success: boolean, deleted_count: number, titles: string[], error?: string}>}
 */
export async function bulkPermanentlyDelete(guideIds) {
  if (!guideIds || guideIds.length === 0) {
    return { success: false, error: 'No guides selected' };
  }

  const { data, error } = await supabase
    .rpc('bulk_permanently_delete_guides', { p_guide_ids: guideIds });

  if (error) {
    console.error('Error bulk permanently deleting guides:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Empty entire trash (permanently delete all guides in trash)
 * @returns {Promise<{success: boolean, deleted_count: number, error?: string}>}
 */
export async function emptyTrash() {
  const { data, error } = await supabase.rpc('empty_trash');

  if (error) {
    console.error('Error emptying trash:', error);
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Get all guides in trash for current user
 * @returns {Promise<{guides: array, error?: string}>}
 */
export async function getTrashItems() {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false });

  if (error) {
    console.error('Error fetching trash items:', error);
    return { guides: [], error: error.message };
  }

  return { guides: data || [], error: null };
}

/**
 * Get trash summary statistics
 * @returns {Promise<{total_in_trash: number, expiring_soon: number, expiring_today: number, error?: string}>}
 */
export async function getTrashSummary() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .rpc('get_trash_summary', { p_user_id: user.id });

  if (error) {
    console.error('Error fetching trash summary:', error);
    return { error: error.message };
  }

  return data || { total_in_trash: 0, expiring_soon: 0, expiring_today: 0 };
}

/**
 * Calculate days remaining before guide is permanently deleted
 * @param {string} deletedAt - ISO timestamp of when guide was deleted
 * @returns {number} Days remaining (can be negative if expired)
 */
export function getDaysRemaining(deletedAt) {
  if (!deletedAt) return 0;

  const deleted = new Date(deletedAt);
  const expiresAt = new Date(deleted.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

  return daysLeft;
}

/**
 * Check if guide is expiring soon (1 day or less remaining)
 * @param {string} deletedAt - ISO timestamp of when guide was deleted
 * @returns {boolean}
 */
export function isExpiringSoon(deletedAt) {
  return getDaysRemaining(deletedAt) <= 1;
}

/**
 * Format deletion time in human-readable format
 * @param {string} deletedAt - ISO timestamp
 * @returns {string} e.g., "2 days ago"
 */
export function formatDeletedTime(deletedAt) {
  if (!deletedAt) return '';

  const deleted = new Date(deletedAt);
  const now = new Date();
  const diffMs = now - deleted;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'Just now';
  }
}
