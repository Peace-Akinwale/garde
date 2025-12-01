'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { guidesAPI } from '@/lib/api';
import GuideCard from '@/components/GuideCard';
import AddGuideModal from '@/components/AddGuideModal';
import SearchBar from '@/components/SearchBar';
import AuthModal from '@/components/AuthModal';
import NotificationsModal from '@/components/NotificationsModal';
import { Plus, LogOut, User, Moon, Sun, Bell } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: '',
  });

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

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setHasUnseenNotifications(false);
    localStorage.setItem('seenNotifications', 'true');
  };

  if (!user) {
    return (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-40">
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
                className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Add Guide</span>
              </button>
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
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                title="Logout"
              >
                <LogOut size={20} />
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {guides.map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
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

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}
