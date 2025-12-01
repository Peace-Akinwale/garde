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
  processUrl: async (url, userId) => {
    const response = await api.post('/api/video/process-url', { url, userId });
    return response.data;
  },

  /**
   * Process uploaded video file
   */
  processUpload: async (file, userId) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('userId', userId);

    const response = await api.post('/api/video/process-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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

export default api;
