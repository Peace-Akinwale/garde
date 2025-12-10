'use client';

import { useState } from 'react';
import { moveToTrash } from '@/lib/trashActions';

/**
 * GuideCard Component
 * Displays a single guide with checkbox for multi-select
 * and delete functionality
 */
export default function GuideCard({
  guide,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onDelete
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = confirm(
      `Delete "${guide.title}"?\n\nYou can restore it from trash within 7 days.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    const result = await moveToTrash(guide.id);

    if (result.success) {
      if (typeof onDelete === 'function') {
        onDelete(guide.id);
      }
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsDeleting(false);
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox (visible in selection mode) */}
        {isSelectionMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(guide.id)}
            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
        )}

        {/* Guide Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {guide.title}
          </h3>

          {guide.summary && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {guide.summary}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded capitalize">
              {guide.type}
            </span>
            {guide.category && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                {guide.category}
              </span>
            )}
            {guide.difficulty && (
              <span className="px-2 py-1 bg-gray-100 rounded capitalize">
                {guide.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Actions (visible when NOT in selection mode) */}
        {!isSelectionMode && (
          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = `/guides/${guide.id}`}
              className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm"
            >
              View
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition text-sm disabled:opacity-50"
            >
              {isDeleting ? '...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
