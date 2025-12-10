import { supabase } from '../index.js';
import { processVideo } from './videoProcessor.js';
import fsPromises from 'fs/promises';
import fs from 'fs';

/**
 * Update job status in database
 */
async function updateJobStatus(jobId, updates) {
  try {
    const { error } = await supabase
      .from('processing_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) throw error;

    // Only log status changes and errors, not all updates
    if (updates.status === 'completed') {
      console.log(`✓ Job ${jobId}: Complete`);
    } else if (updates.status === 'failed') {
      console.log(`✗ Job ${jobId}: Failed - ${updates.error_message}`);
    }
  } catch (error) {
    console.error('Error updating job status:', error);
  }
}

/**
 * Process a video job in the background
 * This runs asynchronously and updates the database as it progresses
 * Now with LIVE DISCOVERIES for engaging UI!
 */
export async function processVideoJob(jobId, videoSource, isFile, userId) {
  console.log(`Starting background processing for job ${jobId}`);

  try {
    // Mark as processing - Phase 1: Starting
    await updateJobStatus(jobId, {
      status: 'processing',
      started_at: new Date().toISOString(),
      progress: 10,
      current_step: 'Starting analysis...',
      discoveries: {
        title: '',
        ingredients: [],
        steps: [],
        metadata: {
          ingredientCount: 0,
          stepCount: 0,
          duration: null,
          difficulty: null,
          servings: null
        }
      }
    });

    // Phase 2: Video download/audio extraction
    await updateJobStatus(jobId, {
      progress: 25,
      current_step: isFile ? 'Analyzing video...' : 'Fetching video...'
    });

    // Process the video (this is the long-running task)
    const result = await processVideo(videoSource, isFile, userId);

    // Phase 3: Extraction complete - Stream discoveries incrementally
    // Simulate streaming by sending ingredients in batches
    const guide = result.guide;
    const ingredients = guide.ingredients || [];
    const steps = guide.steps || [];

    // Send title first (progress: 40%)
    await updateJobStatus(jobId, {
      progress: 40,
      current_step: 'Extracting details...',
      discoveries: {
        title: guide.title || 'Untitled Guide',
        ingredients: [],
        steps: [],
        metadata: {
          ingredientCount: ingredients.length,
          stepCount: steps.length,
          duration: guide.duration,
          difficulty: guide.difficulty,
          servings: guide.servings
        }
      }
    });

    // Send ingredients in batches (progress: 40% → 65%)
    const ingredientBatchSize = Math.ceil(ingredients.length / 3) || 1;
    for (let i = 0; i < ingredients.length; i += ingredientBatchSize) {
      const batch = ingredients.slice(0, i + ingredientBatchSize);
      const progressPercent = 40 + Math.floor((batch.length / ingredients.length) * 25);

      await updateJobStatus(jobId, {
        progress: progressPercent,
        current_step: `Found ${batch.length} ingredients...`,
        discoveries: {
          title: guide.title || 'Untitled Guide',
          ingredients: batch,
          steps: [],
          metadata: {
            ingredientCount: ingredients.length,
            stepCount: steps.length,
            duration: guide.duration,
            difficulty: guide.difficulty,
            servings: guide.servings
          }
        }
      });

      // Small delay for smoother animation
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Send steps in batches (progress: 65% → 90%)
    const stepBatchSize = Math.ceil(steps.length / 3) || 1;
    for (let i = 0; i < steps.length; i += stepBatchSize) {
      const batch = steps.slice(0, i + stepBatchSize);
      const progressPercent = 65 + Math.floor((batch.length / steps.length) * 25);

      await updateJobStatus(jobId, {
        progress: progressPercent,
        current_step: `Building step ${batch.length}...`,
        discoveries: {
          title: guide.title || 'Untitled Guide',
          ingredients: ingredients,
          steps: batch,
          metadata: {
            ingredientCount: ingredients.length,
            stepCount: steps.length,
            duration: guide.duration,
            difficulty: guide.difficulty,
            servings: guide.servings
          }
        }
      });

      // Small delay for smoother animation
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // Phase 4: Final polish (progress: 90% → 100%)
    await updateJobStatus(jobId, {
      progress: 95,
      current_step: 'Finalizing your guide...',
      discoveries: {
        title: guide.title || 'Untitled Guide',
        ingredients: ingredients,
        steps: steps,
        metadata: {
          ingredientCount: ingredients.length,
          stepCount: steps.length,
          duration: guide.duration,
          difficulty: guide.difficulty,
          servings: guide.servings
        }
      }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Mark as completed with full results
    await updateJobStatus(jobId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress: 100,
      current_step: 'Complete!',
      transcription: result.transcription,
      guide: result.guide,
      metadata: result.metadata,
      discoveries: {
        title: guide.title || 'Untitled Guide',
        ingredients: ingredients,
        steps: steps,
        metadata: {
          ingredientCount: ingredients.length,
          stepCount: steps.length,
          duration: guide.duration,
          difficulty: guide.difficulty,
          servings: guide.servings
        }
      }
    });

    console.log(`✓ Job ${jobId} completed - ${result.guide.title || 'Guide'}`);

    // CLEANUP: Delete original uploaded file if it was a file upload
    if (isFile && videoSource) {
      try {
        if (fs.existsSync(videoSource)) {
          await fsPromises.unlink(videoSource);
          console.log(`🗑️ Cleaned up uploaded file: ${videoSource}`);
        }
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to delete uploaded file: ${cleanupError.message}`);
      }
    }

    return result;

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);

    // Mark as failed
    await updateJobStatus(jobId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      progress: 0,
      current_step: 'Failed',
      error_message: error.message
    });

    // CLEANUP: Delete original uploaded file even on failure
    if (isFile && videoSource) {
      try {
        if (fs.existsSync(videoSource)) {
          await fsPromises.unlink(videoSource);
          console.log(`🗑️ Cleaned up uploaded file after error: ${videoSource}`);
        }
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to delete uploaded file: ${cleanupError.message}`);
      }
    }

    throw error;
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId, userId) {
  try {
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting job status:', error);
    throw error;
  }
}

/**
 * Get all jobs for a user (with pagination)
 */
export async function getUserJobs(userId, limit = 20, offset = 0) {
  try {
    const { data, error} = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user jobs:', error);
    throw error;
  }
}
