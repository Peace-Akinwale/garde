'use client';

import { useState } from 'react';
import { videoAPI, guidesAPI } from '@/lib/api';
import { X, Link as LinkIcon, Upload, Loader } from 'lucide-react';

export default function AddGuideModal({ isOpen, onClose, onGuideAdded, userId }) {
  const [mode, setMode] = useState('url'); // 'url' or 'upload'
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (100MB limit)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);

    try {
      let result;

      if (mode === 'url') {
        if (!url) {
          setError('Please enter a video URL');
          setProcessing(false);
          return;
        }

        setProgress('Downloading video...');
        result = await videoAPI.processUrl(url, userId);
      } else {
        if (!file) {
          setError('Please select a video file');
          setProcessing(false);
          return;
        }

        setProgress('Uploading video...');
        result = await videoAPI.processUpload(file, userId);
      }

      if (!result.success) {
        throw new Error('Failed to process video');
      }

      setProgress('Extracting guide information...');

      // Save the extracted guide to database
      await guidesAPI.create({
        userId,
        title: result.data.guide.title,
        type: result.data.guide.type,
        category: result.data.guide.category,
        language: result.data.guide.language || result.data.transcription.language,
        ingredients: result.data.guide.ingredients,
        steps: result.data.guide.steps,
        duration: result.data.guide.duration,
        servings: result.data.guide.servings,
        difficulty: result.data.guide.difficulty,
        tips: result.data.guide.tips,
        summary: result.data.guide.summary,
        transcription: result.data.transcription.text,
        sourceUrl: mode === 'url' ? url : null,
      });

      setProgress('Done!');
      setTimeout(() => {
        onGuideAdded();
        resetForm();
      }, 500);
    } catch (error) {
      console.error('Error processing video:', error);
      setError(error.message || 'Failed to process video. Please try again.');
      setProcessing(false);
      setProgress('');
    }
  };

  const resetForm = () => {
    setUrl('');
    setFile(null);
    setProcessing(false);
    setProgress('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          disabled={processing}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Add New Guide
        </h2>

        {/* Mode Selection */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('url')}
            disabled={processing}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition ${
              mode === 'url'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            } disabled:opacity-50`}
          >
            <LinkIcon size={20} />
            <span>From URL</span>
          </button>
          <button
            onClick={() => setMode('upload')}
            disabled={processing}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition ${
              mode === 'upload'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            } disabled:opacity-50`}
          >
            <Upload size={20} />
            <span>Upload File</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {processing && progress && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader className="animate-spin text-blue-600" size={20} />
              <p className="text-sm text-blue-600">{progress}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'url' ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL (TikTok, YouTube, Instagram, X/Twitter)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/..."
                className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400"
                disabled={processing}
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Paste the link to the video containing the recipe or guide
              </p>
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <strong>Supported:</strong> TikTok, Instagram, X/Twitter, Facebook, YouTube, and 1000+ platforms
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Video File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="video-upload"
                  disabled={processing}
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload size={40} className="text-gray-400 mb-2" />
                  {file ? (
                    <p className="text-sm text-gray-700">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 mb-1">
                        Click to upload video
                      </p>
                      <p className="text-xs text-gray-500">Max 100MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing || (mode === 'url' && !url) || (mode === 'upload' && !file)}
              className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Process Video'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> The AI will automatically extract recipes and instructions
            from the video, including support for Yoruba and 98+ languages.
          </p>
        </div>
      </div>
    </div>
  );
}
