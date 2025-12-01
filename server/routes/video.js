import express from 'express';
import { upload } from '../config/multer.js';
import { processVideo } from '../services/videoProcessor.js';

const router = express.Router();

/**
 * POST /api/video/process-url
 * Process video from URL (TikTok, YouTube, Instagram)
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

    console.log(`Processing video from URL: ${url}`);

    const result = await processVideo(url, false, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error processing video URL:', error);
    res.status(500).json({
      error: 'Failed to process video',
      message: error.message,
    });
  }
});

/**
 * POST /api/video/process-upload
 * Process uploaded video file
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

    console.log(`Processing uploaded video: ${req.file.originalname}`);

    const result = await processVideo(req.file.path, true, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error processing uploaded video:', error);
    res.status(500).json({
      error: 'Failed to process video',
      message: error.message,
    });
  }
});

export default router;
