const fs = require('fs');

console.log('🎨 Adding clean bulk selection with long press...\n');

// ============================================================================
// FILE 1: Update page.js - Add selection state and handlers
// ============================================================================

const pagePath = 'client/app/page.js';
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Step 1: Add CheckSquare import to lucide-react imports
pageContent = pageContent.replace(
  "import { Plus, LogOut, User, Moon, Sun, Bell, Grid3x3, List, FileText } from 'lucide-react';",
  "import { Plus, LogOut, User, Moon, Sun, Bell, Grid3x3, List, FileText, CheckSquare, Trash2 } from 'lucide-react';"
);

// Step 2: Add import for bulkMoveToTrash
pageContent = pageContent.replace(
  "import { Plus, LogOut, User, Moon, Sun, Bell, Grid3x3, List, FileText, CheckSquare, Trash2 } from 'lucide-react';",
  "import { Plus, LogOut, User, Moon, Sun, Bell, Grid3x3, List, FileText, CheckSquare, Trash2 } from 'lucide-react';\nimport { bulkMoveToTrash } from '@/lib/trashActions';"
);

// Step 3: Add selection state after filters state
const oldFiltersState = `  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: '',
  });`;

const newFiltersState = `  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: '',
  });

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGuides, setSelectedGuides] = useState(new Set());`;

pageContent = pageContent.replace(oldFiltersState, newFiltersState);

// Step 4: Add selection handlers after handleGuideDeleted function
const insertPoint = `  const handleGuideDeleted = () => {
    if (user) {
      loadGuides(user.id);
    }
  };`;

const selectionHandlers = `  const handleGuideDeleted = () => {
    if (user) {
      loadGuides(user.id);
    }
  };

  // Selection mode handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedGuides(new Set());
  };

  const toggleGuideSelection = (guideId) => {
    const newSelection = new Set(selectedGuides);
    if (newSelection.has(guideId)) {
      newSelection.delete(guideId);
    } else {
      newSelection.add(guideId);
    }
    setSelectedGuides(newSelection);
  };

  const selectAll = () => {
    setSelectedGuides(new Set(guides.map(g => g.id)));
  };

  const deselectAll = () => {
    setSelectedGuides(new Set());
  };

  // Long press to enter selection mode
  const handleLongPress = (guideId) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedGuides(new Set([guideId]));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGuides.size === 0) return;

    const confirmed = confirm(\`Move \${selectedGuides.size} guide(s) to trash?\\n\\nYou can restore them within 7 days.\`);
    if (!confirmed) return;

    try {
      const result = await bulkMoveToTrash(Array.from(selectedGuides));
      if (result.success) {
        await loadGuides(user.id);
        setSelectedGuides(new Set());
        setIsSelectionMode(false);
        alert(\`✅ Moved \${result.deleted_count} guide(s) to trash\`);
      } else {
        alert(\`❌ Error: \${result.error}\`);
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Failed to delete guides');
    }
  };`;

pageContent = pageContent.replace(insertPoint, selectionHandlers);

// Step 5: Add minimal bulk action buttons in header (after view mode buttons)
const oldHeaderEnd = `              <button
                onClick={handleOpenNotifications}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition relative"
                title="What's New"
              >`;

const newHeaderEnd = `              {/* Bulk Selection Toggle - Minimal Icon Only */}
              {guides.length > 0 && (
                <button
                  onClick={toggleSelectionMode}
                  className={\`p-2 rounded-lg transition relative \${
                    isSelectionMode
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }\`}
                  title={isSelectionMode ? "Cancel Selection" : "Select Multiple"}
                >
                  <CheckSquare size={20} />
                </button>
              )}
              <button
                onClick={handleOpenNotifications}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition relative"
                title="What's New"
              >`;

pageContent = pageContent.replace(oldHeaderEnd, newHeaderEnd);

// Step 6: Add selection action bar (after search bar, before main content)
const searchBarEnd = `          {/* Search and Filters */}
          <div className="mt-4">
            <SearchBar filters={filters} onFiltersChange={setFilters} />
          </div>`;

const searchBarWithActions = `          {/* Search and Filters */}
          <div className="mt-4">
            <SearchBar filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Selection Action Bar - Only shows in selection mode */}
          {isSelectionMode && (
            <div className="mt-3 flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {selectedGuides.size} selected
                </span>
                <button
                  onClick={selectAll}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  None
                </button>
              </div>
              {selectedGuides.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg transition text-sm"
                >
                  <Trash2 size={16} />
                  Delete ({selectedGuides.size})
                </button>
              )}
            </div>
          )}`;

pageContent = pageContent.replace(searchBarEnd, searchBarWithActions);

// Step 7: Update GuideCard props in grid view
const oldGridView = `        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {guides.map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                userId={user.id}
                onDeleted={handleGuideDeleted}
              />
            ))}
          </div>`;

const newGridView = `        ) : viewMode === 'grid' ? (
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
                onLongPress={() => handleLongPress(guide.id)}
              />
            ))}
          </div>`;

pageContent = pageContent.replace(oldGridView, newGridView);

// Step 8: Update GuideListItem props in list view
const oldListView = `        ) : (
          <div className="space-y-3">
            {guides.map((guide) => (
              <GuideListItem
                key={guide.id}
                guide={guide}
                userId={user.id}
                onDeleted={handleGuideDeleted}
              />
            ))}
          </div>
        )}`;

const newListView = `        ) : (
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
                onLongPress={() => handleLongPress(guide.id)}
              />
            ))}
          </div>
        )}`;

pageContent = pageContent.replace(oldListView, newListView);

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('✓ Updated page.js with clean selection UI');

console.log('\n✅ Frontend setup complete!');
console.log('\nNow you need to update GuideCard.js to add:');
console.log('  1. Long press detection');
console.log('  2. Selection checkbox overlay');
console.log('  3. Hide action buttons in selection mode');
console.log('\nCheck ADD_BULK_SELECTION_GUIDE.md for GuideCard.js changes');
