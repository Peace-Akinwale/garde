'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { shoppingAPI } from '@/lib/api';
import { ShoppingCart, Plus, Trash2, Copy, Check, ExternalLink, Edit2, X } from 'lucide-react';
import { generateAllStoreLinks, detectUserRegion, REGIONS, getStoresForRegion } from '@/lib/smartLinks';
import { v4 as uuidv4 } from 'uuid';

export default function ShoppingPage() {
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userRegion, setUserRegion] = useState(REGIONS.USA);

  useEffect(() => {
    checkUser();
    setUserRegion(detectUserRegion());
  }, []);

  useEffect(() => {
    if (user) {
      loadLists();
    }
  }, [user]);

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const loadLists = async () => {
    try {
      setLoading(true);
      const response = await shoppingAPI.getAll(user.id);
      setLists(response.data || []);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (name) => {
    try {
      await shoppingAPI.create(user.id, name);
      await loadLists();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm('Delete this shopping list?')) return;

    try {
      await shoppingAPI.delete(listId);
      await loadLists();
      if (selectedList?.id === listId) {
        setSelectedList(null);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const handleToggleItem = async (list, itemId) => {
    const updatedItems = list.items.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );

    try {
      await shoppingAPI.update(list.id, { items: updatedItems });
      await loadLists();
      if (selectedList?.id === list.id) {
        setSelectedList({ ...list, items: updatedItems });
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleAddItem = async (list, itemName) => {
    if (!itemName.trim()) return;

    const newItem = {
      id: uuidv4(),
      name: itemName.trim(),
      quantity: '',
      category: 'Uncategorized',
      checked: false,
      source: 'manual'
    };

    const updatedItems = [...list.items, newItem];

    try {
      await shoppingAPI.update(list.id, { items: updatedItems });
      await loadLists();
      if (selectedList?.id === list.id) {
        setSelectedList({ ...list, items: updatedItems });
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleRemoveItem = async (list, itemId) => {
    const updatedItems = list.items.filter(item => item.id !== itemId);

    try {
      await shoppingAPI.update(list.id, { items: updatedItems });
      await loadLists();
      if (selectedList?.id === list.id) {
        setSelectedList({ ...list, items: updatedItems });
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleCopyList = (list) => {
    const text = list.items
      .filter(item => !item.checked)
      .map(item => `• ${item.name}${item.quantity ? ` - ${item.quantity}` : ''}`)
      .join('\n');

    navigator.clipboard.writeText(text);
    alert('Shopping list copied to clipboard!');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <p className="text-gray-500 dark:text-gray-400">Please log in to view shopping lists</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShoppingCart size={32} className="text-primary-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Lists</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage your grocery shopping</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
          >
            <Plus size={20} />
            New List
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && lists.length === 0 && (
          <div className="text-center py-16">
            <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No shopping lists yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first shopping list or add guides from your recipes
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition"
            >
              <Plus size={20} />
              Create Shopping List
            </button>
          </div>
        )}

        {/* Lists Grid */}
        {!loading && lists.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => (
              <ShoppingListCard
                key={list.id}
                list={list}
                onSelect={() => setSelectedList(list)}
                onDelete={() => handleDeleteList(list.id)}
                onToggleItem={(itemId) => handleToggleItem(list, itemId)}
                onCopy={() => handleCopyList(list)}
              />
            ))}
          </div>
        )}

        {/* Create List Modal */}
        {showCreateModal && (
          <CreateListModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateList}
          />
        )}

        {/* List Detail Modal */}
        {selectedList && (
          <ListDetailModal
            list={selectedList}
            userRegion={userRegion}
            onClose={() => setSelectedList(null)}
            onToggleItem={(itemId) => handleToggleItem(selectedList, itemId)}
            onAddItem={(name) => handleAddItem(selectedList, name)}
            onRemoveItem={(itemId) => handleRemoveItem(selectedList, itemId)}
            onCopy={() => handleCopyList(selectedList)}
          />
        )}
      </div>
    </div>
  );
}

// Shopping List Card Component
function ShoppingListCard({ list, onSelect, onDelete, onToggleItem, onCopy }) {
  const totalItems = list.items.length;
  const checkedItems = list.items.filter(item => item.checked).length;
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-3">
        <h3
          onClick={onSelect}
          className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400"
        >
          {list.name}
        </h3>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 transition"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>{checkedItems} of {totalItems} items</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={onSelect}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition text-sm"
        >
          <Edit2 size={16} />
          View
        </button>
        <button
          onClick={onCopy}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition text-sm"
        >
          <Copy size={16} />
          Copy
        </button>
      </div>
    </div>
  );
}

// Create List Modal
function CreateListModal({ onClose, onCreate }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name);
      setName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Shopping List</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              List Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekly Groceries"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// List Detail Modal (continues in next message due to length)
function ListDetailModal({ list, userRegion, onClose, onToggleItem, onAddItem, onRemoveItem, onCopy }) {
  const [newItemName, setNewItemName] = useState('');
  const stores = getStoresForRegion(userRegion);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItemName.trim()) {
      onAddItem(newItemName);
      setNewItemName('');
    }
  };

  const uncheckedItems = list.items.filter(item => !item.checked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{list.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopy}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
              title="Copy to clipboard"
            >
              <Copy size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Add Item Form */}
          <form onSubmit={handleAddItem} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Add item..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
              >
                <Plus size={20} />
              </button>
            </div>
          </form>

          {/* Items List */}
          {list.items.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No items yet. Add your first item above.
            </p>
          ) : (
            <div className="space-y-2">
              {list.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                >
                  <button
                    onClick={() => onToggleItem(item.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                      item.checked
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300 dark:border-slate-600 hover:border-primary-500'
                    }`}
                  >
                    {item.checked && <Check size={16} className="text-white" />}
                  </button>
                  <span
                    className={`flex-1 ${
                      item.checked
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {item.name}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Links Footer */}
        {uncheckedItems.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Shop at:
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {stores.map((store) => {
                const storeLinks = generateAllStoreLinks(uncheckedItems.map(i => i.name).join(' '), userRegion);
                const storeLink = storeLinks.find(l => l.storeKey === store.key);

                return (
                  <a
                    key={store.key}
                    href={storeLink?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition group"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {store.name}
                    </span>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-primary-500" />
                  </a>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Links open store searches for your unchecked items
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
