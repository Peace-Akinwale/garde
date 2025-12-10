const fs = require('fs');

// Fix 1: Change "Back to Dashboard" to "Back to Home" and fix the route
const trashPagePath = 'client/app/trash/page.jsx';
let trashContent = fs.readFileSync(trashPagePath, 'utf8');

trashContent = trashContent.replace(
  "onClick={() => router.push('/dashboard')}",
  "onClick={() => router.push('/')}"
);

trashContent = trashContent.replace(
  '← Back to Dashboard',
  '← Back to Home'
);

fs.writeFileSync(trashPagePath, trashContent, 'utf8');
console.log('✓ Fixed trash page - changed Dashboard link to Home');

console.log('\nDone! The "Back to Dashboard" button now goes to homepage.');
console.log('\nFor the "Guide not found" error, please check:');
console.log('1. Are you trying to delete a guide that you own?');
console.log('2. Check the browser console for detailed error messages');
