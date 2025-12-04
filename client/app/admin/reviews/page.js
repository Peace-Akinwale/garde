'use client';
import { useState, useEffect } from 'react';
import { Star, Eye, EyeOff, Trash2, MessageSquare, CheckCircle, XCircle, Loader, ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function AdminReviewsPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all'); // all, pending, published, hidden
  const [respondingTo, setRespondingTo] = useState(null);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      fetchReviews();
    }
  }, [user, isAdmin, filter]);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/admin/all`,
        {
          params: { status: filter !== 'all' ? filter : undefined },
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      setReviews(response.data.reviews);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const updateStatus = async (reviewId, status) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/admin/${reviewId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      fetchReviews();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update review status');
    }
  };

  const deleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/admin/${reviewId}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Admin Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Review Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage user reviews and provide responses</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total" value={stats.total} color="blue" />
          <StatCard label="Pending" value={stats.pending} color="yellow" />
          <StatCard label="Published" value={stats.published} color="green" />
          <StatCard label="Hidden" value={stats.hidden} color="red" />
          <StatCard label="Avg Rating" value={stats.averageRating ? `${stats.averageRating}⭐` : 'N/A'} color="purple" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {['all', 'pending', 'published', 'hidden'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-medium capitalize whitespace-nowrap ${
                filter === f
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {f} {f !== 'all' && stats[f] > 0 && `(${stats[f]})`}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No reviews found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <AdminReviewCard
                key={review.id}
                review={review}
                onUpdateStatus={updateStatus}
                onDelete={deleteReview}
                onRespond={() => setRespondingTo(review)}
              />
            ))}
          </div>
        )}

        {/* Response Modal */}
        {respondingTo && (
          <ResponseModal
            review={respondingTo}
            onClose={() => setRespondingTo(null)}
            onSuccess={fetchReviews}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
  };

  return (
    <div className={`${colors[color]} rounded-lg p-4`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value || 0}</p>
    </div>
  );
}

function AdminReviewCard({ review, onUpdateStatus, onDelete, onRespond }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                review.status === 'published'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : review.status === 'pending'
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                  : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {review.status}
            </span>
            {!review.is_read && (
              <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                NEW
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{review.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            by {review.profiles?.full_name || 'Anonymous'} ({review.profiles?.email}) •{' '}
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {review.status === 'pending' && (
            <button
              onClick={() => onUpdateStatus(review.id, 'published')}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
              title="Publish"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          )}
          {review.status === 'published' && (
            <button
              onClick={() => onUpdateStatus(review.id, 'hidden')}
              className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
              title="Hide"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          )}
          {review.status === 'hidden' && (
            <button
              onClick={() => onUpdateStatus(review.id, 'published')}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
              title="Publish"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onRespond}
            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
            title="Respond"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(review.id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">{review.content}</p>

      {/* Screenshots */}
      {review.screenshots && review.screenshots.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {review.screenshots.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Screenshot ${idx + 1}`}
              className="rounded border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 w-full h-24 object-cover"
              onClick={() => window.open(url, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Responses */}
      {review.review_responses && review.review_responses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Responses:</p>
          {review.review_responses.map((response) => (
            <div key={response.id} className="bg-indigo-50 dark:bg-indigo-900/20 rounded p-3 mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {new Date(response.created_at).toLocaleDateString()}
              </p>
              <p className="text-gray-700 dark:text-gray-300">{response.response_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResponseModal({ review, onClose, onSuccess }) {
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClientComponentClient();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (responseText.trim().length < 5) {
      setError('Response must be at least 5 characters');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/admin/${review.id}/respond`,
        { response_text: responseText },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      onSuccess();
      onClose();
      alert('Response sent successfully! User will be notified via email.');
    } catch (error) {
      console.error('Error submitting response:', error);
      setError('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Respond to Review</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Review by {review.profiles?.full_name}
          </p>
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{review.title}</h3>
          <p className="text-gray-700 dark:text-gray-300">{review.content}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Type your response... (minimum 5 characters)"
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-4 dark:bg-gray-700 dark:text-white"
          />

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="animate-spin w-5 h-5" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Response
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 dark:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
