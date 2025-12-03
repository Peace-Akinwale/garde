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
   * Process video from URL
   */
  processUrl: async (url, userId, signal = null) => {
    const response = await api.post('/api/video/process-url', { url, userId }, {
      signal,
      timeout: 300000, // 5 minute timeout
    });
    return response.data;
  },

  /**
   * Process uploaded video file
   */
  processUpload: async (file, userId, signal = null) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('userId', userId);

    const response = await api.post('/api/video/process-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal,
      timeout: 300000, // 5 minute timeout
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

export default api;
