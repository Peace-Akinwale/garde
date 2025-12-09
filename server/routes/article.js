import express from 'express';
import { processArticle } from '../services/articleProcessor.js';
import { supabase } from '../index.js';

const router = express.Router();

/**
 * POST /api/article/process
 * Process article URL and extract guide
 * Returns processed guide immediately (faster than video processing)
 */
router.post('/process', async (req, res) => {
  try {
    const { url, userId } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`📰 Processing article request: ${url}`);

    // 🚀 CACHE CHECK: See if ANY user has already processed this exact URL
    console.log('🔍 Checking cache for existing guide...');
    const { data: existingGuide, error: cacheCheckError } = await supabase
      .from('guides')
      .select('id, title, type, category, ingredients, steps, transcription, language, duration, servings, difficulty, tips, summary')
      .eq('source_url', url)
      .eq('source_type', 'article') // Only match articles
      .limit(1)
      .maybeSingle();

    if (cacheCheckError) {
      console.warn('Cache check failed:', cacheCheckError);
      // Continue with normal processing if cache check fails
    }

    if (existingGuide) {
      console.log(`✅ CACHE HIT! Found existing guide (ID: ${existingGuide.id})`);
      console.log(`📋 Cloning guide for user ${userId}...`);

      // Clone the guide for this user (instant result!)
      const { data: clonedGuide, error: cloneError } = await supabase
        .from('guides')
        .insert({
          user_id: userId,
          title: existingGuide.title,
          type: existingGuide.type,
          category: existingGuide.category,
          ingredients: existingGuide.ingredients,
          steps: existingGuide.steps,
          transcription: existingGuide.transcription,
          source_url: url,
          source_type: 'article',
          language: existingGuide.language,
          duration: existingGuide.duration,
          servings: existingGuide.servings,
          difficulty: existingGuide.difficulty,
          tips: existingGuide.tips,
          summary: existingGuide.summary
        })
        .select()
        .single();

      if (cloneError) {
        console.error('❌ Failed to clone guide:', cloneError);
        // Fall through to normal processing
      } else {
        console.log(`🎉 Cache hit! Guide cloned successfully (ID: ${clonedGuide.id})`);
        return res.json({
          success: true,
          cached: true,
          guide: clonedGuide,
          message: 'This article was already processed - instant result!',
        });
      }
    }

    console.log('❌ Cache miss - processing article from scratch...');

    // Process article (this is faster than video - no download/transcription needed)
    const result = await processArticle(url, userId);

    // Save guide to database
    const { data: savedGuide, error: saveError } = await supabase
      .from('guides')
      .insert({
        user_id: userId,
        title: result.guide.title,
        type: result.guide.type,
        category: result.guide.category,
        ingredients: result.guide.ingredients,
        steps: result.guide.steps,
        transcription: result.articleContent, // Store article content as "transcription"
        source_url: url,
        source_type: 'article',
        language: result.guide.language,
        duration: result.guide.duration,
        servings: result.guide.servings,
        difficulty: result.guide.difficulty,
        tips: result.guide.tips,
        summary: result.guide.summary
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ Failed to save guide:', saveError);
      throw new Error('Failed to save guide to database');
    }

    console.log(`✅ Article processed and saved successfully (ID: ${savedGuide.id})`);

    return res.json({
      success: true,
      cached: false,
      guide: savedGuide,
      message: 'Article processed successfully!',
    });
  } catch (error) {
    console.error('Error processing article:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process article'
    });
  }
});

export default router;
