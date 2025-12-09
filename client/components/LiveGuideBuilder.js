'use client';

import { useState, useEffect, useRef } from 'react';
import Typewriter from './Typewriter';
import { CheckCircle, Sparkles, Clock, Users, TrendingUp } from 'lucide-react';

/**
 * LiveGuideBuilder - Shows guide being built in real-time
 * Creates TikTok-level engagement by showing discoveries as they happen
 */
export default function LiveGuideBuilder({ discoveries, progress }) {
  const [visibleIngredients, setVisibleIngredients] = useState([]);
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [currentlyTyping, setCurrentlyTyping] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new items appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleIngredients, visibleSteps, currentlyTyping]);

  // Handle new ingredients appearing
  useEffect(() => {
    if (!discoveries?.ingredients) return;

    const newIngredients = discoveries.ingredients.slice(visibleIngredients.length);

    if (newIngredients.length > 0 && !currentlyTyping) {
      const nextIngredient = newIngredients[0];
      setCurrentlyTyping({ type: 'ingredient', text: nextIngredient });
    }
  }, [discoveries?.ingredients, visibleIngredients.length, currentlyTyping]);

  // Handle new steps appearing
  useEffect(() => {
    if (!discoveries?.steps) return;

    const newSteps = discoveries.steps.slice(visibleSteps.length);

    if (newSteps.length > 0 && !currentlyTyping && visibleIngredients.length === discoveries.ingredients?.length) {
      const nextStep = newSteps[0];
      setCurrentlyTyping({ type: 'step', text: nextStep });
    }
  }, [discoveries?.steps, visibleSteps.length, currentlyTyping, visibleIngredients.length, discoveries?.ingredients]);

  // Show metadata when we're past 80%
  useEffect(() => {
    if (progress > 80 && !showMetadata) {
      setShowMetadata(true);
    }
  }, [progress, showMetadata]);

  const handleTypingComplete = () => {
    if (currentlyTyping?.type === 'ingredient') {
      setVisibleIngredients(prev => [...prev, currentlyTyping.text]);
    } else if (currentlyTyping?.type === 'step') {
      setVisibleSteps(prev => [...prev, currentlyTyping.text]);
    }
    setCurrentlyTyping(null);
  };

  // Default discoveries structure
  const safeDiscoveries = discoveries || {
    title: '',
    ingredients: [],
    steps: [],
    metadata: {
      ingredientCount: 0,
      stepCount: 0,
      duration: null,
      difficulty: null,
      servings: null
    }
  };

  return (
    <div className="live-guide-builder w-full">
      {/* Header with Progress */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="text-primary-500 animate-pulse" size={24} />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Guide is Taking Shape...
          </h3>
        </div>

        <div className="text-5xl font-bold text-gradient mb-4 animate-pulse-soft">
          {progress}%
        </div>
      </div>

      {/* Live Guide Preview Card */}
      <div
        ref={scrollRef}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-gray-100 dark:border-slate-700 p-6 mb-6 max-h-80 overflow-y-auto scroll-smooth"
      >
        {/* Title */}
        {safeDiscoveries.title && (
          <div className="mb-6 animate-fade-in">
            <h4 className="text-2xl font-bold text-gradient flex items-center gap-2">
              📖 {safeDiscoveries.title}
            </h4>
          </div>
        )}

        {/* Ingredients Section */}
        {(visibleIngredients.length > 0 || currentlyTyping?.type === 'ingredient') && (
          <div className="mb-6 animate-fade-in">
            <h5 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
              🧪 Ingredients
              {safeDiscoveries.metadata?.ingredientCount > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  {visibleIngredients.length + (currentlyTyping?.type === 'ingredient' ? 1 : 0)} of {safeDiscoveries.metadata.ingredientCount}
                </span>
              )}
            </h5>

            <ul className="space-y-2.5">
              {visibleIngredients.map((ingredient, i) => (
                <li
                  key={`ingredient-${i}`}
                  className="flex items-start gap-3 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700 dark:text-gray-300">{ingredient}</span>
                </li>
              ))}

              {/* Currently typing ingredient */}
              {currentlyTyping?.type === 'ingredient' && (
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex-shrink-0 mt-0.5 animate-pulse" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <Typewriter
                      text={currentlyTyping.text}
                      speed={25}
                      onComplete={handleTypingComplete}
                    />
                  </span>
                </li>
              )}

              {/* Waiting indicator */}
              {!currentlyTyping && safeDiscoveries.ingredients?.length > visibleIngredients.length && (
                <li className="flex items-start gap-3 text-gray-400 dark:text-gray-500">
                  <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex-shrink-0 mt-0.5 animate-pulse" />
                  <span className="animate-pulse">Discovering more...</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Steps Section */}
        {(visibleSteps.length > 0 || currentlyTyping?.type === 'step') && (
          <div className="animate-fade-in">
            <h5 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
              📝 Steps
              {safeDiscoveries.metadata?.stepCount > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                  {visibleSteps.length + (currentlyTyping?.type === 'step' ? 1 : 0)} of {safeDiscoveries.metadata.stepCount}
                </span>
              )}
            </h5>

            <ol className="space-y-3">
              {visibleSteps.map((step, i) => (
                <li
                  key={`step-${i}`}
                  className="flex items-start gap-3 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 text-white text-sm font-bold flex items-center justify-center shadow-lg">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 pt-0.5">{step}</span>
                </li>
              ))}

              {/* Currently typing step */}
              {currentlyTyping?.type === 'step' && (
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center animate-pulse shadow-lg">
                    {visibleSteps.length + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 pt-0.5">
                    <Typewriter
                      text={currentlyTyping.text}
                      speed={20}
                      onComplete={handleTypingComplete}
                    />
                  </span>
                </li>
              )}

              {/* Waiting indicator */}
              {!currentlyTyping && safeDiscoveries.steps?.length > visibleSteps.length && (
                <li className="flex items-start gap-3 text-gray-400 dark:text-gray-500">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm font-bold flex items-center justify-center animate-pulse">
                    {visibleSteps.length + 1}
                  </span>
                  <span className="animate-pulse pt-0.5">Building next step...</span>
                </li>
              )}
            </ol>
          </div>
        )}

        {/* Metadata (appears near end) */}
        {showMetadata && safeDiscoveries.metadata && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              {safeDiscoveries.metadata.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-blue-500" size={16} />
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">{safeDiscoveries.metadata.duration}</strong>
                  </span>
                </div>
              )}

              {safeDiscoveries.metadata.difficulty && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="text-purple-500" size={16} />
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white capitalize">{safeDiscoveries.metadata.difficulty}</strong>
                  </span>
                </div>
              )}

              {safeDiscoveries.metadata.servings && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="text-green-500" size={16} />
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">{safeDiscoveries.metadata.servings}</strong> servings
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {visibleIngredients.length === 0 && visibleSteps.length === 0 && !currentlyTyping && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin-slow mb-4">
              <Sparkles className="text-primary-500" size={48} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">
              Analyzing your video...
            </p>
          </div>
        )}
      </div>

      {/* Smooth Gradient Progress Bar */}
      <div className="relative h-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4 shadow-inner">
        <div
          className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Flowing shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-flow-shimmer" />
        </div>
      </div>

      {/* Discovery Stats */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {visibleIngredients.length > 0 && (
            <>
              Found: <strong className="text-primary-600 dark:text-primary-400">{visibleIngredients.length} ingredients</strong>
            </>
          )}
          {visibleIngredients.length > 0 && visibleSteps.length > 0 && ', '}
          {visibleSteps.length > 0 && (
            <>
              <strong className="text-purple-600 dark:text-purple-400">{visibleSteps.length} steps</strong>
            </>
          )}
          {(visibleIngredients.length > 0 || visibleSteps.length > 0) && ' so far...'}
          {visibleIngredients.length === 0 && visibleSteps.length === 0 && 'Starting extraction...'}
        </p>
      </div>
    </div>
  );
}
