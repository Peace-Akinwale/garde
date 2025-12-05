import express from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import { sendReviewNotifications } from '../services/emailNotifications.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure multer for screenshot uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Authenticate user from JWT token
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Check if user is admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

/**
 * GET /api/reviews - Get all published reviews (with responses)
 */
router.get('/', async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles!reviews_user_id_profiles_fkey (email, full_name, avatar_url),
        review_responses (
          id,
          response_text,
          created_at,
          admin_user_id,
          profiles!review_responses_admin_user_id_profiles_fkey (full_name, avatar_url)
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      reviews,
      stats: {
        totalReviews: reviews.length,
        averageRating: parseFloat(avgRating)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * POST /api/reviews - Create a new review
 */
router.post('/', authenticateUser, upload.array('screenshots', 5), async (req, res) => {
  try {
    const { rating, title, content } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ error: 'Title must be 200 characters or less' });
    }
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: 'Review content must be at least 10 characters' });
    }

    // PHASE 2: Auto-moderation spam detection
    const spamKeywords = ['viagra', 'cialis', 'casino', 'forex', 'crypto scam', 'buy now', 'click here', 'limited time', 'act now', 'free money'];
    const suspiciousPatterns = [
      /(.)\1{10,}/i, // Repeated characters (e.g., "aaaaaaaaaa")
      /https?:\/\//gi, // Multiple URLs
      /\b\d{10,}\b/g // Long number sequences (phone numbers)
    ];

    let flagged = false;
    let flagReason = '';

    // Check for spam keywords
    const combinedText = `${title} ${content}`.toLowerCase();
    const foundKeywords = spamKeywords.filter(keyword => combinedText.includes(keyword));
    if (foundKeywords.length > 0) {
      flagged = true;
      flagReason = `Contains spam keywords: ${foundKeywords.join(', ')}`;
    }

    // Check for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(combinedText)) {
        flagged = true;
        if (flagReason) flagReason += '; ';
        flagReason += 'Suspicious pattern detected';
        break;
      }
    }

    // Check for ALL CAPS (more than 50% uppercase)
    const upperCaseCount = (title + content).replace(/[^A-Z]/g, '').length;
    const totalLetters = (title + content).replace(/[^A-Za-z]/g, '').length;
    if (totalLetters > 20 && upperCaseCount / totalLetters > 0.5) {
      flagged = true;
      if (flagReason) flagReason += '; ';
      flagReason += 'Excessive capitalization';
    }

    // Very short reviews with 5 stars (potential fake positive reviews)
    if (parseInt(rating) === 5 && content.trim().length < 30) {
      flagged = true;
      if (flagReason) flagReason += '; ';
      flagReason += 'Very short 5-star review (potential fake)';
    }

    // Upload screenshots to Supabase Storage
    const screenshotUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${req.user.id}/${Date.now()}_${file.originalname}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('review-screenshots')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Screenshot upload error:', uploadError);
          continue; // Skip failed uploads
        }

        const { data: { publicUrl } } = supabase.storage
          .from('review-screenshots')
          .getPublicUrl(fileName);

        screenshotUrls.push(publicUrl);
      }
    }

    // Create review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        user_id: req.user.id,
        rating: parseInt(rating),
        title: title.trim(),
        content: content.trim(),
        screenshots: screenshotUrls,
        status: 'pending', // Pending admin approval
        flagged_for_review: flagged,
        flag_reason: flagged ? flagReason : null
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', req.user.id)
      .single();

    // Send notification email to admin (non-blocking)
    try {
      await sendReviewNotifications('new_review', {
        reviewId: review.id,
        userEmail: req.user.email,
        userName: profile?.full_name || 'Anonymous',
        rating: review.rating,
        title: review.title,
        content: review.content
      });
    } catch (emailError) {
      console.error('Failed to send review notification:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Review submitted successfully and is pending approval',
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

/**
 * GET /api/reviews/my-reviews - Get current user's reviews
 */
router.get('/my-reviews', authenticateUser, async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        review_responses (
          id,
          response_text,
          created_at,
          profiles!review_responses_admin_user_id_profiles_fkey (full_name, avatar_url)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch your reviews' });
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

/**
 * GET /api/reviews/admin/all - Get all reviews (pending + published + hidden)
 */
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query; // Filter by status: pending, published, hidden

    let query = supabase
      .from('reviews')
      .select(`
        *,
        profiles!reviews_user_id_profiles_fkey (email, full_name, avatar_url),
        review_responses (
          id,
          response_text,
          created_at,
          profiles!review_responses_admin_user_id_profiles_fkey (full_name, avatar_url)
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reviews, error } = await query;

    if (error) throw error;

    // Calculate stats
    const stats = {
      total: reviews.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      published: reviews.filter(r => r.status === 'published').length,
      hidden: reviews.filter(r => r.status === 'hidden').length,
      unread: reviews.filter(r => !r.is_read).length,
      averageRating: reviews.length > 0
        ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : 0
    };

    res.json({ reviews, stats });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * PATCH /api/reviews/admin/:id/status - Update review status
 */
router.patch('/admin/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, is_read } = req.body;

    if (status && !['pending', 'published', 'hidden'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (typeof is_read === 'boolean') updates.is_read = is_read;

    const { data: review, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        profiles!reviews_user_id_profiles_fkey (email, full_name)
      `)
      .single();

    if (error) throw error;

    // Send email notification if review was published
    if (status === 'published') {
      try {
        await sendReviewNotifications('review_published', {
          reviewId: review.id,
          userEmail: review.profiles.email,
          userName: review.profiles.full_name || 'there',
          reviewTitle: review.title
        });
      } catch (emailError) {
        console.error('Failed to send published notification:', emailError);
      }
    }

    res.json({
      message: 'Review status updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

/**
 * POST /api/reviews/admin/:id/respond - Add admin response to review
 */
router.post('/admin/:id/respond', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { response_text } = req.body;

    if (!response_text || response_text.trim().length < 5) {
      return res.status(400).json({ error: 'Response must be at least 5 characters' });
    }

    // Get review details
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_user_id_profiles_fkey (email, full_name)')
      .eq('id', id)
      .single();

    if (reviewError) throw reviewError;

    // Create response
    const { data: response, error: responseError } = await supabase
      .from('review_responses')
      .insert({
        review_id: id,
        admin_user_id: req.user.id,
        response_text: response_text.trim()
      })
      .select(`
        *,
        profiles!review_responses_admin_user_id_profiles_fkey (full_name, avatar_url)
      `)
      .single();

    if (responseError) throw responseError;

    // Send email notification to user
    try {
      await sendReviewNotifications('admin_responded', {
        reviewId: review.id,
        userEmail: review.profiles.email,
        userName: review.profiles.full_name || 'there',
        reviewTitle: review.title,
        responseText: response_text.trim()
      });
    } catch (emailError) {
      console.error('Failed to send response notification:', emailError);
    }

    res.status(201).json({
      message: 'Response added successfully',
      response
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

/**
 * DELETE /api/reviews/admin/:id - Delete a review (admin only)
 */
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get review to delete screenshots
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('screenshots')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete screenshots from storage
    if (review.screenshots && review.screenshots.length > 0) {
      for (const url of review.screenshots) {
        // Extract file path from URL
        const urlParts = url.split('/review-screenshots/');
        if (urlParts.length > 1) {
          const fileName = urlParts[1];
          await supabase.storage
            .from('review-screenshots')
            .remove([fileName]);
        }
      }
    }

    // Delete review (cascade will delete responses)
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

/**
 * GET /api/reviews/admin/stats - Get review statistics
 */
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_review_stats');

    if (error) throw error;

    res.json({ stats: data });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
});

// ==========================================
// PHASE 2: REVIEW VOTING
// ==========================================

/**
 * POST /api/reviews/:id/vote - Vote for a review as helpful
 */
router.post('/:id/vote', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('review_votes')
      .select('id')
      .eq('review_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted for this review' });
    }

    // Create vote
    const { error: voteError } = await supabase
      .from('review_votes')
      .insert({
        review_id: id,
        user_id: req.user.id
      });

    if (voteError) throw voteError;

    // Get updated helpful count
    const { data: review } = await supabase
      .from('reviews')
      .select('helpful_count')
      .eq('id', id)
      .single();

    res.json({
      message: 'Vote recorded successfully',
      helpful_count: review?.helpful_count || 0
    });
  } catch (error) {
    console.error('Error voting for review:', error);
    res.status(500).json({ error: 'Failed to vote for review' });
  }
});

/**
 * DELETE /api/reviews/:id/vote - Remove vote from a review
 */
router.delete('/:id/vote', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { error: deleteError } = await supabase
      .from('review_votes')
      .delete()
      .eq('review_id', id)
      .eq('user_id', req.user.id);

    if (deleteError) throw deleteError;

    // Get updated helpful count
    const { data: review } = await supabase
      .from('reviews')
      .select('helpful_count')
      .eq('id', id)
      .single();

    res.json({
      message: 'Vote removed successfully',
      helpful_count: review?.helpful_count || 0
    });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

/**
 * GET /api/reviews/:id/vote-status - Check if user voted for a review
 */
router.get('/:id/vote-status', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: vote } = await supabase
      .from('review_votes')
      .select('id')
      .eq('review_id', id)
      .eq('user_id', req.user.id)
      .single();

    res.json({ hasVoted: !!vote });
  } catch (error) {
    console.error('Error checking vote status:', error);
    res.status(500).json({ error: 'Failed to check vote status' });
  }
});

// ==========================================
// PHASE 2: USER BADGES
// ==========================================

/**
 * GET /api/reviews/badges/:userId - Get user's badges
 */
router.get('/badges/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: badges, error } = await supabase.rpc('get_user_badges', {
      user_uuid: userId
    });

    if (error) throw error;

    res.json({ badges });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ error: 'Failed to fetch user badges' });
  }
});

// ==========================================
// PHASE 2: CSV EXPORT
// ==========================================

/**
 * GET /api/reviews/admin/export - Export all reviews as CSV
 */
router.get('/admin/export', requireAdmin, async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles!reviews_user_id_profiles_fkey (email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Build CSV
    const headers = ['ID', 'Date', 'Status', 'Rating', 'Title', 'Content', 'User Name', 'User Email', 'Helpful Votes', 'Flagged', 'Flag Reason'];
    const rows = reviews.map(r => [
      r.id,
      new Date(r.created_at).toISOString(),
      r.status,
      r.rating,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.content || '').replace(/"/g, '""')}"`,
      `"${(r.profiles?.full_name || 'Anonymous').replace(/"/g, '""')}"`,
      r.profiles?.email || '',
      r.helpful_count || 0,
      r.flagged_for_review ? 'Yes' : 'No',
      `"${(r.flag_reason || '').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="garde-reviews-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting reviews:', error);
    res.status(500).json({ error: 'Failed to export reviews' });
  }
});

export default router;
