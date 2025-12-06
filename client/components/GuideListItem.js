'use client';

import { useState } from 'react';
import { guidesAPI } from '@/lib/api';
import {
  ChefHat,
  Hammer,
  Book,
  FileQuestion,
  Trash2,
  Clock,
  Users,
  TrendingUp,
  Video,
  ShoppingCart,
  Pin,
} from 'lucide-react';
import GuideDetailModal from './GuideDetailModal';
import ShoppingListSelector from './ShoppingListSelector';

// Utility function to format timestamps as relative time
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const typeIcons = {
  recipe: ChefHat,
  craft: Hammer,
  howto: Book,
  other: FileQuestion,
  unclear: FileQuestion,
};

const typeBadgeColors = {
  recipe: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  craft: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  howto: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  unclear: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const difficultyColors = {
  easy: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  hard: 'text-red-600 dark:text-red-400',
};

export default function GuideListItem({ guide, onDeleted, userId }) {
  const [showDetail, setShowDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showShoppingSelector, setShowShoppingSelector] = useState(false);
  const [isPinned, setIsPinned] = useState(guide.pinned || false);
  const [pinning, setPinning] = useState(false);

  const Icon = typeIcons[guide.type] || FileQuestion;
  const badgeColor = typeBadgeColors[guide.type] || typeBadgeColors.other;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this guide?')) return;

    try {
      setDeleting(true);
      await guidesAPI.delete(guide.id);
      onDeleted();
    } catch (error) {
      console.error('Error deleting guide:', error);
      alert('Failed to delete guide');
    } finally {
      setDeleting(false);
    }
  };

  const handlePin = async (e) => {
    e.stopPropagation();
    try {
      setPinning(true);
      const newPinnedState = !isPinned;
      await guidesAPI.togglePin(guide.id, userId, newPinnedState);
      setIsPinned(newPinnedState);
      onDeleted();
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Failed to toggle pin');
    } finally {
      setPinning(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-4 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-start gap-4">
          {/* Left: Type Icon */}
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${badgeColor} flex-shrink-0`}>
            <Icon size={24} />
          </div>

          {/* Middle: Content */}
          <div className="flex-1 min-w-0">
            {/* Title & Badges */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                  {guide.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${badgeColor} uppercase font-medium`}>
                    {guide.type}
                  </span>
                  {guide.source_url && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <Video size={12} />
                      Video
                    </span>
                  )}
                  {guide.created_at && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(guide.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            {guide.summary && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                {guide.summary}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              {guide.duration && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{guide.duration}</span>
                </div>
              )}
              {guide.servings && (
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{guide.servings}</span>
                </div>
              )}
              {guide.difficulty && (
                <div className={`flex items-center gap-1 ${difficultyColors[guide.difficulty]}`}>
                  <TrendingUp size={14} />
                  <span className="capitalize">{guide.difficulty}</span>
                </div>
              )}
              {guide.ingredients && guide.ingredients.length > 0 && (
                <span>{guide.ingredients.length} items</span>
              )}
              {guide.steps && guide.steps.length > 0 && (
                <span>{guide.steps.length} steps</span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePin}
                disabled={pinning}
                className={`transition disabled:opacity-50 ${isPinned ? 'text-primary-600' : 'text-gray-400 hover:text-primary-600'}`}
                title={isPinned ? 'Unpin guide' : 'Pin guide'}
              >
                <Pin size={16} fill={isPinned ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                title="Delete guide"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {guide.ingredients && guide.ingredients.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShoppingSelector(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition"
              >
                <ShoppingCart size={14} />
                Add
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <GuideDetailModal
          guide={guide}
          userId={userId}
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          onUpdated={onDeleted}
        />
      )}

      {/* Shopping List Selector */}
      {showShoppingSelector && (
        <ShoppingListSelector
          guide={guide}
          userId={userId}
          isOpen={showShoppingSelector}
          onClose={() => setShowShoppingSelector(false)}
        />
      )}
    </>
  );
}
