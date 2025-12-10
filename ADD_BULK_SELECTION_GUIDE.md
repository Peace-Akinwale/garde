# Adding Bulk Selection to Main Guides Page

## Changes Needed

### File 1: `client/app/page.js`

#### Change 1: Add import for trash actions (line 16, after existing imports)
```javascript
import { Plus, LogOut, User, Moon, Sun, Bell, Grid3x3, List, FileText, CheckSquare } from 'lucide-react';
import { bulkMoveToTrash } from '@/lib/trashActions';
```

#### Change 2: Add selection state variables (after line 36, after filters state)
```javascript
  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGuides, setSelectedGuides] = useState(new Set());
```

#### Change 3: Add selection functions (after line 131, after handleGuideDeleted)
```javascript
  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedGuides(new Set()); // Clear selection when toggling
  };

  // Toggle individual guide selection
  const toggleGuideSelection = (guideId) => {
    const newSelection = new Set(selectedGuides);
    if (newSelection.has(guideId)) {
      newSelection.delete(guideId);
    } else {
      newSelection.add(guideId);
    }
    setSelectedGuides(newSelection);
  };

  // Select all guides
  const selectAll = () => {
    const allIds = guides.map(guide => guide.id);
    setSelectedGuides(new Set(allIds));
  };

  // Deselect all guides
  const deselectAll = () => {
    setSelectedGuides(new Set());
  };

  // Bulk delete (move to trash)
  const handleBulkDelete = async () => {
    if (selectedGuides.size === 0) {
      alert('Please select guides to delete');
      return;
    }

    const confirmed = confirm(
      `Move ${selectedGuides.size} guide(s) to trash?\\n\\nYou can restore them within 7 days.`
    );

    if (!confirmed) return;

    try {
      const guideIds = Array.from(selectedGuides);
      const result = await bulkMoveToTrash(guideIds);

      if (result.success) {
        await loadGuides(user.id);
        setSelectedGuides(new Set());
        setIsSelectionMode(false);
        alert(`✅ Moved ${result.deleted_count} guide(s) to trash`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Failed to delete guides');
    }
  };
```

#### Change 4: Add bulk action buttons (after line 351, before the search bar)
```javascript
          {/* Bulk Actions */}
          {guides.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={toggleSelectionMode}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isSelectionMode
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
              >
                <CheckSquare size={18} />
                {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
              </button>

              {isSelectionMode && (
                <>
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-lg transition"
                  >
                    Select All ({guides.length})
                  </button>

                  <button
                    onClick={deselectAll}
                    className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-lg transition"
                  >
                    Deselect All
                  </button>

                  {selectedGuides.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition ml-auto"
                    >
                      Move to Trash ({selectedGuides.size})
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Search and Filters */}
```

#### Change 5: Update GuideCard usage (around lines 393-402 for grid view)
```javascript
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {guides.map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                userId={user.id}
                onDeleted={handleGuideDeleted}
                isSelectionMode={isSelectionMode}
                isSelected={selectedGuides.has(guide.id)}
                onToggleSelection={() => toggleGuideSelection(guide.id)}
              />
            ))}
          </div>
```

#### Change 6: Update GuideListItem usage (around lines 403-414 for list view)
```javascript
        ) : (
          <div className="space-y-3">
            {guides.map((guide) => (
              <GuideListItem
                key={guide.id}
                guide={guide}
                userId={user.id}
                onDeleted={handleGuideDeleted}
                isSelectionMode={isSelectionMode}
                isSelected={selectedGuides.has(guide.id)}
                onToggleSelection={() => toggleGuideSelection(guide.id)}
              />
            ))}
          </div>
        )}
```

---

### File 2: `client/components/GuideCard.js`

#### Change 1: Update props (line 100)
```javascript
export default function GuideCard({ guide, onDeleted, userId, isSelectionMode = false, isSelected = false, onToggleSelection }) {
```

#### Change 2: Add checkbox to card (after line 148, inside the card div)
```javascript
      <div
        onClick={() => isSelectionMode ? onToggleSelection() : setShowDetail(true)}
        className={`bg-white dark:bg-slate-700 rounded-lg border-2 ${cardBorderColor} dark:border-slate-600 p-5 cursor-pointer card-hover relative overflow-hidden ${
          isSelected ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''
        }`}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className="absolute top-3 left-3 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelection();
              }}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
```

#### Change 3: Hide action buttons in selection mode (update buttons around line 174)
```javascript
          <div className="flex items-center gap-2">
            {!isSelectionMode && (
              <>
                <button
                  onClick={handlePin}
                  disabled={pinning}
                  className={`transition disabled:opacity-50 ${isPinned ? 'text-primary-600' :
'text-gray-400 hover:text-primary-600'}`}
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
              </>
            )}
          </div>
```

---

### File 3: `client/components/GuideListItem.js`

#### Change 1: Update props (at the function definition)
```javascript
export default function GuideListItem({ guide, onDeleted, userId, isSelectionMode = false, isSelected = false, onToggleSelection }) {
```

#### Change 2: Add checkbox and update click behavior (in the JSX)
Similar changes as GuideCard - add checkbox when isSelectionMode is true, and hide action buttons

---

## Summary

After making these changes:
1. Restart your dev server
2. You'll see a "Select Multiple" button on the main page
3. Click it to enter selection mode
4. Check guides you want to delete
5. Click "Move to Trash" to bulk delete
6. Deleted guides will disappear immediately
7. Access them from the Trash page in the sidebar
