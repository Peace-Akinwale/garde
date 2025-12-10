const fs = require('fs');
const path = require('path');

// File 1: Update GuideCard.js
const guideCardPath = path.join(__dirname, 'client/components/GuideCard.js');
let guideCardContent = fs.readFileSync(guideCardPath, 'utf8');

// Replace handleDelete function
const oldHandleDelete = `    const handleDelete = async (e) => {
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
    };`;

const newHandleDelete = `    const handleDelete = async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this guide?\\n\\nYou can restore it from trash within 7 days.')) return;

      try {
        setDeleting(true);
        const result = await moveToTrash(guide.id);
        if (result.success) {
          onDeleted();
        } else {
          alert(\`Failed to delete: \${result.error}\`);
        }
      } catch (error) {
        console.error('Error deleting guide:', error);
        alert('Failed to delete guide');
      } finally {
        setDeleting(false);
      }
    };`;

guideCardContent = guideCardContent.replace(oldHandleDelete, newHandleDelete);
fs.writeFileSync(guideCardPath, guideCardContent, 'utf8');
console.log('✓ Updated GuideCard.js');

// File 2: Update Navigation.js
const navigationPath = path.join(__dirname, 'client/components/Navigation.js');
let navigationContent = fs.readFileSync(navigationPath, 'utf8');

// Add Trash2 to imports
const oldImport = "import { Home, ShoppingCart, User, Bell, Menu, X, Settings, LogOut, Shield, Star } from 'lucide-react';";
const newImport = "import { Home, ShoppingCart, User, Bell, Menu, X, Settings, LogOut, Shield, Star, Trash2 } from 'lucide-react';";
navigationContent = navigationContent.replace(oldImport, newImport);

// Add Trash to menu items
const oldMenuItems = `  const baseMenuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingCart, label: 'Shopping Lists', path: '/shopping' },
    { icon: Star, label: 'Reviews', path: '/reviews' },
    // { icon: Bell, label: 'Reminders', path: '/reminders' }, // Disabled for now
    { icon: User, label: 'Profile', path: '/profile' }
  ];`;

const newMenuItems = `  const baseMenuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingCart, label: 'Shopping Lists', path: '/shopping' },
    { icon: Star, label: 'Reviews', path: '/reviews' },
    { icon: Trash2, label: 'Trash', path: '/trash' },
    // { icon: Bell, label: 'Reminders', path: '/reminders' }, // Disabled for now
    { icon: User, label: 'Profile', path: '/profile' }
  ];`;

navigationContent = navigationContent.replace(oldMenuItems, newMenuItems);
fs.writeFileSync(navigationPath, navigationContent, 'utf8');
console.log('✓ Updated Navigation.js');

console.log('\n✅ All changes applied successfully!');
console.log('\nYou can now:');
console.log('1. Start your dev server: npm run dev');
console.log('2. Delete a guide - it will go to trash');
console.log('3. Click "Trash" in the sidebar to view deleted guides');
