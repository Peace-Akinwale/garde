const fs = require('fs');

console.log('🔧 Fixing trash feature issues...\n');

// ============================================================================
// FIX 1: Backend API - Exclude deleted guides from main page
// ============================================================================

const guidesRoutePath = 'server/routes/guides.js';
let guidesContent = fs.readFileSync(guidesRoutePath, 'utf8');

// Add filter to exclude deleted guides (line 16-22 area)
const oldQuery = `let query = supabase
    .from('guides')
    .select('*')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('pinned_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });`;

const newQuery = `let query = supabase
    .from('guides')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)  // Exclude deleted guides
    .order('pinned', { ascending: false })
    .order('pinned_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });`;

guidesContent = guidesContent.replace(oldQuery, newQuery);

// Also fix the stats endpoint to exclude deleted guides (line 317)
const oldStatsQuery = `    const { data, error } = await supabase
      .from('guides')
      .select('type, category')
      .eq('user_id', userId);`;

const newStatsQuery = `    const { data, error } = await supabase
      .from('guides')
      .select('type, category')
      .eq('user_id', userId)
      .eq('is_deleted', false);  // Exclude deleted guides from stats`;

guidesContent = guidesContent.replace(oldStatsQuery, newStatsQuery);

fs.writeFileSync(guidesRoutePath, guidesContent, 'utf8');
console.log('✓ Fixed backend API to exclude deleted guides');
console.log('  - GET /api/guides/:userId now filters out deleted guides');
console.log('  - Stats endpoint also excludes deleted guides\n');

console.log('✅ Backend fixes complete!');
console.log('\nNow working on frontend bulk selection feature...');
console.log('This will require manual changes to page.js and GuideCard.js');
console.log('Check the instructions below:\n');
