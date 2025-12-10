'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import ProfileModal from '@/components/ProfileModal';
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
  const [user, setUser] = useState(null);
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuides, setSelectedGuides] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    checkUser();
    loadTrash();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
      {/* Navigation */}
      <Navigation
        user={user}
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile top padding for fixed menu button */}
        <div className="lg:hidden h-16" />

        {/* Header */}
        <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-16 lg:top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Trash</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {trashItems.length} {trashItems.length === 1 ? 'item' : 'items'}
                {trashItems.length > 0 && ' • Auto-deleted after 7 days'}
              </p>
            </div>

            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              ← Back to Home
            </button>
          </div>

          {/* Action Buttons */}
          {trashItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleSelectionMode}
                className={`px-4 py-2 rounded-lg transition ${
                  isSelectionMode
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {isSelectionMode ? '✓ Cancel Selection' : 'Select Multiple'}
              </button>

              {isSelectionMode && selectedGuides.size > 0 && (
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
      </header>

      {/* Trash Items */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {trashItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🗑️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Trash is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Deleted guides will appear here and be automatically removed after 7 days.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trashItems.map((guide) => {
              const daysLeft = getDaysRemaining(guide.deleted_at);
              const expiringSoon = isExpiringSoon(guide.deleted_at);
              const isSelected = selectedGuides.has(guide.id);

              return (
                <div
                  key={guide.id}
                  className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition p-6 ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  } ${expiringSoon ? 'border-l-4 border-red-500' : ''}`}
                >
                  <div className="flex flex-col h-full">
                    {/* Checkbox (Selection Mode) */}
                    {isSelectionMode && (
                      <div className="mb-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleGuideSelection(guide.id)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Guide Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {guide.title}
                      </h3>

                      {guide.summary && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                          {guide.summary}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded capitalize">
                          {guide.type}
                        </span>
                        {guide.category && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded">
                            {guide.category}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <div>📅 Deleted {formatDeletedTime(guide.deleted_at)}</div>
                        <div className={expiringSoon ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                          {expiringSoon && '⚠️ '}
                          Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (Non-Selection Mode) */}
                    {!isSelectionMode && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <button
                          onClick={() => handleRestore(guide.id)}
                          disabled={processingAction}
                          className="flex-1 px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition text-sm disabled:opacity-50"
                        >
                          Restore
                        </button>

                        <button
                          onClick={() => handlePermanentDelete(guide.id, guide.title)}
                          disabled={processingAction}
                          className="flex-1 px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition text-sm disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Profile Modal */}
      {user && (
        <ProfileModal
          user={user}
          supabase={supabase}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdated={async () => {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
          }}
        />
      )}
      </div>
    </div>
  );
}
