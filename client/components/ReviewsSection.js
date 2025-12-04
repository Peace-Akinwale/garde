'use client';
import { useState, useEffect } from 'react';
import { Star, MessageSquare, Image as ImageIcon, X, Send, Loader, CheckCircle, AlertCircle, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [user, setUser] = useState(null);

  const router = useRouter();

  useEffect(() => {
    fetchReviews();
    checkUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, 'User:', session?.user?.email);
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`);
      setReviews(response.data.reviews);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        setUser(null);
        setAuthLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      setAuthLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
      setAuthLoading(false);
    }
  };

  const renderStars = (rating, size = 'w-5 h-5') => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">User Reviews</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          See what our community is saying about Garde
        </p>

        {stats.totalReviews > 0 && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center">
              {renderStars(Math.round(stats.averageRating))}
              <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating}
              </span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}

        {authLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader className="animate-spin w-5 h-5 text-indigo-600" />
            <span className="text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        ) : user ? (
          <button
            onClick={() => setShowReviewModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Write a Review
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to leave a review
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
            >
              Go to Home & Sign In
            </button>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader className="animate-spin w-12 h-12 text-indigo-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} renderStars={renderStars} />
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          onClose={() => setShowReviewModal(false)}
          onSubmit={() => {
            fetchReviews();
            setShowReviewModal(false);
          }}
        />
      )}
    </div>
  );
}

function ReviewCard({ review, renderStars }) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentPreview = review.content.length > 300
    ? review.content.slice(0, 300) + '...'
    : review.content;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/reviews` : '';
  const shareText = `Check out this ${review.rating}-star review of Garde: "${review.title}"`;

  const handleShare = (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-lg">
            {review.profiles?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {review.profiles?.full_name || 'Anonymous'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(review.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {renderStars(review.rating)}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title="Share review"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10 min-w-[180px]">
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Share on Twitter
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Share on Facebook
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Share on LinkedIn
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={copyLink}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {copied ? '✓ Link Copied!' : 'Copy Link'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{review.title}</h3>

      {/* Content */}
      <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
        {showFullContent ? review.content : contentPreview}
      </p>
      {review.content.length > 300 && (
        <button
          onClick={() => setShowFullContent(!showFullContent)}
          className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mb-4 font-medium"
        >
          {showFullContent ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Screenshots */}
      {review.screenshots && review.screenshots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {review.screenshots.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Screenshot ${idx + 1}`}
              className="rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition w-full h-32 object-cover"
              onClick={() => window.open(url, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Admin Responses */}
      {review.review_responses && review.review_responses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {review.review_responses.map((response) => (
            <div key={response.id} className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border-l-4 border-indigo-600">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  G
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Garde Team</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(response.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{response.response_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewModal({ onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (screenshots.length + files.length > 5) {
      setError('Maximum 5 screenshots allowed');
      return;
    }

    // Validate file sizes (5MB each)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError('Each screenshot must be under 5MB');
      return;
    }

    setScreenshots([...screenshots, ...files]);
    setError('');
  };

  const removeScreenshot = (idx) => {
    setScreenshots(screenshots.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (title.trim().length === 0) {
      setError('Please enter a title');
      return;
    }
    if (content.trim().length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be signed in to submit a review');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('title', title);
      formData.append('content', content);
      screenshots.forEach((file) => {
        formData.append('screenshots', file);
      });

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess(true);
      setTimeout(() => {
        onSubmit();
      }, 2000);
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.response?.data?.error || 'Failed to submit review. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Review Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for your feedback! We'll review and publish it soon. You'll receive an email notification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Write a Review</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {title.length}/200 characters
              </p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Review *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts about Garde..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {content.length} characters (minimum 10)
              </p>
            </div>

            {/* Screenshots */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Screenshots (Optional, max 5)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="screenshot-upload"
              />
              <label
                htmlFor="screenshot-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Add Screenshots</span>
              </label>

              {screenshots.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {screenshots.map((file, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {uploading ? (
                  <>
                    <Loader className="animate-spin w-5 h-5" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Review
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 dark:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
