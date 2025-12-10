'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getTrashItems,
  restoreFromTrash,
  permanentlyDelete,
  bulkRestoreFromTrash,
  bulkPermanentlyDelete,
  emptyTrash,
  getDaysRemaining,
  isExpiringSoon,
  formatDeletedTime
} from '@/lib/trashActions';

export default function TrashPage() {
  const router = useRouter();
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuides, setSelectedGuides] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    loadTrash();
  }, []);

  async function loadTrash() {
    setLoading(true);
    const { guides, error } = await getTrashItems();
    if (error) {
      console.error('Error loading trash:', error);
    }
    setTrashItems(guides);
    setLoading(false);
  }

  // Toggle selection mode
  function toggleSelectionMode() {
    setIsSelectionMode(!isSelectionMode);
    setSelectedGuides(new Set()); // Clear selection when toggling
  }

  // Toggle individual guide selection
  function toggleGuideSelection(guideId) {
    const newSelection = new Set(selectedGuides);
    if (newSelection.has(guideId)) {
      newSelection.delete(guideId);
    } else {
      newSelection.add(guideId);
    }
    setSelectedGuides(newSelection);
  }

  // Select all guides
  function selectAll() {
    const allIds = trashItems.map(guide => guide.id);
    setSelectedGuides(new Set(allIds));
  }

  // Deselect all guides
  function deselectAll() {
    setSelectedGuides(new Set());
  }

  // Single guide restore
  async function handleRestore(guideId) {
    setProcessingAction(true);
    const result = await restoreFromTrash(guideId);

    if (result.success) {
      await loadTrash();
      alert(`✅ "${result.title}" restored successfully!`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
    setProcessingAction(false);
  }

  // Bulk restore
  async function handleBulkRestore() {
    if (selectedGuides.size === 0) {
      alert('Please select guides to restore');
      return;
    }

    setProcessingAction(true);
    const guideIds = Array.from(selectedGuides);
    const result = await bulkRestoreFromTrash(guideIds);

    if (result.success) {
      await loadTrash();
      setSelectedGuides(new Set());
      setIsSelectionMode(false);
      alert(`✅ Restored ${result.restored_count} guide(s)`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
    setProcessingAction(false);
  }

  // Single guide permanent delete
  async function handlePermanentDelete(guideId, guideTitle) {
    const confirmed = confirm(
      `⚠️ Are you sure you want to permanently delete "${guideTitle}"?\n\nThis action CANNOT be undone!`
    );

    if (!confirmed) return;

    setProcessingAction(true);
    const result = await permanentlyDelete(guideId);

    if (result.success) {
      await loadTrash();
      alert(`🗑️ "${result.title}" permanently deleted`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
    setProcessingAction(false);
  }

  // Bulk permanent delete
  async function handleBulkPermanentDelete() {
    if (selectedGuides.size === 0) {
      alert('Please select guides to delete');
      return;
    }

    const confirmed = confirm(
      `⚠️ Are you sure you want to permanently delete ${selectedGuides.size} guide(s)?\n\nThis action CANNOT be undone!`
    );

    if (!confirmed) return;

    setProcessingAction(true);
    const guideIds = Array.from(selectedGuides);
    const result = await bulkPermanentlyDelete(guideIds);

    if (result.success) {
      await loadTrash();
      setSelectedGuides(new Set());
      setIsSelectionMode(false);
      alert(`🗑️ Permanently deleted ${result.deleted_count} guide(s)`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
    setProcessingAction(false);
  }

  // Empty entire trash
  async function handleEmptyTrash() {
    if (trashItems.length === 0) {
      alert('Trash is already empty');
      return;
    }

    const confirmed = confirm(
      `⚠️ Are you sure you want to empty the entire trash?\n\nThis will permanently delete ALL ${trashItems.length} guide(s) in trash.\n\nThis action CANNOT be undone!`
    );

    if (!confirmed) return;

    setProcessingAction(true);
    const result = await emptyTrash();

    if (result.success) {
      await loadTrash();
      alert(`🗑️ Trash emptied! Deleted ${result.deleted_count} guide(s)`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
    setProcessingAction(false);
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading trash...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              🗑️ Trash
            </h1>
            <p className="text-gray-600 mt-2">
              {trashItems.length} {trashItems.length === 1 ? 'item' : 'items'}
              {trashItems.length > 0 && ' • Auto-deleted after 7 days'}
            </p>
          </div>

          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            ← Back to Home
          </button>
        </div>

        {/* Action Buttons */}
        {trashItems.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={toggleSelectionMode}
              className={`px-4 py-2 rounded-lg transition ${
                isSelectionMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isSelectionMode ? '✓ Selection Mode' : 'Select Multiple'}
            </button>

            {isSelectionMode && (
              <>
                <button
                  onClick={selectAll}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  Select All
                </button>

                <button
                  onClick={deselectAll}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  Deselect All
                </button>

                {selectedGuides.size > 0 && (
                  <>
                    <button
                      onClick={handleBulkRestore}
                      disabled={processingAction}
                      className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition disabled:opacity-50"
                    >
                      Restore ({selectedGuides.size})
                    </button>

                    <button
                      onClick={handleBulkPermanentDelete}
                      disabled={processingAction}
                      className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                    >
                      Delete Forever ({selectedGuides.size})
                    </button>
                  </>
                )}
              </>
            )}

            {!isSelectionMode && (
              <button
                onClick={handleEmptyTrash}
                disabled={processingAction}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition disabled:opacity-50 ml-auto"
              >
                Empty Trash
              </button>
            )}
          </div>
        )}
      </div>

      {/* Trash Items */}
      <div className="max-w-6xl mx-auto">
        {trashItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🗑️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Trash is empty
            </h2>
            <p className="text-gray-600">
              Deleted guides will appear here and be automatically removed after 7 days.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {trashItems.map((guide) => {
              const daysLeft = getDaysRemaining(guide.deleted_at);
              const expiringSoon = isExpiringSoon(guide.deleted_at);
              const isSelected = selectedGuides.has(guide.id);

              return (
                <div
                  key={guide.id}
                  className={`bg-white rounded-lg shadow-sm p-6 transition ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  } ${expiringSoon ? 'border-l-4 border-red-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Checkbox (Selection Mode) */}
                    {isSelectionMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleGuideSelection(guide.id)}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    )}

                    {/* Guide Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {guide.title}
                      </h3>

                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span>📅 Deleted {formatDeletedTime(guide.deleted_at)}</span>
                        <span className={expiringSoon ? 'text-red-600 font-semibold' : ''}>
                          {expiringSoon && '⚠️ '}
                          Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="capitalize">{guide.type}</span>
                        {guide.category && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{guide.category}</span>
                          </>
                        )}
                      </div>

                      {guide.summary && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {guide.summary}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons (Non-Selection Mode) */}
                    {!isSelectionMode && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestore(guide.id)}
                          disabled={processingAction}
                          className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition text-sm disabled:opacity-50"
                        >
                          Restore
                        </button>

                        <button
                          onClick={() => handlePermanentDelete(guide.id, guide.title)}
                          disabled={processingAction}
                          className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition text-sm disabled:opacity-50"
                        >
                          Delete Forever
                        </button>
                      </div>
                    )}
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
