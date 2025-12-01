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
} from 'lucide-react';
import GuideDetailModal from './GuideDetailModal';

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

export default function GuideCard({ guide, onDeleted }) {
  const [showDetail, setShowDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        className={`bg-white rounded-lg border-2 ${cardBorderColor} p-4 cursor-pointer card-hover relative overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${badgeColor}`}>
            <Icon size={16} />
            <span className="text-xs font-medium uppercase tracking-wide">
              {guide.type}
            </span>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
            title="Delete guide"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {guide.title}
        </h3>

        {/* Summary */}
        {guide.summary && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3 leading-relaxed">
            {guide.summary}
          </p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
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
    </>
  );
}
