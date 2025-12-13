# Bulk Delete & Auto-Announcements Feature

## Summary

This update adds:
1. **Bulk Selection & Delete** - Users can select multiple guides and delete them at once
2. **Trash Delete Fix** - Fixed the Supabase client issue causing delete errors
3. **Trial/Payment Code Removal** - Removed any trial limit code (none was found)
4. **Auto-Announcement System** - Automatically creates announcements when new features are added

## Changes Made

### 1. Bulk Selection & Delete

**Files Modified:**
- `client/app/page.js` - Added selection mode state and handlers
- `client/components/GuideCard.js` - Already supported selection (no changes needed)
- `client/components/GuideListItem.js` - Added selection mode support with checkboxes
- `client/components/BulkActionToolbar.jsx` - Enhanced with select all functionality

**Features:**
- Click "Select" button to enter selection mode
- Checkboxes appear on all guide cards
- Select individual guides or use "Select All"
- Bulk delete moves guides to trash (can be restored within 7 days)
- Clean UI with visual feedback for selected items

### 2. Trash Delete Fix

**Files Modified:**
- `client/lib/trashActions.js` - Fixed Supabase client usage

**Issue:**
- Was using `createClientComponentClient()` from `@supabase/auth-helpers-nextjs`
- Changed to use centralized `supabase` client from `@/lib/supabase`

**Result:**
- Delete operations now work correctly
- All trash functions use consistent client

### 3. Trial/Payment Code Removal

**Result:**
- No trial limit code was found in the codebase
- All "5" references are for:
  - Badge thresholds (5 guides = verified user)
  - Rate limiting (5 requests per minute)
  - File size limits (5MB)
  - Admin pagination (limit 50)

### 4. Auto-Announcement System

**New Files:**
- `server/services/autoAnnouncements.js` - Core auto-announcement logic
- `server/routes/autoAnnouncements.js` - API routes for auto-announcements

**Files Modified:**
- `server/index.js` - Added auto-announcements route
- `client/lib/api.js` - Added `autoAnnouncementsAPI` methods
- `client/components/AnnouncementManager.js` - Added "Sync Features" button

**How It Works:**

1. **Feature Registry** (`server/services/autoAnnouncements.js`):
   - Contains a registry of all features that should auto-create announcements
   - Each feature has: title, description, icon, color, date

2. **Auto-Creation**:
   - Admin clicks "Sync Features" button in Announcement Manager
   - System checks which features don't have announcements yet
   - Creates announcements for missing features
   - Skips features that already have announcements

3. **Adding New Features**:
   - Add feature to `FEATURE_REGISTRY` in `server/services/autoAnnouncements.js`
   - Run sync to create announcement
   - Admin can still edit/delete auto-created announcements

**Current Features in Registry:**
- `password-recovery` - Password reset feature
- `show-password-toggle` - Show/hide password toggle
- `bulk-delete` - Bulk selection and delete
- `trash-restore` - Trash and restore feature

## Usage

### Bulk Delete Guides

1. Go to main guides page
2. Click "Select" button (top right)
3. Check boxes on guides you want to delete
4. Click "Delete (X)" in the toolbar
5. Confirm deletion
6. Guides are moved to trash (restore within 7 days)

### Auto-Create Announcements

1. Go to Admin Dashboard
2. Navigate to Announcements section
3. Click "Sync Features" button
4. System creates announcements for any new features
5. Edit or delete announcements as needed

### Adding New Feature Announcements

1. Open `server/services/autoAnnouncements.js`
2. Add new feature to `FEATURE_REGISTRY`:
   ```javascript
   'new-feature-key': {
     title: 'New Feature Name',
     description: 'Description of the feature...',
     icon: 'sparkles',
     color: 'blue',
     date: '2025-01-15'
   }
   ```
3. Deploy the code
4. Admin clicks "Sync Features" in dashboard
5. Announcement is automatically created

## Testing

### Bulk Delete
1. ✅ Select multiple guides
2. ✅ Delete selected guides
3. ✅ Verify guides moved to trash
4. ✅ Restore from trash page
5. ✅ Works in both grid and list view

### Auto-Announcements
1. ✅ Sync creates missing announcements
2. ✅ Skips existing announcements
3. ✅ Admin can edit/delete auto-created announcements
4. ✅ Red dot appears when new announcements exist

## Notes

- Deleted guides can be restored within 7 days from `/trash` page
- Auto-announcements are just like manual announcements - fully editable
- Feature registry is in code, so updates require deployment
- Admin can always manually create announcements if needed







