'use client';

import { useState } from 'react';
import { articleAPI } from '@/lib/api';
import { X, Link as LinkIcon, XCircle, CheckCircle, Loader } from 'lucide-react';

export default function AddArticleModal({ isOpen, onClose, onGuideAdded, userId }) {
  const [url, setUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [guide, setGuide] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);
    setSuccess(false);

    try {
      if (!url) {
        setError('Please enter an article URL');
        setProcessing(false);
        return;
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        setError('Please enter a valid URL');
        setProcessing(false);
        return;
      }

      console.log('Processing article:', url);
      const result = await articleAPI.processUrl(url, userId);

      if (!result.success) {
        throw new Error('Failed to process article');
      }

      console.log('Article processed successfully:', result);
      setGuide(result.guide);
      setSuccess(true);

      // Show success message briefly, then close and refresh
      setTimeout(() => {
        onGuideAdded();
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Error processing article:', error);
      setError(error.message || 'Failed to process article. Please try again.');
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setUrl('');
    setProcessing(false);
    setSuccess(false);
    setError(null);
    setGuide(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition z-10"
          title="Close"
          disabled={processing}
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Add Guide from Article
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <XCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && guide && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Guide extracted successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  {guide.title}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {guide.ingredients?.length || 0} ingredients • {guide.steps?.length || 0} steps
                </p>
              </div>
            </div>
          </div>
        )}

        {processing && !success && (
          <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader className="w-12 h-12 text-primary-500 mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Extracting Guide...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reading article and extracting ingredients & steps
              </p>
            </div>
          </div>
        )}

        {!processing && !success && (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Article URL (Blog post, Recipe website, How-to guide)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/how-to-make-soap"
                className="w-full px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                disabled={processing}
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Paste the link to an article containing a recipe or how-to guide
              </p>
            </div>

            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-2">✨ What we can extract:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Recipes from food blogs and cooking websites</li>
                <li>DIY tutorials with materials and steps</li>
                <li>How-to guides with instructions</li>
                <li>Supports HTML articles and PDFs</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing || !url}
                className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LinkIcon size={18} />
                    Extract Guide
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
