# Trash Feature Integration - Manual Changes Needed

## File 1: `client/components/GuideCard.js`

### Change 1 - Add import (after line 4):
```javascript
import { guidesAPI } from '@/lib/api';
import { moveToTrash } from '@/lib/trashActions';  // ADD THIS LINE
```

### Change 2 - Replace handleDelete function (lines 111-125):

**REPLACE THIS:**
```javascript
    const handleDelete = async (e) => {
      e.stopPropagation();
      if (!confirm('Are you sure you want to delete this guide?')) return;

      try {
        setDeleting(true);
        await guidesAPI.delete(guide.id);
        onDeleted();
      } catch (error) {
        console.error('Error deleting guide:', error);
        alert('Failed to delete guide');
      } finally {
        setDeleting(false);
      }
    };
```

**WITH THIS:**
```javascript
    const handleDelete = async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this guide?\n\nYou can restore it from trash within 7 days.')) return;

      try {
        setDeleting(true);
        const result = await moveToTrash(guide.id);
        if (result.success) {
          onDeleted();
        } else {
          alert(`Failed to delete: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting guide:', error);
        alert('Failed to delete guide');
      } finally {
        setDeleting(false);
      }
    };
```

---

## File 2: `client/components/Navigation.js`

### Change 1 - Update imports (line 5):
**REPLACE THIS:**
```javascript
import { Home, ShoppingCart, User, Bell, Menu, X, Settings, LogOut, Shield, Star } from 'lucide-react';
```

**WITH THIS:**
```javascript
import { Home, ShoppingCart, User, Bell, Menu, X, Settings, LogOut, Shield, Star, Trash2 } from 'lucide-react';
```

### Change 2 - Add Trash to menu items (around line 34-40):
**REPLACE THIS:**
```javascript
  const baseMenuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingCart, label: 'Shopping Lists', path: '/shopping' },
    { icon: Star, label: 'Reviews', path: '/reviews' },
    // { icon: Bell, label: 'Reminders', path: '/reminders' }, // Disabled for now
    { icon: User, label: 'Profile', path: '/profile' }
  ];
```

**WITH THIS:**
```javascript
  const baseMenuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingCart, label: 'Shopping Lists', path: '/shopping' },
    { icon: Star, label: 'Reviews', path: '/reviews' },
    { icon: Trash2, label: 'Trash', path: '/trash' },  // ADD THIS LINE
    // { icon: Bell, label: 'Reminders', path: '/reminders' }, // Disabled for now
    { icon: User, label: 'Profile', path: '/profile' }
  ];
```

---

## Summary of Changes:
1. GuideCard.js now uses soft delete (moveToTrash) instead of hard delete
2. Navigation menu now includes "Trash" link
3. All backend (database) changes are already applied
4. Trash page already exists at `/app/trash/page.jsx`
5. All trash functions are ready in `/lib/trashActions.js`

## After Making These Changes:
1. Restart your dev server
2. Visit your app
3. Delete a guide - it will now go to trash
4. Click "Trash" in the sidebar to view deleted guides
5. You can restore or permanently delete from there
