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
 */
export async function processVideoJob(jobId, videoSource, isFile, userId) {
  console.log(`Starting background processing for job ${jobId}`);

  try {
    // Mark as processing
    await updateJobStatus(jobId, {
      status: 'processing',
      started_at: new Date().toISOString(),
      progress: 10,
      current_step: 'Downloading video...'
    });

    // Update progress during processing
    const originalProcessVideo = processVideo;

    // Process the video (this is the long-running task)
    await updateJobStatus(jobId, {
      progress: 30,
      current_step: isFile ? 'Extracting audio...' : 'Downloading video...'
    });

    const result = await processVideo(videoSource, isFile, userId);

    // Update to transcribing
    await updateJobStatus(jobId, {
      progress: 70,
      current_step: 'Analyzing content...'
    });

    // Mark as completed with results
    await updateJobStatus(jobId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress: 100,
      current_step: 'Complete!',
      transcription: result.transcription,
      guide: result.guide,
      metadata: result.metadata
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
    const { data, error } = await supabase
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
