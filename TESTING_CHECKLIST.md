# Testing Checklist - Bulk Delete & Auto-Announcements

## Pre-Testing Setup

1. ✅ Both servers running (client on :3000, server on :3001)
2. ✅ Logged in as a user with some guides
3. ✅ Logged in as admin (for announcement testing)

---

## Test 1: Bulk Selection UI

**Steps:**
1. Go to main guides page (`http://localhost:3000`)
2. Verify you have at least 2-3 guides visible
3. Click the "Select" button (top right, next to Add Guide)
4. **Expected:** 
   - Button changes to "Cancel"
   - Checkboxes appear on all guide cards
   - Bulk action toolbar appears at top

**Pass/Fail:** ☐

---

## Test 2: Individual Guide Selection

**Steps:**
1. In selection mode, click checkbox on one guide
2. Click checkbox on another guide
3. **Expected:**
   - Selected guides show blue border/ring
   - Toolbar shows "X selected"
   - Can select/deselect individually

**Pass/Fail:** ☐

---

## Test 3: Select All / Deselect All

**Steps:**
1. In selection mode, click "Select All" in toolbar
2. **Expected:** All guides are selected
3. Click "Deselect All"
4. **Expected:** All guides are deselected

**Pass/Fail:** ☐

---

## Test 4: Bulk Delete

**Steps:**
1. Select 2-3 guides
2. Click "Delete (X)" button in toolbar
3. Confirm deletion in popup
4. **Expected:**
   - Guides disappear from main page
   - Success message shows
   - Guides moved to trash (not permanently deleted)

**Pass/Fail:** ☐

---

## Test 5: Trash Page - Restore

**Steps:**
1. Go to `/trash` page
2. **Expected:** Deleted guides appear here
3. Click "Restore" on one guide
4. **Expected:**
   - Guide restored successfully
   - Guide appears back on main page
   - Guide removed from trash

**Pass/Fail:** ☐

---

## Test 6: Single Guide Delete (from card)

**Steps:**
1. Go back to main page
2. Click trash icon on a single guide (not in selection mode)
3. Confirm deletion
4. **Expected:**
   - Guide moves to trash
   - No error messages
   - Works correctly

**Pass/Fail:** ☐

---

## Test 7: Selection Mode in List View

**Steps:**
1. Switch to list view (list icon)
2. Click "Select" button
3. **Expected:**
   - Checkboxes appear in list items
   - Selection works same as grid view
   - Bulk delete works

**Pass/Fail:** ☐

---

## Test 8: Auto-Announcement System

**Steps:**
1. Log in as admin
2. Go to Admin Dashboard (`/admin`)
3. Scroll to Announcements section
4. Click "Sync Features" button
5. **Expected:**
   - Button shows "Syncing..." while processing
   - Success message shows created/skipped counts
   - New announcements appear in list
   - Announcements have correct titles/descriptions

**Pass/Fail:** ☐

---

## Test 9: Auto-Announcement Content

**Steps:**
1. Check the auto-created announcements
2. **Expected:**
   - "Password Recovery Feature Added" exists
   - "Show/Hide Password Toggle" exists
   - "Bulk Delete Guides" exists
   - "Trash & Restore Feature" exists
   - All have correct icons and colors

**Pass/Fail:** ☐

---

## Test 10: Edit/Delete Auto-Announcements

**Steps:**
1. Try editing an auto-created announcement
2. Try deleting an auto-created announcement
3. **Expected:**
   - Can edit like normal announcements
   - Can delete like normal announcements
   - No restrictions on auto-created ones

**Pass/Fail:** ☐

---

## Test 11: Red Dot Notification

**Steps:**
1. As regular user, check if red dot appears on bell icon
2. Click bell icon
3. **Expected:**
   - Red dot appears if new announcements exist
   - Red dot disappears after clicking bell
   - Announcements modal shows correctly

**Pass/Fail:** ☐

---

## Test 12: Sync Features - Duplicate Prevention

**Steps:**
1. Click "Sync Features" again
2. **Expected:**
   - Message says "All feature announcements already exist!"
   - No duplicate announcements created
   - Existing announcements unchanged

**Pass/Fail:** ☐

---

## Known Issues to Check

- [ ] No console errors in browser
- [ ] No server errors in terminal
- [ ] Selection mode doesn't break guide card interactions
- [ ] Trash restore works correctly
- [ ] 7-day expiration logic works (if testing with old deleted items)

---

## Summary

**Total Tests:** 12
**Passed:** ___
**Failed:** ___

**Notes:**
- 

---

## If Tests Fail

1. Check browser console for errors
2. Check server terminal for errors
3. Verify Supabase connection
4. Check that trash migration was run in Supabase
5. Verify admin user has `is_admin = true` in profiles table







