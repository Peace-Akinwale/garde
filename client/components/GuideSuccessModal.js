'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Star, X, Share2, PartyPopper } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GuideSuccessModal({ isOpen, onClose, guideCount }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [milestone, setMilestone] = useState(null);
  const [showReviewCTA, setShowReviewCTA] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      checkMilestone();
      checkShouldShowReviewPrompt();

      // Stop confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, guideCount]);

  const checkMilestone = () => {
    // Check if user hit a milestone
    const milestones = [1, 5, 10, 25, 50, 100];
    if (milestones.includes(guideCount)) {
      setMilestone(guideCount);
    } else {
      setMilestone(null);
    }
  };

  const checkShouldShowReviewPrompt = () => {
    // Don't show if user permanently dismissed
    if (localStorage.getItem('reviewPromptPermanentlyDismissed') === 'true') {
      setShowReviewCTA(false);
      return;
    }

    // Don't show if user already left a review
    if (localStorage.getItem('userLeftReview') === 'true') {
      setShowReviewCTA(false);
      return;
    }

    // Check last shown time (don't spam - wait at least 30 days)
    const lastShown = localStorage.getItem('reviewPromptLastShown');
    if (lastShown) {
      const daysSinceLastShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastShown < 30) {
        setShowReviewCTA(false);
        return;
      }
    }

    // Show at specific milestones: 5, 25, 50 guides
    const reviewMilestones = [5, 25, 50];
    if (reviewMilestones.includes(guideCount)) {
      setShowReviewCTA(true);
      localStorage.setItem('reviewPromptLastShown', Date.now().toString());
    } else {
      setShowReviewCTA(false);
    }
  };

  const handleReviewLater = () => {
    // User clicked "Maybe later" - respect their choice
    localStorage.setItem('reviewPromptLastShown', Date.now().toString());
    onClose();
  };

  const handleDontAskAgain = () => {
    // User doesn't want to see this again
    localStorage.setItem('reviewPromptPermanentlyDismissed', 'true');
    onClose();
  };

  const handleWriteReview = () => {
    // Track that user is writing a review
    localStorage.setItem('userLeftReview', 'true');
    router.push('/reviews');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 z-[60] pointer-events-none">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  background: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8'][
                    Math.floor(Math.random() * 6)
                  ]
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <CheckCircle className="w-20 h-20 text-green-500 animate-bounce-in" />
              {milestone && (
                <div className="absolute -top-2 -right-2">
                  <PartyPopper className="w-8 h-8 text-yellow-500 animate-spin-slow" />
                </div>
              )}
            </div>
          </div>

          {/* Milestone Celebration */}
          {milestone && (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
              <p className="text-center text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                🎉 Milestone Reached! 🎉
              </p>
              <p className="text-center text-gray-700 dark:text-gray-300">
                You've created <strong>{milestone} guides</strong>! Keep up the great work!
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Guide Created Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your guide has been extracted and saved to your collection.
            </p>

            {/* Review CTA - Only shown at milestones (5, 25, 50) */}
            {showReviewCTA && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 mb-6 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Enjoying Garde?
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  You've created {guideCount} guides! Help others discover Garde by leaving a review. Your feedback helps us improve and grow.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleWriteReview}
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Star className="w-5 h-5" />
                    Write a Review
                  </button>
                  <button
                    onClick={handleReviewLater}
                    className="w-full px-6 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleDontAskAgain}
                    className="w-full px-6 py-2 text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 transition"
                  >
                    Don't ask again
                  </button>
                </div>
              </div>
            )}

            {/* Secondary Actions */}
            {!showReviewCTA && (
              <div className="space-y-2">
                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 font-medium"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confetti CSS */}
      <style jsx>{`
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          border-radius: 50%;
          opacity: 0;
          animation: confetti-fall 3s ease-out forwards;
        }

        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes bounce-in {
          0%, 20%, 50%, 80%, 100% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.1);
          }
          60% {
            transform: scale(1.05);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-bounce-in {
          animation: bounce-in 1s ease-out;
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
