'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Video, Camera, Palette, Tag, Hammer, ChefHat, Loader } from 'lucide-react';
import { announcementsAPI } from '@/lib/api';

// Icon mapping
const iconMap = {
  camera: Camera,
  video: Video,
  palette: Palette,
  sparkles: Sparkles,
  tag: Tag,
  hammer: Hammer,
  chefhat: ChefHat,
};

// Color mapping
const colorMap = {
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function NotificationsModal({ isOpen, onClose }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
      // Mark as viewed in localStorage
      localStorage.setItem('lastViewedAnnouncements', new Date().toISOString());
    }
  }, [isOpen]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementsAPI.getAll();
      setAnnouncements(data.announcements || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What's New</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Latest updates and improvements to Garde
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Updates List */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-primary-600" size={32} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchAnnouncements}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Retry
              </button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No announcements yet</p>
            </div>
          ) : (
            announcements.map((update) => {
              const Icon = iconMap[update.icon.toLowerCase()] || Sparkles;
              const colorClass = colorMap[update.color.toLowerCase()] || colorMap.blue;

              return (
                <div
                  key={update.id}
                  className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${colorClass}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {update.title}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(update.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {update.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600 p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            More updates coming soon! Follow our progress on GitHub.
          </p>
        </div>
      </div>
    </div>
  );
}
