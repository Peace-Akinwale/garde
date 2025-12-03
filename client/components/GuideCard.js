'use client';

import { useState } from 'react';
import { guidesAPI } from '@/lib/api';
import {
  ChefHat,
  Hammer,
  Book,
  FileQuestion,
  Trash2,
  Edit,
  Clock,
  Users,
  TrendingUp,
  Video,
  ShoppingCart,
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

const typeColors = {
  recipe: 'border-orange-200',
  craft: 'border-purple-200',
  howto: 'border-blue-200',
  other: 'border-gray-200',
  unclear: 'border-gray-200',
};

const typeBadgeColors = {
  recipe: 'bg-orange-100 text-orange-700',
  craft: 'bg-purple-100 text-purple-700',
  howto: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-700',
  unclear: 'bg-gray-100 text-gray-700',
};

const difficultyColors = {
  easy: 'text-green-600',
  medium: 'text-yellow-600',
  hard: 'text-red-600',
};

export default function GuideCard({ guide, onDeleted, userId }) {
  const [showDetail, setShowDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showShoppingSelector, setShowShoppingSelector] = useState(false);

  const Icon = typeIcons[guide.type] || FileQuestion;
  const cardBorderColor = typeColors[guide.type] || typeColors.other;
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

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className={`bg-white dark:bg-slate-700 rounded-lg border-2 ${cardBorderColor} dark:border-slate-600 p-5 cursor-pointer card-hover relative overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${badgeColor}`}>
              <Icon size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">
                {guide.type}
              </span>
            </div>
            {guide.source_url && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-700" title="Has video">
                <Video size={14} />
              </div>
            )}
            {guide.created_at && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-600 dark:bg-slate-600 dark:text-gray-300 text-xs"
                title={new Date(guide.created_at).toLocaleString()}
              >
                <Clock size={12} />
                <span>{formatTimeAgo(guide.created_at)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {guide.ingredients && guide.ingredients.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShoppingSelector(true);
                }}
                className="text-gray-400 hover:text-primary-500 transition"
                title="Add to shopping list"
              >
                <ShoppingCart size={16} />
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
              title="Delete guide"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-snug">
          {guide.title}
        </h3>

        {/* Summary */}
        {guide.summary && (
          <p className="text-sm text-gray-600 dark:text-gray-200 mb-4 line-clamp-3 leading-relaxed">
            {guide.summary}
          </p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
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
        </div>

        {/* Ingredients Count */}
        {guide.ingredients && guide.ingredients.length > 0 && (
          <div className="text-xs text-gray-500">
            {guide.ingredients.length} ingredient{guide.ingredients.length !== 1 ? 's' : ''}
            {guide.steps && guide.steps.length > 0 && (
              <span> • {guide.steps.length} step{guide.steps.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}

        {/* Language & Category */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
          {guide.language && (
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              {guide.language === 'yo' ? 'Yoruba' : guide.language.toUpperCase()}
            </span>
          )}
          {guide.category && (
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 truncate">
              {guide.category}
            </span>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <GuideDetailModal
          guide={guide}
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
