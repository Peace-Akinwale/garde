const fs = require('fs');

console.log('🚨 URGENT FIX: Adding missing supabase client declarations...\n');

const trashActionsPath = 'client/lib/trashActions.js';
let content = fs.readFileSync(trashActionsPath, 'utf8');

// Fix all functions - replace the comment with actual client creation
content = content.replace(
  /\/\/ Using centralized supabase client\n\n  const { data, error } = await supabase/g,
  'const supabase = createClientComponentClient();\n\n  const { data, error } = await supabase'
);

// Also fix any that might have been partially fixed
content = content.replace(
  /export async function moveToTrash\(guideId\) \{\n  \/\/ Using centralized supabase client\n\n  const \{ data, error \} = await supabase/,
  'export async function moveToTrash(guideId) {\n  const supabase = createClientComponentClient();\n\n  const { data, error } = await supabase'
);

fs.writeFileSync(trashActionsPath, content, 'utf8');

console.log('✓ Fixed all missing supabase client declarations');
console.log('\n🔄 Now restart your dev server (Ctrl+C, then npm run dev)');
console.log('🌐 Then hard refresh your browser (Ctrl+Shift+R)');
console.log('\nThis should fix both the trash page and delete functionality!');
