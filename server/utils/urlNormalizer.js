/**
 * URL Normalization Utility
 * Normalizes video URLs to a canonical form for cache matching
 */

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url) {
  if (!url) return null;

  // Patterns for different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Normalize YouTube URL to canonical form
 */
function normalizeYouTubeUrl(url) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return url; // Return original if not YouTube

  // Return canonical form: https://www.youtube.com/watch?v=VIDEO_ID
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Normalize TikTok URL (remove query params, fragments)
 */
function normalizeTikTokUrl(url) {
  if (!url.includes('tiktok.com')) return url;

  try {
    const urlObj = new URL(url);
    // Keep only pathname, remove query params and hash
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
  } catch (e) {
    return url; // Return original if parsing fails
  }
}

/**
 * Normalize Instagram URL
 */
function normalizeInstagramUrl(url) {
  if (!url.includes('instagram.com')) return url;

  try {
    const urlObj = new URL(url);
    // Keep only pathname, remove query params and hash
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
  } catch (e) {
    return url;
  }
}

/**
 * Normalize any video URL to canonical form for cache matching
 * @param {string} url - Original URL
 * @returns {string} - Normalized URL
 */
export function normalizeVideoUrl(url) {
  if (!url) return url;

  // YouTube normalization
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return normalizeYouTubeUrl(url);
  }

  // TikTok normalization
  if (url.includes('tiktok.com')) {
    return normalizeTikTokUrl(url);
  }

  // Instagram normalization
  if (url.includes('instagram.com')) {
    return normalizeInstagramUrl(url);
  }

  // For other platforms, remove query params and fragments
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
  } catch (e) {
    return url; // Return original if parsing fails
  }
}

/**
 * Check if two URLs point to the same video
 */
export function urlsMatch(url1, url2) {
  if (!url1 || !url2) return false;
  return normalizeVideoUrl(url1) === normalizeVideoUrl(url2);
}






