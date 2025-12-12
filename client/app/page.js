'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { guidesAPI, announcementsAPI } from '@/lib/api';
import GuideCard from '@/components/GuideCard';
import AddGuideModal from '@/components/AddGuideModal';
import GuideSuccessModal from '@/components/GuideSuccessModal';
import SearchBar from '@/components/SearchBar';
import AuthModal from '@/components/AuthModal';
import NotificationsModal from '@/components/NotificationsModal';
import Navigation from '@/components/Navigation';
import ProfileModal from '@/components/ProfileModal';
import { Plus, Moon, Sun, CheckSquare } from 'lucide-react';
import { bulkMoveToTrash } from '@/lib/trashActions';
import BulkActionToolbar from '@/components/BulkActionToolbar';


export default function Home() {
  const [user, setUser] = useState(null);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGuides, setSelectedGuides] = useState(new Set());
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: '',
  });

  // Double-swipe to exit state
  const [showExitToast, setShowExitToast] = useState(false);
  const [swipeAttempts, setSwipeAttempts] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const exitTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Load notification seen status from localStorage
    const seenNotifications = localStorage.getItem('seenNotifications') === 'true';
    setHasUnseenNotifications(!seenNotifications);

    checkUser();
    checkForNewAnnouncements();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadGuides(user.id);
    }
  }, [filters, user]);

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (!session?.user) {
      setLoading(false);
      setShowAuthModal(true);
    }
    // Note: loadGuides is called by useEffect when user state changes
  };

  const loadGuides = async (userId) => {
    try {
      setLoading(true);
      const response = await guidesAPI.getAll(userId, filters);
      setGuides(response.data || []);
    } catch (error) {
      console.error('Error loading guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setGuides([]);
    setShowAuthModal(true);
  };

  const handleGuideAdded = () => {
    if (user) {
      loadGuides(user.id);
    }
    setShowAddModal(false);
    setShowSuccessModal(true);
  };

  const handleGuideDeleted = () => {
    if (user) {
      loadGuides(user.id);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const checkForNewAnnouncements = async () => {
    try {
      const data = await announcementsAPI.getAll();
      const announcements = data.announcements || [];
      
      if (announcements.length === 0) {
        setHasUnseenNotifications(false);
        return;
      }

      const lastViewed = localStorage.getItem('lastViewedAnnouncements');
      
      if (!lastViewed) {
        setHasUnseenNotifications(announcements.length > 0);
        return;
      }

      const lastViewedDate = new Date(lastViewed);
      const hasNew = announcements.some(a => {
        const announcementDate = new Date(a.date);
        return announcementDate > lastViewedDate;
      });
      setHasUnseenNotifications(hasNew);
    } catch (error) {
      console.error('Error checking for new announcements:', error);
      setHasUnseenNotifications(false);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    const now = new Date().toISOString();
    localStorage.setItem('lastViewedAnnouncements', now);
    setHasUnseenNotifications(false);
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleProfileUpdated = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  // Bulk selection handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedGuides(new Set());
  };

  const toggleGuideSelection = (guideId) => {
    const newSelection = new Set(selectedGuides);
    if (newSelection.has(guideId)) {
      newSelection.delete(guideId);
    } else {
      newSelection.add(guideId);
    }
    setSelectedGuides(newSelection);
  };

  const selectAllGuides = () => {
    setSelectedGuides(new Set(guides.map(g => g.id)));
  };

  const clearSelection = () => {
    setSelectedGuides(new Set());
    setIsSelectionMode(false);
  };

  // Double-swipe to exit handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (swipeAttempts === 0) {
        setSwipeAttempts(1);
        setShowExitToast(true);

        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = setTimeout(() => {
          setShowExitToast(false);
        }, 1000);

        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
        }
        exitTimerRef.current = setTimeout(() => {
          setSwipeAttempts(0);
        }, 3000);
      } else if (swipeAttempts === 1) {
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
        }
        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
        }
        window.history.back();
      }
    }

    touchStartX.current = 0;
    touchStartY.current = 0;
  };

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  if (!user) {
    return (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-slate-900 flex"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation */}
      <Navigation
        user={user}
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        hasUnseenNotifications={hasUnseenNotifications}
        onOpenNotifications={handleOpenNotifications}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile top padding for fixed menu button */}
        <div className="lg:hidden h-16" />

        {/* Header */}
        <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-16 lg:top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            {/* Mobile: Stacked layout */}
            <div className="lg:hidden space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">Garde</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your personal recipe & guide keeper
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                    title="Add a new guide or recipe"
                  >
                    <Plus size={24} />
                  </button>
                  {guides.length > 0 && (
                    <button
                      onClick={toggleSelectionMode}
                      className={`p-2 rounded-lg transition ${
                        isSelectionMode
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                      title={isSelectionMode ? "Cancel Selection" : "Select multiple guides"}
                    >
                      <CheckSquare size={24} />
                    </button>
                  )}
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {darkMode ? <Sun size={24} /> : <Moon size={24} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop: Horizontal layout */}
            <div className="hidden lg:flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Garde</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your personal recipe & guide keeper
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                  title="Add a new guide or recipe"
                >
                  <Plus size={26} />
                </button>
                {guides.length > 0 && (
                  <button
                    onClick={toggleSelectionMode}
                    className={`p-2 rounded-lg transition ${
                      isSelectionMode
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                    title={isSelectionMode ? "Cancel Selection" : "Select multiple guides"}
                  >
                    <CheckSquare size={26} />
                  </button>
                )}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {darkMode ? <Sun size={26} /> : <Moon size={26} />}
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-3 sm:mt-4">
              <SearchBar filters={filters} onFiltersChange={setFilters} />
            </div>
          </div>
        </header>

        {/* Bulk Action Toolbar */}
        {isSelectionMode && (
          <BulkActionToolbar
            selectedGuides={selectedGuides}
            onClearSelection={clearSelection}
            onSelectAll={selectAllGuides}
            onActionComplete={async () => {
              if (user) {
                await loadGuides(user.id);
              }
              setSelectedGuides(new Set());
              setIsSelectionMode(false);
            }}
            totalGuides={guides.length}
          />
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : guides.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-24 w-24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No guides yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Get started by adding your first recipe or how-to guide
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition"
              >
                <Plus size={20} />
                Add Your First Guide
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {guides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  userId={user.id}
                  onDeleted={handleGuideDeleted}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedGuides.has(guide.id)}
                  onToggleSelection={() => toggleGuideSelection(guide.id)}
                />
              ))}
            </div>
          )}
        </main>

        {/* Add Guide Modal */}
        {showAddModal && (
          <AddGuideModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onGuideAdded={handleGuideAdded}
            userId={user.id}
          />
        )}

        {/* Success Modal */}
        <GuideSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          guideCount={guides.length}
        />

        {/* Notifications Modal */}
        <NotificationsModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        {/* Profile Modal */}
        <ProfileModal
          user={user}
          supabase={supabase}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdated={handleProfileUpdated}
        />

        {/* Exit Toast */}
        {showExitToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
            <div className="bg-gray-900 dark:bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Swipe again to exit</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
