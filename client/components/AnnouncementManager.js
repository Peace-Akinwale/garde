'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { announcementsAPI, autoAnnouncementsAPI } from '@/lib/api';
import { Plus, Edit2, Trash2, X, Save, Sparkles, Video, Camera, Palette, Tag, Hammer, ChefHat, RefreshCw } from 'lucide-react';

const iconMap = {
  camera: Camera,
  video: Video,
  palette: Palette,
  sparkles: Sparkles,
  tag: Tag,
  hammer: Hammer,
  chefhat: ChefHat,
};

const iconOptions = ['sparkles', 'camera', 'video', 'palette', 'tag', 'hammer', 'chefhat'];
const colorOptions = ['blue', 'pink', 'purple', 'green', 'orange', 'red', 'yellow'];

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    icon: 'sparkles',
    color: 'blue'
  });

  useEffect(() => {
    getUserId();
    loadAnnouncements();
  }, []);

  const getUserId = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementsAPI.getAll();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      alert('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert('Please log in to create announcements');
      return;
    }
    try {
      if (editingId) {
        await announcementsAPI.update(editingId, formData, userId);
      } else {
        await announcementsAPI.create(formData, userId);
      }
      await loadAnnouncements();
      resetForm();
    } catch (error) {
      console.error('Error saving announcement:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save announcement';
      alert(errorMessage);
    }
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      description: announcement.description,
      date: new Date(announcement.date).toISOString().split('T')[0],
      icon: announcement.icon || 'sparkles',
      color: announcement.color || 'blue'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    if (!userId) {
      alert('Please log in to delete announcements');
      return;
    }
    
    try {
      await announcementsAPI.delete(id, userId);
      await loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete announcement';
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      icon: 'sparkles',
      color: 'blue'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSyncFeatures = async () => {
    if (!userId) {
      alert('Please log in to sync announcements');
      return;
    }

    if (!confirm('This will create announcements for all new features that don\'t have announcements yet. Continue?')) {
      return;
    }

    try {
      setSyncing(true);
      const result = await autoAnnouncementsAPI.sync(userId);
      
      if (result.created > 0 || result.skipped > 0) {
        await loadAnnouncements();
        alert(`✅ Sync complete!\n\nCreated: ${result.created}\nAlready existed: ${result.skipped}\nErrors: ${result.errors}`);
      } else {
        alert('All feature announcements already exist!');
      }
    } catch (error) {
      console.error('Error syncing announcements:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to sync announcements';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage in-app notifications for new features and updates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncFeatures}
            disabled={syncing || !userId}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Auto-create announcements for new features"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Features'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
          >
            <Plus size={18} />
            New Announcement
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  required
                  placeholder="e.g., New Password Recovery Feature"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  required
                  placeholder="Describe the new feature or update..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {iconOptions.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {colorOptions.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                  <Save size={18} />
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No announcements yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {announcements.map((announcement) => {
              const Icon = iconMap[announcement.icon?.toLowerCase()] || Sparkles;
              const colorClass = `bg-${announcement.color || 'blue'}-100 text-${announcement.color || 'blue'}-700 dark:bg-${announcement.color || 'blue'}-900/30 dark:text-${announcement.color || 'blue'}-400`;

              return (
                <div key={announcement.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${colorClass}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {announcement.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(announcement.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <button
                            onClick={() => handleEdit(announcement)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(announcement.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {announcement.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

