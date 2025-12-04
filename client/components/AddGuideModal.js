'use client';

import { useState, useEffect, useRef } from 'react';
import { videoAPI, guidesAPI } from '@/lib/api';
import { X, Link as LinkIcon, Upload, Loader, CheckCircle, XCircle } from 'lucide-react';

export default function AddGuideModal({ isOpen, onClose, onGuideAdded, userId }) {
  const [mode, setMode] = useState('url'); // 'url' or 'upload'
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState(null);
  const [canClose, setCanClose] = useState(true);

  const pollingIntervalRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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

  /**
   * Poll job status every 2 seconds until complete
   */
  const startPolling = (jobId) => {
    // Initial check immediately
    checkJobStatus(jobId);

    // Then poll every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkJobStatus(jobId);
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const checkJobStatus = async (jobId) => {
    try {
      const response = await videoAPI.getJobStatus(jobId, userId);
      const job = response.job;

      setProgress(job.progress || 0);
      setCurrentStep(job.currentStep || 'Processing...');

      if (job.status === 'completed') {
        stopPolling();
        await handleJobCompleted(job);
      } else if (job.status === 'failed') {
        stopPolling();
        handleJobFailed(job.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Error checking job status:', error);
      // Don't stop polling on network errors - try again next interval
    }
  };

  const handleJobCompleted = async (job) => {
    try {
      setCurrentStep('Processing...');

      // Save the extracted guide to database
      await guidesAPI.create({
        userId,
        title: job.guide.title,
        type: job.guide.type,
        category: job.guide.category,
        language: job.guide.language || job.transcription?.language,
        ingredients: job.guide.ingredients,
        steps: job.guide.steps,
        duration: job.guide.duration,
        servings: job.guide.servings,
        difficulty: job.guide.difficulty,
        tips: job.guide.tips,
        summary: job.guide.summary,
        transcription: job.transcription?.text,
        sourceUrl: mode === 'url' ? url : null,
      });

      setProgress(100);
      setCurrentStep('Done!');
      setCanClose(true);

      setTimeout(() => {
        onGuideAdded();
        resetForm();
      }, 1000);
    } catch (error) {
      console.error('Error saving guide:', error);
      setError('Failed to save guide. Please try again.');
      setProcessing(false);
      setCanClose(true);
    }
  };

  const handleJobFailed = (errorMessage) => {
    setError(errorMessage);
    setProcessing(false);
    setProgress(0);
    setCurrentStep('');
    setCanClose(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);
    setProgress(0);
    setCurrentStep('Submitting...');
    setCanClose(false); // User can close even while processing

    try {
      let result;

      if (mode === 'url') {
        if (!url) {
          setError('Please enter a video URL');
          setProcessing(false);
          return;
        }

        setCurrentStep('Processing...');
        result = await videoAPI.processUrl(url, userId);
      } else {
        if (!file) {
          setError('Please select a video file');
          setProcessing(false);
          return;
        }

        setCurrentStep('Uploading...');
        result = await videoAPI.processUpload(file, userId);
      }

      if (!result.success) {
        throw new Error('Failed to start processing');
      }

      // Check if this was a cached result (instant!)
      if (result.cached && result.guide) {
        console.log('✅ Cache hit! Processing guide instantly...');
        setProgress(100);
        setCurrentStep('Cached result - instant!');

        // Save the cached guide directly (no polling needed)
        await guidesAPI.create({
          userId,
          title: result.guide.title,
          type: result.guide.type,
          category: result.guide.category,
          language: result.guide.language || result.transcription?.language,
          ingredients: result.guide.ingredients,
          steps: result.guide.steps,
          duration: result.guide.duration,
          servings: result.guide.servings,
          difficulty: result.guide.difficulty,
          tips: result.guide.tips,
          summary: result.guide.summary,
          transcription: result.transcription?.text,
          sourceUrl: mode === 'url' ? url : null,
        });

        setCurrentStep('Done!');
        setCanClose(true);

        setTimeout(() => {
          onGuideAdded();
          resetForm();
        }, 1000);

        return; // Don't start polling for cached results
      }

      // Got job ID - start polling for background processing
      setJobId(result.jobId);
      setCurrentStep('Processing...');
      setCanClose(true); // User can now safely close the modal!
      startPolling(result.jobId);

    } catch (error) {
      console.error('Error submitting video:', error);
      setError(error.message || 'Failed to submit video. Please try again.');
      setProcessing(false);
      setProgress(0);
      setCurrentStep('');
      setCanClose(true);
    }
  };

  const handleCancel = () => {
    stopPolling();
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setUrl('');
    setFile(null);
    setProcessing(false);
    setJobId(null);
    setProgress(0);
    setCurrentStep('');
    setError(null);
    setCanClose(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          title="Close"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Add New Guide
        </h2>

        {/* Mode Selection */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('url')}
            disabled={processing}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition ${
              mode === 'url'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
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
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
            } disabled:opacity-50`}
          >
            <Upload size={20} />
            <span>Upload File</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <XCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {processing && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              {progress === 100 ? (
                <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
              ) : (
                <Loader className="animate-spin text-blue-600 dark:text-blue-400" size={20} />
              )}
              <div className="flex-1">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{currentStep}</p>
                <p className="text-xs text-blue-500 dark:text-blue-500 mt-0.5">{progress}% complete</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'url' ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Video URL (TikTok, YouTube, Instagram, X/Twitter)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/..."
                className="w-full px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                disabled={processing}
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Paste the link to the video containing the recipe or guide
              </p>
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-300">
                <strong>Supported:</strong> TikTok, Instagram, X/Twitter, Facebook, YouTube, and 1000+ platforms
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Video File
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
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
                  <Upload size={40} className="text-gray-400 dark:text-gray-500 mb-2" />
                  {file ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Click to upload video
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Max 100MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              Close
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

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> The AI will automatically extract recipes and instructions
            from the video, including support for Yoruba and 98+ languages.
          </p>
        </div>
      </div>
    </div>
  );
}
