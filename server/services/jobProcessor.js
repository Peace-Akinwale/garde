import { supabase } from '../index.js';
import { processVideo, extractGuideFromText, fetchTranscriptSupadata } from './videoProcessor.js';
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
    // YouTube transcript check - using Supadata API
    const isYouTube = !isFile && (videoSource.includes('youtube.com') || videoSource.includes('youtu.be'));
    if (isYouTube) {
      await updateJobStatus(jobId, {status: 'processing', started_at: new Date().toISOString(), progress: 10, current_step: 'Fetching transcript...'});
      const transcriptData = await fetchTranscriptSupadata(videoSource);
      if (transcriptData) {
        await updateJobStatus(jobId, {progress: 40, current_step: 'Found captions!'});
        const guide = await extractGuideFromText(transcriptData.text, transcriptData.language);
        await updateJobStatus(jobId, {progress: 80, current_step: 'Analyzing content...'});

        // Check if AI detected non-instructional content
        const summary = guide.summary?.toLowerCase() || '';
        const isNonInstructional =
          summary.includes('no instructional content') ||
          summary.includes('no recipe') ||
          summary.includes('no how-to guide') ||
          summary.includes('appears to be lyrics') ||
          summary.includes('appears to be poetry') ||
          summary.includes('only audio narration') ||
          summary.includes('no visual content successfully extracted');

        if (isNonInstructional) {
          // Content is not instructional - fail the job with helpful message
          throw new Error(
            'This YouTube video does not contain instructional content (recipe, how-to, or tutorial). ' +
            'It appears to be music, poetry, or casual conversation. ' +
            'Please try a video with clear cooking steps, DIY instructions, or tutorial content.'
          );
        }

        await updateJobStatus(jobId, {status: 'completed', completed_at: new Date().toISOString(), progress: 100, current_step: 'Complete!', transcription: {text: transcriptData.text, language: transcriptData.language, source: 'supadata_api'}, guide: guide, metadata: {processedAt: new Date().toISOString(), source: 'url', method: 'supadata_transcript'}});
        return {success: true, transcription: transcriptData, guide: guide, metadata: {processedAt: new Date().toISOString(), source: 'url', method: 'supadata_transcript'}};
      } else {
        // Supadata failed - fall back to download + Whisper
        console.log('📹 Supadata transcript failed - falling back to video download...');
        await updateJobStatus(jobId, {progress: 15, current_step: 'Transcript unavailable, downloading video...'});
      }
    }

    // Mark as processing (only for non-YouTube or if YouTube transcript was not attempted)
    if (!isYouTube) {
      await updateJobStatus(jobId, {
        status: 'processing',
        started_at: new Date().toISOString(),
        progress: 10,
        current_step: 'Downloading video...'
      });
    }

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

    // Make error messages user-friendly
    let userFriendlyMessage = error.message;

    // Vision API errors - replace technical message with user-friendly one
    if (error.message.includes('Vision analysis failed') ||
        error.message.includes('Vision API failed') ||
        error.message.includes('failed to analyze most frames')) {
      userFriendlyMessage = 'Unable to process this video. Please download the video to your device and use the "Upload File" option instead.';
    }

    // Bot detection errors
    else if (error.message.includes('bot') ||
             error.message.includes('Sign in') ||
             error.message.includes('blocked automated downloads')) {
      userFriendlyMessage = 'Unable to download this video due to platform restrictions. Please download the video to your device and use the "Upload File" option instead.';
    }

    // Mark as failed
    await updateJobStatus(jobId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      progress: 0,
      current_step: 'Failed',
      error_message: userFriendlyMessage
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
