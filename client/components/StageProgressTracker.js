'use client';

import { CheckCircle, Loader, Circle, Download, Music, Brain, Sparkles, Save } from 'lucide-react';

/**
 * StageProgressTracker - Shows processing stages with checkmarks and progress
 * Clean, professional UI that shows what's happening without overexposing backend
 */
export default function StageProgressTracker({ stages, progress }) {
  // Default stages structure
  const defaultStages = [
    {
      id: 'download',
      name: 'Analyzing video',
      icon: Download,
      status: 'pending', // pending, processing, completed
      progress: 0,
      duration: null
    },
    {
      id: 'extract',
      name: 'Processing content',
      icon: Music,
      status: 'pending',
      progress: 0,
      duration: null
    },
    {
      id: 'transcribe',
      name: 'Understanding details',
      icon: Brain,
      status: 'pending',
      progress: 0,
      duration: null
    },
    {
      id: 'extract_guide',
      name: 'Building your guide',
      icon: Sparkles,
      status: 'pending',
      progress: 0,
      duration: null
    },
    {
      id: 'save',
      name: 'Saving to library',
      icon: Save,
      status: 'pending',
      progress: 0,
      duration: null
    }
  ];

  // Use provided stages or defaults
  const displayStages = stages || defaultStages;

  return (
    <div className="stage-progress-tracker w-full">
      {/* Overall Progress Header */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Processing Your Video
        </h3>
        <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-4">
          {progress}%
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="relative h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-6 shadow-inner">
        <div
          className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-flow-shimmer" />
        </div>
      </div>

      {/* Stages List */}
      <div className="space-y-3">
        {displayStages.map((stage, index) => {
          const IconComponent = stage.icon;
          const isCompleted = stage.status === 'completed';
          const isProcessing = stage.status === 'processing';
          const isPending = stage.status === 'pending';

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-4 rounded-lg transition-all duration-300 ${
                isCompleted
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : isProcessing
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 animate-pulse-soft'
                  : 'bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 opacity-60'
              }`}
            >
              {/* Icon/Status */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 shadow-lg shadow-green-500/50'
                    : isProcessing
                    ? 'bg-blue-500 shadow-lg shadow-blue-500/50'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="text-white" size={24} />
                ) : isProcessing ? (
                  <Loader className="text-white animate-spin" size={24} />
                ) : (
                  <Circle className="text-white opacity-50" size={24} />
                )}
              </div>

              {/* Stage Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${
                      isCompleted || isProcessing
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {isCompleted ? '✓' : isProcessing ? '⚡' : '○'} {stage.name}
                  </span>

                  {/* Duration or Progress Percentage */}
                  {isCompleted && stage.duration && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      [{stage.duration}]
                    </span>
                  )}
                  {isProcessing && stage.progress > 0 && (
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {stage.progress}%
                    </span>
                  )}
                </div>

                {/* Individual Stage Progress Bar (only for active stage) */}
                {isProcessing && stage.progress > 0 && (
                  <div className="h-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Footer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {displayStages.filter((s) => s.status === 'completed').length} of {displayStages.length} stages complete
        </p>
      </div>
    </div>
  );
}
