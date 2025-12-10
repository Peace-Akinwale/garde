const fs = require('fs');

console.log('🔧 Fixing authentication issue in trashActions...\n');

// The centralized supabase client doesn't automatically sync with Next.js auth cookies
// We need to use createClientComponentClient from auth-helpers
// This is specifically designed for Next.js and handles session management

const trashActionsPath = 'client/lib/trashActions.js';
let content = fs.readFileSync(trashActionsPath, 'utf8');

// Step 1: Replace the import - use auth-helpers instead
content = content.replace(
  "import { supabase } from '@/lib/supabase';",
  "import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';"
);

// Step 2: Add back the supabase client creation in each function
// This ensures each call has the current session from cookies

// moveToTrash
content = content.replace(
  `export async function moveToTrash(guideId) {
  // Using centralized supabase client

  const { data, error } = await supabase`,
  `export async function moveToTrash(guideId) {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase`
);

// bulkMoveToTrash
content = content.replace(
  `export async function bulkMoveToTrash(guideIds) {
  if (!guideIds || guideIds.length === 0) {
    return { success: false, error: 'No guides selected' };
  }

  // Using centralized supabase client

  const { data, error } = await supabase`,
  `export async function bulkMoveToTrash(guideIds) {
  if (!guideIds || guideIds.length === 0) {
    return { success: false, error: 'No guides selected' };
  }

  const supabase = createClientComponentClient();

  const { data, error } = await supabase`
);

// restoreFromTrash
content = content.replace(
  `export async function restoreFromTrash(guideId) {
  // Using centralized supabase client

  const { data, error } = await supabase`,
  `export async function restoreFromTrash(guideId) {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase`
);

// bulkRestoreFromTrash
content = content.replace(
  /\/\/ Using centralized supabase client\n\n  const { data, error } = await supabase\n    \.rpc\('bulk_restore_guides'/g,
  `const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .rpc('bulk_restore_guides'`
);

// permanentlyDelete
content = content.replace(
  /export async function permanentlyDelete\(guideId\) {\n  \/\/ Using centralized supabase client\n\n  const { data, error } = await supabase/,
  `export async function permanentlyDelete(guideId) {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase`
);

// bulkPermanentlyDelete
content = content.replace(
  /export async function bulkPermanentlyDelete\(guideIds\) {\n  if \(!guideIds \|\| guideIds\.length === 0\) {\n    return { success: false, error: 'No guides selected' };\n  }\n\n  \/\/ Using centralized supabase client\n\n  const { data, error } = await supabase/,
  `export async function bulkPermanentlyDelete(guideIds) {
  if (!guideIds || guideIds.length === 0) {
    return { success: false, error: 'No guides selected' };
  }

  const supabase = createClientComponentClient();

  const { data, error } = await supabase`
);

// emptyTrash
content = content.replace(
  /export async function emptyTrash\(\) {\n  const supabase = createClientComponentClient\(\);\n\n  const { data, error } = await supabase\.rpc\('empty_trash'\);/,
  `export async function emptyTrash() {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase.rpc('empty_trash');`
);

// Fix any remaining comments
content = content.replace(/\/\/ Using centralized supabase client\n\n/g, '');

fs.writeFileSync(trashActionsPath, content, 'utf8');
console.log('✓ Fixed trashActions.js to use auth-helpers client');
console.log('  This client automatically syncs with Next.js auth cookies\n');

console.log('Now let\'s check if guides are already in trash...');
console.log('\n📋 Next steps:');
console.log('1. Refresh your browser (hard refresh: Ctrl+Shift+R)');
console.log('2. The guides page should now show only active guides');
console.log('3. Check the Trash page - previously deleted guides should be there');
console.log('4. If you still see guides on main page, they are ACTIVE and can be deleted');
console.log('5. If you get the error, those guides are already in trash');
