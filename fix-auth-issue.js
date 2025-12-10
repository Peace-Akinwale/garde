const fs = require('fs');

// Fix the trashActions.js to use the centralized supabase client
const trashActionsPath = 'client/lib/trashActions.js';
let content = fs.readFileSync(trashActionsPath, 'utf8');

// Replace the import
content = content.replace(
  "import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';",
  "import { supabase } from '@/lib/supabase';"
);

// Replace all instances of createClientComponentClient() with supabase
content = content.replace(/const supabase = createClientComponentClient\(\);/g, '// Using centralized supabase client');

// Remove the line completely if it's the only thing on that line
content = content.replace(/\n  const supabase = createClientComponentClient\(\);\n/g, '\n');
content = content.replace(/\n\s*const supabase = createClientComponentClient\(\);\n/g, '\n');

fs.writeFileSync(trashActionsPath, content, 'utf8');
console.log('✓ Fixed trashActions.js to use centralized Supabase client');
console.log('\nThis should fix the authentication issue!');
console.log('The trash actions will now use the same authenticated client as the rest of your app.');
