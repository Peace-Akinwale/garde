'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { remindersAPI } from '@/lib/api';
import { Bell, Clock, Trash2, Mail, Smartphone, ChefHat, Hammer, Book, FileQuestion } from 'lucide-react';
import Navigation from '@/components/Navigation';

const typeIcons = {
  recipe: ChefHat,
  craft: Hammer,
  howto: Book,
  other: FileQuestion,
  unclear: FileQuestion,
};

export default function RemindersPage() {
  const [user, setUser] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      loadReminders(session.user.id);
    } else {
      setLoading(false);
    }
  };

  const loadReminders = async (userId) => {
    try {
      setLoading(true);
      const response = await remindersAPI.getAll(userId);
      setReminders(response.data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reminderId) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      setDeleting(reminderId);
      await remindersAPI.delete(reminderId);
      setReminders(reminders.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      alert('Failed to delete reminder');
    } finally {
      setDeleting(null);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    let relativeTime = '';
    if (diffMs < 0) {
      relativeTime = 'Overdue';
    } else if (diffMins < 60) {
      relativeTime = `In ${diffMins}m`;
    } else if (diffHours < 24) {
      relativeTime = `In ${diffHours}h`;
    } else if (diffDays < 7) {
      relativeTime = `In ${diffDays}d`;
    } else {
      relativeTime = date.toLocaleDateString();
    }

    const timeStr = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return { relativeTime, timeStr };
  };

  const upcomingReminders = reminders.filter(r => !r.sent && new Date(r.scheduled_for) > new Date());
  const pastReminders = reminders.filter(r => r.sent || new Date(r.scheduled_for) <= new Date());

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Please log in to view reminders</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
      <Navigation user={user} onLogout={() => supabase.auth.signOut()} />

      <div className="flex-1 flex flex-col lg:ml-0">
        <div className="lg:hidden h-16" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <Bell className="text-primary-500" />
              Reminders
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Never miss a recipe or guide with scheduled reminders
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg">
              <Bell size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No reminders yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Open any guide and set a reminder to get notified
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Reminders */}
              {upcomingReminders.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Upcoming ({upcomingReminders.length})
                  </h2>
                  <div className="space-y-3">
                    {upcomingReminders.map((reminder) => {
                      const Icon = typeIcons[reminder.guides?.type] || FileQuestion;
                      const { relativeTime, timeStr } = formatDateTime(reminder.scheduled_for);

                      return (
                        <div
                          key={reminder.id}
                          className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Icon size={24} className="text-primary-500 flex-shrink-0 mt-1" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {reminder.title}
                                </h3>
                                {reminder.message && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {reminder.message}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                    <Clock size={14} />
                                    <span className="font-medium text-primary-600 dark:text-primary-400">
                                      {relativeTime}
                                    </span>
                                    <span>· {timeStr}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {(reminder.reminder_type === 'email' || reminder.reminder_type === 'both') && (
                                      <Mail size={14} className="text-blue-500" title="Email notification" />
                                    )}
                                    {(reminder.reminder_type === 'push' || reminder.reminder_type === 'both') && (
                                      <Smartphone size={14} className="text-green-500" title="Push notification" />
                                    )}
                                  </div>
                                </div>
                                {reminder.guides && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Guide: {reminder.guides.title}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDelete(reminder.id)}
                              disabled={deleting === reminder.id}
                              className="text-gray-400 hover:text-red-500 transition p-2 disabled:opacity-50"
                              title="Delete reminder"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past Reminders */}
              {pastReminders.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-4">
                    Past ({pastReminders.length})
                  </h2>
                  <div className="space-y-3">
                    {pastReminders.map((reminder) => {
                      const Icon = typeIcons[reminder.guides?.type] || FileQuestion;
                      const { timeStr } = formatDateTime(reminder.scheduled_for);

                      return (
                        <div
                          key={reminder.id}
                          className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700 opacity-60"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Icon size={24} className="text-gray-400 flex-shrink-0 mt-1" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  {reminder.title}
                                </h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {reminder.sent ? 'Sent' : 'Expired'} · {timeStr}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDelete(reminder.id)}
                              disabled={deleting === reminder.id}
                              className="text-gray-400 hover:text-red-500 transition p-2 disabled:opacity-50"
                              title="Delete reminder"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
