'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { adminAPI } from '@/lib/api';
import {
  Users,
  TrendingUp,
  FileText,
  Video,
  Search,
  Download,
  Eye,
  Clock,
  Activity,
  Star,
  MessageCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AnnouncementManager from '@/components/AnnouncementManager';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      loadDashboard();
      loadUsers();
    }
  }, [user, isAdmin, searchQuery, sortBy, sortOrder]);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (profile?.is_admin) {
        setIsAdmin(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking admin access:', error);
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard(user.id);
      setDashboard(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers(user.id, {
        search: searchQuery,
        sortBy,
        sortOrder,
        limit: 50
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Email', 'Name', 'Guides', 'Logins', 'Last Active', 'Engagement', 'Joined'].join(','),
      ...users.map(u => [
        u.email,
        u.full_name || '',
        u.total_guides || 0,
        u.total_logins || 0,
        u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : 'Never',
        u.engagement_score || 0,
        new Date(u.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garde-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-500 dark:text-gray-400">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Overview of platform analytics and user activity</p>
        </div>

        {/* Analytics Cards */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <AnalyticsCard
              title="Total Users"
              value={dashboard.totalUsers || 0}
              icon={Users}
              color="blue"
            />
            <AnalyticsCard
              title="Active This Week"
              value={dashboard.activeUsersThisWeek || 0}
              icon={TrendingUp}
              color="green"
            />
            <AnalyticsCard
              title="Total Guides"
              value={dashboard.totalGuides || 0}
              icon={FileText}
              color="purple"
            />
            <button
              onClick={() => router.push('/admin/reviews')}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <Star size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Manage</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">User Reviews</p>
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          {/* Table Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Users</h2>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              {/* Export Button */}
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="created_at">Join Date</option>
              <option value="last_active_at">Last Active</option>
              <option value="total_guides">Guides Count</option>
              <option value="engagement_score">Engagement</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition"
            >
              {sortOrder === 'desc' ? '↓ Descending' : '↑ Ascending'}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Guides</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Logins</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Last Active</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Engagement</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.full_name || 'Unnamed User'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{user.total_guides || 0}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{user.total_logins || 0}</td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">
                      {user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <EngagementBadge score={user.engagement_score || 0} />
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* Announcements Management */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-6">
          <AnnouncementManager />
        </div>
      </div>
    </div>
  );
}

// Analytics Card Component
function AnalyticsCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value.toLocaleString()}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  );
}

// Engagement Badge Component
function EngagementBadge({ score }) {
  let color = 'gray';
  let label = 'Low';

  if (score >= 75) {
    color = 'green';
    label = 'High';
  } else if (score >= 40) {
    color = 'yellow';
    label = 'Medium';
  }

  const colorClasses = {
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {label} ({score})
    </span>
  );
}
