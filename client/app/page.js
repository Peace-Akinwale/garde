'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { guidesAPI, announcementsAPI } from '@/lib/api';
import GuideCard from '@/components/GuideCard';
import GuideListItem from '@/components/GuideListItem';
import AddGuideModal from '@/components/AddGuideModal';
import GuideSuccessModal from '@/components/GuideSuccessModal';
import SearchBar from '@/components/SearchBar';
import AuthModal from '@/components/AuthModal';
import NotificationsModal from '@/components/NotificationsModal';
import Navigation from '@/components/Navigation';
import ProfileModal from '@/components/ProfileModal';
import { Plus, LogOut, User, Moon, Sun, Bell, Grid3x3, List } from 'lucide-react';


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
  const [viewMode, setViewMode] = useState('grid');
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

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadGuides(session.user.id);
        }
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
    if (session?.user) {
      loadGuides(session.user.id);
    } else {
      setLoading(false);
      setShowAuthModal(true);
    }
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
    // Show success modal with celebration and smart review CTA
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

      // Get last viewed timestamp from localStorage
      const lastViewed = localStorage.getItem('lastViewedAnnouncements');
      
      if (!lastViewed) {
        // Never viewed before
        setHasUnseenNotifications(true);
        return;
      }

      // Check if there are announcements newer than last viewed
      const lastViewedDate = new Date(lastViewed);
      const hasNew = announcements.some(a => new Date(a.date) > lastViewedDate);
      setHasUnseenNotifications(hasNew);
    } catch (error) {
      console.error('Error checking for new announcements:', error);
      setHasUnseenNotifications(false);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setHasUnseenNotifications(false);
    localStorage.setItem('seenNotifications', 'true');
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleProfileUpdated = async () => {
    // Refresh user data after profile update
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
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

    // Check if it's a horizontal swipe (left or right)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      // Horizontal swipe detected
      if (swipeAttempts === 0) {
        // First swipe - show toast for 1 second
        setSwipeAttempts(1);
        setShowExitToast(true);

        // Hide toast after 1 second
        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = setTimeout(() => {
          setShowExitToast(false);
        }, 1000);

        // Reset swipe counter after 3 seconds
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
        }
        exitTimerRef.current = setTimeout(() => {
          setSwipeAttempts(0);
        }, 3000);
      } else if (swipeAttempts === 1) {
        // Second swipe within time window - exit
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
        }
        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
        }
        window.history.back(); // Exit app
      }
    }

    touchStartX.current = 0;
    touchStartY.current = 0;
  };

  // Cleanup timers on unmount
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
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile top padding for fixed menu button */}
        <div className="lg:hidden h-16" />

        {/* Header */}
        <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-16 lg:top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Garde</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your personal recipe & guide keeper
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2
rounded-lg hover:bg-primary-600 transition"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Add Guide</span>
              </button>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg
p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  title="Grid View"
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  title="List View"
                >
                  <List size={18} />
                </button>
              </div>
              <button
                onClick={handleOpenNotifications}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition relative"
                title="What's New"
              >
                <Bell size={20} />
                {/* New updates indicator */}
                {hasUnseenNotifications && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4">
            <SearchBar filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>
      </header>

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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {guides.map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                userId={user.id}
                onDeleted={handleGuideDeleted}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {guides.map((guide) => (
              <GuideListItem
                key={guide.id}
                guide={guide}
                userId={user.id}
                onDeleted={handleGuideDeleted}
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

      {/* Success Modal with Celebrations & Smart Review CTA */}
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

      {/* Exit Toast - Double Swipe to Exit */}
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
