import express from 'express';
import { upload } from '../config/multer.js';
import { processVideoJob, getJobStatus, getUserJobs } from '../services/jobProcessor.js';
import { supabase } from '../index.js';

const router = express.Router();

/**
 * POST /api/video/process-url
 * Submit video URL for background processing
 * Returns immediately with job ID - user can close browser!
 */
router.post('/process-url', async (req, res) => {
  try {
    const { url, userId } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`📥 Processing request for URL: ${url}`);

    // 🚀 CACHE CHECK: See if ANY user has already processed this exact URL
    console.log('🔍 Checking cache for existing guide...');
    const { data: existingGuide, error: cacheCheckError } = await supabase
      .from('guides')
      .select('id, title, type, category, ingredients, steps, transcription, language, duration, servings, difficulty, tips, summary')
      .eq('source_url', url)
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
          source_type: 'url',
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
        console.error('Clone error details:', JSON.stringify(cloneError, null, 2));
        console.log('Falling back to normal processing...');
        // Fall through to normal processing
      } else {
        // Return cached result immediately (< 1 second response!)
        console.log(`🎉 Cache hit! Guide cloned successfully (ID: ${clonedGuide.id}) for user ${userId}`);
        console.log(`📊 Cloned guide details: ${clonedGuide.title} | Type: ${clonedGuide.type}`);
        return res.json({
          success: true,
          cached: true,
          guide: clonedGuide,
          message: 'This video was already processed - instant result!',
          transcription: {
            text: existingGuide.transcription,
            language: existingGuide.language
          }
        });
      }
    }

    console.log('❌ Cache miss - processing video from scratch...');

    // Create job record in database
    const { data: job, error } = await supabase
      .from('processing_jobs')
      .insert({
        user_id: userId,
        job_type: 'video_url',
        video_url: url,
        status: 'pending',
        progress: 0,
        current_step: 'Queued...'
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Job ${job.id} created - responding to client immediately`);

    // Return job ID immediately FIRST
    res.json({
      success: true,
      jobId: job.id,
      message: 'Video processing started. You can close this page and come back later!',
      status: 'pending'
    });

    // THEN start processing in background (after response sent)
    // Use setImmediate to ensure response is fully sent first
    setImmediate(() => {
      processVideoJob(job.id, url, false, userId).catch(err => {
        console.error(`Background processing failed for job ${job.id}:`, err);
      });
      console.log(`Background processing started for job ${job.id}`);
    });

  } catch (error) {
    console.error('Error creating video processing job:', error);
    res.status(500).json({
      error: 'Failed to create processing job',
      message: error.message,
    });
  }
});

/**
 * POST /api/video/process-upload
 * Upload and process video file in background
 * Returns immediately with job ID
 */
router.post('/process-upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`Creating background job for uploaded file: ${req.file.originalname}`);

    // Create job record
    const { data: job, error } = await supabase
      .from('processing_jobs')
      .insert({
        user_id: userId,
        job_type: 'video_upload',
        video_file_path: req.file.path,
        status: 'pending',
        progress: 0,
        current_step: 'Queued...',
        metadata: {
          originalFilename: req.file.originalname,
          fileSize: req.file.size
        }
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Job ${job.id} created for file upload - responding immediately`);

    // Return immediately FIRST
    res.json({
      success: true,
      jobId: job.id,
      message: 'Video uploaded and processing started. You can close this page!',
      status: 'pending'
    });

    // THEN start processing in background (after response sent)
    setImmediate(() => {
      processVideoJob(job.id, req.file.path, true, userId).catch(err => {
        console.error(`Background processing failed for job ${job.id}:`, err);
      });
      console.log(`Background processing started for job ${job.id}`);
    });

  } catch (error) {
    console.error('Error creating upload processing job:', error);
    res.status(500).json({
      error: 'Failed to create processing job',
      message: error.message,
    });
  }
});

/**
 * GET /api/video/job/:jobId
 * Check status of a processing job
 * Frontend polls this endpoint to get updates
 */
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const job = await getJobStatus(jobId, userId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        currentStep: job.current_step,
        transcription: job.transcription,
        guide: job.guide,
        error: job.error_message,
        createdAt: job.created_at,
        completedAt: job.completed_at
      }
    });

  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      error: 'Failed to get job status',
      message: error.message,
    });
  }
});

/**
 * GET /api/video/jobs
 * Get all jobs for a user (for job history UI)
 */
router.get('/jobs', async (req, res) => {
  try {
    const { userId, limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const jobs = await getUserJobs(userId, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        currentStep: job.current_step,
        jobType: job.job_type,
        videoUrl: job.video_url,
        createdAt: job.created_at,
        completedAt: job.completed_at,
        guide: job.guide
      }))
    });

  } catch (error) {
    console.error('Error getting user jobs:', error);
    res.status(500).json({
      error: 'Failed to get jobs',
      message: error.message,
    });
  }
});

export default router;
