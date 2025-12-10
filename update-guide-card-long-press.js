const fs = require('fs');

console.log('📱 Adding long press support to GuideCard...\n');

// ============================================================================
// Update GuideCard.js with long press detection and selection mode
// ============================================================================

const guideCardPath = 'client/components/GuideCard.js';
let cardContent = fs.readFileSync(guideCardPath, 'utf8');

// Step 1: Update function props to include new selection props
const oldFunctionDef = 'export default function GuideCard({ guide, onDeleted, userId }) {';
const newFunctionDef = 'export default function GuideCard({ guide, onDeleted, userId, isSelectionMode = false, isSelected = false, onToggleSelection, onLongPress }) {';

cardContent = cardContent.replace(oldFunctionDef, newFunctionDef);

// Step 2: Add long press state and timer
const oldStateVars = `export default function GuideCard({ guide, onDeleted, userId, isSelectionMode = false, isSelected = false, onToggleSelection, onLongPress }) {
    const [showDetail, setShowDetail] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showShoppingSelector, setShowShoppingSelector] = useState(false);
    const [isPinned, setIsPinned] = useState(guide.pinned || false);
    const [pinning, setPinning] = useState(false);`;

const newStateVars = `export default function GuideCard({ guide, onDeleted, userId, isSelectionMode = false, isSelected = false, onToggleSelection, onLongPress }) {
    const [showDetail, setShowDetail] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showShoppingSelector, setShowShoppingSelector] = useState(false);
    const [isPinned, setIsPinned] = useState(guide.pinned || false);
    const [pinning, setPinning] = useState(false);

    // Long press detection for mobile
    const [longPressTimer, setLongPressTimer] = useState(null);`;

cardContent = cardContent.replace(oldStateVars, newStateVars);

// Step 3: Add long press handlers after handlePin
const insertAfterPin = `    const handlePin = async (e) => {
      e.stopPropagation();
      try {
        setPinning(true);
        const newPinnedState = !isPinned;
        await guidesAPI.togglePin(guide.id, userId, newPinnedState);
        setIsPinned(newPinnedState);
        onDeleted();
      } catch (error) {
        console.error('Error toggling pin:', error);
        alert('Failed to toggle pin');
      } finally {
        setPinning(false);
      }
    };`;

const insertAfterPinNew = `    const handlePin = async (e) => {
      e.stopPropagation();
      try {
        setPinning(true);
        const newPinnedState = !isPinned;
        await guidesAPI.togglePin(guide.id, userId, newPinnedState);
        setIsPinned(newPinnedState);
        onDeleted();
      } catch (error) {
        console.error('Error toggling pin:', error);
        alert('Failed to toggle pin');
      } finally {
        setPinning(false);
      }
    };

    // Long press handlers
    const handleTouchStart = (e) => {
      if (isSelectionMode) return; // Already in selection mode

      const timer = setTimeout(() => {
        // Vibrate if supported (mobile only)
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        onLongPress?.();
      }, 500); // 500ms long press

      setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    };

    const handleMouseDown = (e) => {
      if (isSelectionMode || e.button !== 0) return; // Only left click

      const timer = setTimeout(() => {
        onLongPress?.();
      }, 500);

      setLongPressTimer(timer);
    };

    const handleMouseUp = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    };

    const handleMouseLeave = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    };

    const handleCardClick = () => {
      if (isSelectionMode) {
        onToggleSelection?.();
      } else if (!longPressTimer) {
        // Only open detail if not long pressing
        setShowDetail(true);
      }
    };`;

cardContent = cardContent.replace(insertAfterPin, insertAfterPinNew);

// Step 4: Update the card div with long press handlers and selection styling
const oldCardDiv = `      <div
        onClick={() => setShowDetail(true)}
        className={\`bg-white dark:bg-slate-700 rounded-lg border-2 \${cardBorderColor} dark:border-slate-600 p-5 cursor-pointer card-hover relative overflow-hidden\`}
      >`;

const newCardDiv = `      <div
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={\`bg-white dark:bg-slate-700 rounded-lg border-2 \${cardBorderColor} dark:border-slate-600 p-5 cursor-pointer card-hover relative overflow-hidden \${
          isSelected ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''
        }\`}
      >
        {/* Selection Checkbox - Top Left Overlay */}
        {isSelectionMode && (
          <div className="absolute top-3 left-3 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelection?.();
              }}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
            />
          </div>
        )}
`;

cardContent = cardContent.replace(oldCardDiv, newCardDiv);

// Step 5: Hide action buttons in selection mode
const oldActionButtons = `          <div className="flex items-center gap-2">
            <button
              onClick={handlePin}
              disabled={pinning}
              className={\`transition disabled:opacity-50 \${isPinned ? 'text-primary-600' :
'text-gray-400 hover:text-primary-600'}\`}
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
          </div>`;

const newActionButtons = `          <div className="flex items-center gap-2">
            {!isSelectionMode && (
              <>
                <button
                  onClick={handlePin}
                  disabled={pinning}
                  className={\`transition disabled:opacity-50 \${isPinned ? 'text-primary-600' :
'text-gray-400 hover:text-primary-600'}\`}
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
          </div>`;

cardContent = cardContent.replace(oldActionButtons, newActionButtons);

fs.writeFileSync(guideCardPath, cardContent, 'utf8');
console.log('✓ Updated GuideCard.js with long press detection');
console.log('  - Long press for 500ms activates selection mode');
console.log('  - Works on both mobile (touch) and desktop (mouse)');
console.log('  - Haptic feedback on mobile devices');
console.log('  - Checkbox appears in selection mode');
console.log('  - Action buttons hidden during selection');

console.log('\n✅ All updates complete!');
console.log('\nFeatures added:');
console.log('  ✓ Minimal UI - just checkbox icon in header');
console.log('  ✓ Long press to select (mobile & desktop)');
console.log('  ✓ Clean selection bar with count');
console.log('  ✓ Bulk delete with confirmation');
console.log('  ✓ Visual feedback (ring, background)');
