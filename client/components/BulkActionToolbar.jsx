'use client';

import { useState } from 'react';
import { bulkMoveToTrash } from '@/lib/trashActions';

/**
 * BulkActionToolbar Component
 * Displays at the top of guides page when in selection mode
 * Allows bulk delete/actions on multiple guides
 */
export default function BulkActionToolbar({
  selectedGuides,
  onClearSelection,
  onActionComplete,
  onSelectAll,
  totalGuides
}) {
  const [processing, setProcessing] = useState(false);

  async function handleBulkDelete() {
    if (selectedGuides.size === 0) {
      alert('Please select guides to delete');
      return;
    }

    const confirmed = confirm(
      `Delete ${selectedGuides.size} guide(s)?\n\nYou can restore them from trash within 7 days.`
    );

    if (!confirmed) return;

    setProcessing(true);
    const guideIds = Array.from(selectedGuides);
    const result = await bulkMoveToTrash(guideIds);

    if (result.success) {
      alert(`✅ Deleted ${result.deleted_count} guide(s)`);
      onActionComplete();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
    setProcessing(false);
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-3 sm:px-6 py-2.5 sm:py-4">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: Stack vertically */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <span className="text-blue-900 dark:text-blue-300 font-medium text-sm sm:text-base">
              {selectedGuides.size} selected
            </span>

            <div className="flex items-center gap-2 sm:gap-3">
              {onSelectAll && (
                <button
                  onClick={onSelectAll}
                  className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-xs sm:text-sm px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                >
                  Select All
                </button>
              )}

              <button
                onClick={onClearSelection}
                className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-xs sm:text-sm px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleBulkDelete}
              disabled={processing || selectedGuides.size === 0}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-initial"
            >
              {processing ? 'Deleting...' : `Delete ${selectedGuides.size > 0 ? `(${selectedGuides.size})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
