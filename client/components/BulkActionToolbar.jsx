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
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-blue-900 dark:text-blue-300 font-medium">
            {selectedGuides.size} selected
          </span>

          {onSelectAll && (
            <button
              onClick={onSelectAll}
              className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm"
            >
              Select All
            </button>
          )}

          <button
            onClick={onClearSelection}
            className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm"
          >
            Clear selection
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkDelete}
            disabled={processing || selectedGuides.size === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Deleting...' : `Delete (${selectedGuides.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
