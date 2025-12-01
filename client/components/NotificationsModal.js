'use client';

import { X, Sparkles, Video, Camera, Palette } from 'lucide-react';

const updates = [
  {
    id: 1,
    date: '2024-12-01',
    title: 'Vision AI for TikTok Photo Slides',
    description: 'AI can now read and extract recipes from TikTok photo carousels and slideshows!',
    icon: Camera,
    color: 'bg-pink-100 text-pink-700',
  },
  {
    id: 2,
    date: '2024-12-01',
    title: 'Silent Video Recognition',
    description: 'Cooking videos without voiceover? No problem! AI now analyzes cooking actions visually.',
    icon: Video,
    color: 'bg-purple-100 text-purple-700',
  },
  {
    id: 3,
    date: '2024-12-01',
    title: 'New Garde Logo',
    description: 'Fresh new look with a chef hat icon! Check out the browser tab.',
    icon: Palette,
    color: 'bg-blue-100 text-blue-700',
  },
  {
    id: 4,
    date: '2024-11-30',
    title: 'Improved Yoruba Support',
    description: 'Enhanced accuracy for Yoruba and Nigerian English recipe extraction.',
    icon: Sparkles,
    color: 'bg-green-100 text-green-700',
  },
];

export default function NotificationsModal({ isOpen, onClose }) {
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
          {updates.map((update) => {
            const Icon = update.icon;
            return (
              <div
                key={update.id}
                className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${update.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {update.title}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {update.date}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {update.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
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
