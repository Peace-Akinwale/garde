import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import videoRoutes from './routes/video.js';
import guideRoutes from './routes/guides.js';
import webhookRoutes from './routes/webhooks.js';
import adminRoutes from './routes/admin.js';
import shoppingRoutes from './routes/shopping.js';
import remindersRoutes from './routes/reminders.js';
import reviewsRoutes from './routes/reviews.js';
import announcementsRoutes from './routes/announcements.js';
import { startReminderScheduler, checkReminders } from './services/reminderScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://garde-tau.vercel.app',
    'https://usegarde.com',
    'https://www.usegarde.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase client with service role (admin access)
// This bypasses Row Level Security for backend operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize OpenAI client (for Whisper)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Anthropic client (for Claude)
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(() => {
  // Directory already exists, ignore error
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Garde API',
    version: '1.2.0',
    status: 'running',
    message: 'Backend API for Garde - AI-powered recipe & guide extraction',
    endpoints: {
      health: '/health',
      video: '/api/video/*',
      guides: '/api/guides/*',
      webhooks: '/api/webhooks/*',
      admin: '/api/admin/*',
      shopping: '/api/shopping/*',
      reviews: '/api/reviews/*'
    },
    features: [
      'User activity tracking',
      'Email notifications',
      'Admin dashboard',
      'Shopping lists with smart links',
      'User reviews & ratings system'
    ],
    frontend: process.env.CLIENT_URL || 'https://usegarde.com'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Garde API is running',
    timestamp: new Date().toISOString(),
    features: {
      emailNotifications: !!process.env.RESEND_API_KEY,
      activityTracking: true,
      adminDashboard: true
    }
  });
});

// Routes
app.use('/api/video', videoRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/announcements', announcementsRoutes);

// Test endpoint to manually trigger reminder check
app.get('/api/test/check-reminders', async (req, res) => {
  try {
    console.log('📋 Manual reminder check triggered');
    await checkReminders();
    res.json({
      success: true,
      message: 'Reminder check completed. Check server logs for details.'
    });
  } catch (error) {
    console.error('Error in manual reminder check:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Garde server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ New features enabled: Activity tracking, Email notifications, Admin dashboard, Shopping lists, Reminders`);
  // Check notification configuration
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not configured - email notifications disabled');
  }
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('⚠️  VAPID keys not configured - push notifications disabled');
  }

  // Reminder scheduler - Disabled for now
  // startReminderScheduler();
  // console.log('✅ Reminder scheduler started');
});
