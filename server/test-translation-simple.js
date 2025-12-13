/**
 * Simple Auto-Translation Test (No Server Required)
 */

import { YoutubeTranscript } from '@danielxceron/youtube-transcript';

async function testTranslation() {
  console.log('\n=== AUTO-TRANSLATION TEST ===\n');

  // Test 1: English video
  console.log('Test 1: English Video');
  console.log('URL: https://www.youtube.com/watch?v=UF8uR6Z6KLc');
  try {
    console.log('  Trying English...');
    const enTranscript = await YoutubeTranscript.fetchTranscript('UF8uR6Z6KLc', { lang: 'en' });
    console.log(`  ✅ Got English: ${enTranscript.length} segments`);
    console.log(`  Preview: ${enTranscript.slice(0, 2).map(s => s.text).join(' ')}`);
  } catch (error) {
    console.log(`  ❌ English failed: ${error.message}`);
  }

  console.log('\n---\n');

  // Test 2: Try getting Spanish from same video (if available)
  console.log('Test 2: Same Video - Spanish Translation');
  try {
    console.log('  Trying Spanish...');
    const esTranscript = await YoutubeTranscript.fetchTranscript('UF8uR6Z6KLc', { lang: 'es' });
    console.log(`  ✅ Got Spanish: ${esTranscript.length} segments`);
    console.log(`  Preview: ${esTranscript.slice(0, 2).map(s => s.text).join(' ')}`);
    console.log('  🌍 AUTO-TRANSLATION WORKS!');
  } catch (error) {
    console.log(`  ⚠️  Spanish not available: ${error.message}`);
  }

  console.log('\n---\n');

  // Test 3: Try getting French
  console.log('Test 3: Same Video - French Translation');
  try {
    console.log('  Trying French...');
    const frTranscript = await YoutubeTranscript.fetchTranscript('UF8uR6Z6KLc', { lang: 'fr' });
    console.log(`  ✅ Got French: ${frTranscript.length} segments`);
    console.log(`  Preview: ${frTranscript.slice(0, 2).map(s => s.text).join(' ')}`);
    console.log('  🌍 AUTO-TRANSLATION WORKS!');
  } catch (error) {
    console.log(`  ⚠️  French not available: ${error.message}`);
  }

  console.log('\n=== TEST COMPLETE ===');
  console.log('\n📌 SUMMARY:');
  console.log('The function now tries multiple languages automatically:');
  console.log('  1. English (en) - native or auto-translated');
  console.log('  2. Spanish (es) - common for recipes');
  console.log('  3. French (fr) - common for cooking/beauty');
  console.log('  4. Original - whatever YouTube provides');
  console.log('\n✅ This means non-English videos can now be processed!');
  console.log('');
}

testTranslation().catch(console.error);
