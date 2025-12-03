'use client';

import { useState } from 'react';
import { remindersAPI } from '@/lib/api';
import { X, Bell, Mail, Smartphone, Calendar } from 'lucide-react';

export default function ReminderModal({ guide, userId, isOpen, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [reminderData, setReminderData] = useState({
    date: '',
    time: '',
    reminderType: 'both',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reminderData.date || !reminderData.time) {
      alert('Please select date and time');
      return;
    }

    try {
      setSaving(true);

      // Combine date and time into ISO string
      const scheduledFor = new Date(`${reminderData.date}T${reminderData.time}`).toISOString();

      await remindersAPI.create(
        userId,
        guide.id,
        reminderData.reminderType,
        scheduledFor,
        `Reminder: ${guide.title}`,
        reminderData.message || null
      );

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Failed to create reminder');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Bell className="text-primary-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Set Reminder
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Guide Info */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Reminder for:</p>
            <p className="font-medium text-gray-900 dark:text-white">{guide.title}</p>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={reminderData.date}
                onChange={(e) => setReminderData({ ...reminderData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time
              </label>
              <input
                type="time"
                value={reminderData.time}
                onChange={(e) => setReminderData({ ...reminderData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                <input
                  type="radio"
                  name="reminderType"
                  value="both"
                  checked={reminderData.reminderType === 'both'}
                  onChange={(e) => setReminderData({ ...reminderData, reminderType: e.target.value })}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-blue-500" />
                  <Smartphone size={18} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Email + Push Notification
                  </span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                <input
                  type="radio"
                  name="reminderType"
                  value="email"
                  checked={reminderData.reminderType === 'email'}
                  onChange={(e) => setReminderData({ ...reminderData, reminderType: e.target.value })}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-blue-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Email Only
                  </span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                <input
                  type="radio"
                  name="reminderType"
                  value="push"
                  checked={reminderData.reminderType === 'push'}
                  onChange={(e) => setReminderData({ ...reminderData, reminderType: e.target.value })}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <div className="flex items-center gap-2">
                  <Smartphone size={18} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Push Notification Only
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={reminderData.message}
              onChange={(e) => setReminderData({ ...reminderData, message: e.target.value })}
              placeholder="Add a note for this reminder..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Bell size={18} />
              {saving ? 'Setting...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
