'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { guidesAPI, announcementsAPI } from '@/lib/api';
import GuideCard from '@/components/GuideCard';
import GuideListItem from '@/components/GuideListItem';
import AddGuideModal from '@/components/AddGuideModal';
import AddArticleModal from '@/components/AddArticleModal';
import GuideSuccessModal from '@/components/GuideSuccessModal';
import SearchBar from '@/components/SearchBar';
import AuthModal from '@/components/AuthModal';
import NotificationsModal from '@/components/NotificationsModal';
import Navigation from '@/components/Navigation';
import ProfileModal from '@/components/ProfileModal';
import { Plus, LogOut, User, Moon, Sun, Bell, Grid3x3, List, FileText, CheckSquare, Trash2, X } from 'lucide-react';
import { bulkMoveToTrash } from '@/lib/trashActions';
import BulkActionToolbar from '@/components/BulkActionToolbar';


export default function Home() {
  const [user, setUser] = useState(null);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
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
      console.log('📥 Loading guides for user:', userId);
      const response = await guidesAPI.getAll(userId, filters);
      console.log('📊 Guides loaded:', response.data?.length || 0, 'guides');
      if (response.data?.length > 0) {
        console.log('📋 Latest guide:', response.data[0].title);
      }
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
    setShowArticleModal(false);
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
        // Never viewed before - show red dot if there are any announcements
        setHasUnseenNotifications(announcements.length > 0);
        return;
      }

      // Check if there are announcements newer than last viewed
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
    // Mark current time as last viewed when opening notifications
    const now = new Date().toISOString();
    localStorage.setItem('lastViewedAnnouncements', now);
    setHasUnseenNotifications(false);
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

  const handleBulkDelete = async () => {
    if (selectedGuides.size === 0) {
      alert('Please select guides to delete');
      return;
    }

    const confirmed = confirm(
      `Delete ${selectedGuides.size} guide(s)?\n\nYou can restore them from trash within 7 days.`
    );

    if (!confirmed) return;

    try {
      const guideIds = Array.from(selectedGuides);
      const result = await bulkMoveToTrash(guideIds);

      if (result.success) {
        // Reload guides
        if (user) {
          await loadGuides(user.id);
        }
        setSelectedGuides(new Set());
        setIsSelectionMode(false);
        alert(`✅ Deleted ${result.deleted_count} guide(s). You can restore them from trash within 7 days.`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error bulk deleting guides:', error);
      alert(`❌ Error: ${error.message || 'Failed to delete guides'}`);
    }
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
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 bg-primary-500 text-white px-4 py-2.5 rounded-lg hover:bg-primary-600 transition text-sm font-medium w-full"
              >
                <Plus size={18} />
                <span>Add Guide</span>
              </button>
              <button
                onClick={() => setShowArticleModal(true)}
                className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition text-sm font-medium w-full"
              >
                <FileText size={18} />
                <span>Add Article</span>
              </button>
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
                title="Add a new guide or recipe"
              >
                <Plus size={20} />
                <span>Add Guide</span>
              </button>
              <button
                onClick={() => setShowArticleModal(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                title="Add guide from article or blog"
              >
                <FileText size={20} />
                <span>Add Article</span>
              </button>
              {guides.length > 0 && (
                <button
                  onClick={toggleSelectionMode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    isSelectionMode
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                  title="Select multiple guides"
                >
                  <CheckSquare size={20} />
                  <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
                </button>
              )}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
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
            </div>
          </div>

          {/* Mobile: Additional Actions Row */}
          <div className="lg:hidden flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
            {guides.length > 0 && (
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                  isSelectionMode
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <CheckSquare size={18} />
                <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
              </button>
            )}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                title="Grid View"
              >
                <Grid3x3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                title="List View"
              >
                <List size={16} />
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
        ) : viewMode === 'grid' ? (
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
        ) : (
          <div className="space-y-3">
            {guides.map((guide) => (
              <GuideListItem
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

      {/* Add Article Modal */}
      {showArticleModal && (
        <AddArticleModal
          isOpen={showArticleModal}
          onClose={() => setShowArticleModal(false)}
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
