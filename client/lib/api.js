import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const videoAPI = {
  /**
   * Submit video URL for background processing
   * Returns immediately with job ID - user can close browser!
   */
  processUrl: async (url, userId) => {
    const response = await api.post('/api/video/process-url', { url, userId }, {
      timeout: 30000, // 30 second timeout (just for job creation)
    });
    return response.data;
  },

  /**
   * Upload video file for background processing
   * Returns immediately with job ID
   */
  processUpload: async (file, userId) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('userId', userId);

    const response = await api.post('/api/video/process-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 second timeout (for file upload)
    });
    return response.data;
  },

  /**
   * Get status of a processing job
   * Poll this endpoint to check progress
   */
  getJobStatus: async (jobId, userId) => {
    const response = await api.get(`/api/video/job/${jobId}?userId=${userId}`, {
      timeout: 10000, // 10 second timeout
    });
    return response.data;
  },

  /**
   * Get all jobs for a user (job history)
   */
  getUserJobs: async (userId, limit = 20, offset = 0) => {
    const response = await api.get(`/api/video/jobs?userId=${userId}&limit=${limit}&offset=${offset}`, {
      timeout: 10000,
    });
    return response.data;
  },
};

export const articleAPI = {
  /**
   * Process article URL and extract guide
   * Returns immediately with processed guide (faster than video)
   */
  processUrl: async (url, userId) => {
    const response = await api.post('/api/article/process', { url, userId }, {
      timeout: 60000, // 60 second timeout (article processing is faster than video)
    });
    return response.data;
  },
};

export const guidesAPI = {
  /**
   * Get all guides for a user
   */
  getAll: async (userId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);

    const response = await api.get(`/api/guides/${userId}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single guide by ID
   */
  getById: async (guideId) => {
    const response = await api.get(`/api/guides/detail/${guideId}`);
    return response.data;
  },

  /**
   * Create new guide
   */
  create: async (guideData) => {
    const response = await api.post('/api/guides', guideData);
    return response.data;
  },

  /**
   * Update guide
   */
  update: async (guideId, updates) => {
    const response = await api.patch(`/api/guides/${guideId}`, updates);
    return response.data;
  },

  /**
   * Delete guide
   */
  delete: async (guideId) => {
    const response = await api.delete(`/api/guides/${guideId}`);
    return response.data;
    },

    /**
   * Toggle pin status for a guide
    */
    togglePin: async (guideId, userId, pinned) => {
      const response = await api.patch(`/api/guides/${guideId}/pin`, { userId, pinned });
      return response.data;
    },

    /**
     * Get user statistics
     */
    getStats: async (userId) => {
      const response = await api.get(`/api/guides/stats/${userId}`);
      return response.data;
    },
};

export const shoppingAPI = {
  /**
   * Get all shopping lists for a user
   */
  getAll: async (userId) => {
    const response = await api.get(`/api/shopping/${userId}`);
    return response.data;
  },

  /**
   * Create new shopping list
   */
  create: async (userId, name, items = [], guideIds = []) => {
    const response = await api.post('/api/shopping', { userId, name, items, guideIds });
    return response.data;
  },

  /**
   * Create shopping list from a guide's ingredients
   */
  createFromGuide: async (userId, guideId, listName = null) => {
    const response = await api.post('/api/shopping/from-guide', { userId, guideId, listName });
    return response.data;
  },

  /**
   * Update shopping list
   */
  update: async (listId, updates) => {
    const response = await api.patch(`/api/shopping/${listId}`, updates);
    return response.data;
  },

  /**
   * Delete shopping list
   */
  delete: async (listId) => {
    const response = await api.delete(`/api/shopping/${listId}`);
    return response.data;
  },

  /**
   * Add a guide's ingredients to existing shopping list
   */
  addGuideToList: async (listId, guideId) => {
    const response = await api.post(`/api/shopping/${listId}/guides/${guideId}`);
    return response.data;
  },
};

export const adminAPI = {
  /**
   * Get admin dashboard analytics
   */
  getDashboard: async (userId) => {
    const response = await api.get('/api/admin/dashboard', {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  },

  /**
   * Get all users with engagement data
   */
  getUsers: async (userId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await api.get(`/api/admin/users?${params.toString()}`, {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  },

  /**
   * Get user activity history
   */
  getUserActivity: async (userId, targetUserId, limit = 100) => {
    const response = await api.get(`/api/admin/activity/${targetUserId}?limit=${limit}`, {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  },

  /**
   * Get recent sign-ups
   */
  getSignups: async (userId, limit = 20) => {
    const response = await api.get(`/api/admin/signups?limit=${limit}`, {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  },

  /**
   * Get detailed user info
   */
  getUserDetails: async (userId, targetUserId) => {
    const response = await api.get(`/api/admin/user/${targetUserId}`, {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  },
};

export const remindersAPI = {
  /**
   * Get all reminders for a user
   */
  getAll: async (userId) => {
    const response = await api.get(`/api/reminders/${userId}`);
    return response.data;
  },

  /**
   * Create a new reminder
   */
  create: async (userId, guideId, reminderType, scheduledFor, title, message = null) => {
    const response = await api.post('/api/reminders', {
      userId,
      guideId,
      reminderType,
      scheduledFor,
      title,
      message
    });
    return response.data;
  },

  /**
   * Delete a reminder
   */
  delete: async (reminderId) => {
    const response = await api.delete(`/api/reminders/${reminderId}`);
    return response.data;
  },

  /**
   * Subscribe to push notifications
   */
  subscribePush: async (userId, subscription, userAgent = null) => {
    const response = await api.post('/api/reminders/push/subscribe', {
      userId,
      subscription,
      userAgent
    });
    return response.data;
  },

  /**
   * Unsubscribe from push notifications
   */
  unsubscribePush: async (userId, endpoint) => {
    const response = await api.post('/api/reminders/push/unsubscribe', {
      userId,
      endpoint
    });
    return response.data;
  },
};


export const announcementsAPI = {
  /**
   * Get all announcements
   */
  getAll: async () => {
    const response = await api.get('/api/announcements');
    return response.data;
  },
};

export default api;
