'use client';

import { useState, useEffect, useRef } from 'react';
import { shoppingAPI } from '@/lib/api';
import { X, Plus, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from './Toast';

// Cache shopping lists to avoid refetching
let listsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

export default function ShoppingListSelector({ isOpen, onClose, guide, userId }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toasts, showToast, removeToast } = useToast();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (isOpen && userId && !loadedRef.current) {
      loadLists();
      loadedRef.current = true;
    }
    if (!isOpen) {
      loadedRef.current = false;
    }
  }, [isOpen, userId]);

  const loadLists = async () => {
    try {
      // Check cache first
      const now = Date.now();
      if (listsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        setLists(listsCache);
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await shoppingAPI.getAll(userId);
      const data = response.data || [];
      setLists(data);

      // Update cache
      listsCache = data;
      cacheTimestamp = now;
    } catch (error) {
      console.error('Error loading lists:', error);
      showToast('Failed to load shopping lists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = () => {
    listsCache = null;
    cacheTimestamp = 0;
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) return;

    const listName = newListName.trim();
    setCreating(true);

    try {
      await shoppingAPI.createFromGuide(userId, guide.id, listName);
      invalidateCache(); // Clear cache so next load gets fresh data
      showToast(`Added ${guide.ingredients?.length || 0} items to "${listName}"`, 'success');
      setTimeout(onClose, 500); // Small delay to show toast
    } catch (error) {
      console.error('Error creating list:', error);
      showToast('Failed to create shopping list', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleAddToList = async (list) => {
    setAdding(list.id);

    try {
      await shoppingAPI.addGuideToList(list.id, guide.id);
      invalidateCache(); // Clear cache
      showToast(`Added ${guide.ingredients?.length || 0} items to "${list.name}"`, 'success');
      setTimeout(onClose, 500); // Small delay to show toast
    } catch (error) {
      console.error('Error adding to list:', error);
      showToast('Failed to add to shopping list', 'error');
      setAdding(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add to Shopping List</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {guide.ingredients?.length || 0} ingredients from "{guide.title}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {/* Existing Lists */}
              {lists.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Add to existing list:
                  </h3>
                  <div className="space-y-2">
                    {lists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => handleAddToList(list)}
                        disabled={adding === list.id}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3">
                          <ShoppingCart size={18} className="text-primary-500" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{list.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {list.items.length} items
                            </p>
                          </div>
                        </div>
                        <Plus size={18} className="text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create New List */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Or create new list:
                </h3>
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition text-primary-600 dark:text-primary-400"
                  >
                    <Plus size={20} />
                    Create New Shopping List
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="e.g., Weekly Groceries"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewListName('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateAndAdd}
                        disabled={!newListName.trim() || creating}
                        className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creating ? 'Creating...' : 'Create & Add'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
