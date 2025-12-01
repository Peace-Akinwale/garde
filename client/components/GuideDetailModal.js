'use client';

import { useState } from 'react';
import { guidesAPI } from '@/lib/api';
import {
  X,
  Edit,
  Save,
  ChefHat,
  Hammer,
  Book,
  FileQuestion,
  Clock,
  Users,
  TrendingUp,
  Share2,
  Video,
} from 'lucide-react';

const typeIcons = {
  recipe: ChefHat,
  craft: Hammer,
  howto: Book,
  other: FileQuestion,
  unclear: FileQuestion,
};

export default function GuideDetailModal({ guide, isOpen, onClose, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedGuide, setEditedGuide] = useState({ ...guide });

  const Icon = typeIcons[guide.type] || FileQuestion;

  const handleSave = async () => {
    try {
      setSaving(true);
      await guidesAPI.update(guide.id, {
        title: editedGuide.title,
        ingredients: editedGuide.ingredients,
        steps: editedGuide.steps,
        tips: editedGuide.tips,
        summary: editedGuide.summary,
        duration: editedGuide.duration,
        servings: editedGuide.servings,
        difficulty: editedGuide.difficulty,
      });
      setEditing(false);
      onUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving guide:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const shareText = `${guide.title}\n\n${guide.summary || ''}\n\nIngredients:\n${guide.ingredients?.map(i => `• ${i}`).join('\n') || ''}\n\nSteps:\n${guide.steps?.map((s, i) => `${i + 1}. ${s}`).join('\n') || ''}\n\nShared from Garde`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: guide.title,
          text: shareText,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Recipe copied to clipboard! You can now paste it anywhere.');
      } catch (error) {
        console.error('Error copying:', error);
        alert('Sharing not supported on this device');
      }
    }
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...editedGuide.ingredients];
    newIngredients[index] = value;
    setEditedGuide({ ...editedGuide, ingredients: newIngredients });
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...editedGuide.steps];
    newSteps[index] = value;
    setEditedGuide({ ...editedGuide, steps: newSteps });
  };

  const addIngredient = () => {
    setEditedGuide({
      ...editedGuide,
      ingredients: [...editedGuide.ingredients, ''],
    });
  };

  const removeIngredient = (index) => {
    setEditedGuide({
      ...editedGuide,
      ingredients: editedGuide.ingredients.filter((_, i) => i !== index),
    });
  };

  const addStep = () => {
    setEditedGuide({
      ...editedGuide,
      steps: [...editedGuide.steps, ''],
    });
  };

  const removeStep = (index) => {
    setEditedGuide({
      ...editedGuide,
      steps: editedGuide.steps.filter((_, i) => i !== index),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full my-8 relative">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 rounded-t-xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon size={28} className="text-primary-600" />
            <div>
              {editing ? (
                <input
                  type="text"
                  value={editedGuide.title}
                  onChange={(e) =>
                    setEditedGuide({ ...editedGuide, title: e.target.value })
                  }
                  className="text-2xl font-bold text-gray-900 dark:text-white bg-white dark:bg-slate-700 border-b-2 border-primary-500 focus:outline-none"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{guide.title}</h2>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{guide.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                title="Share this recipe"
              >
                <Share2 size={20} />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            {editing ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                <Save size={20} />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
              >
                <Edit size={20} />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {(editing ? editedGuide.duration : guide.duration) && (
              <div className="flex items-center gap-2">
                <Clock size={18} />
                {editing ? (
                  <input
                    type="text"
                    value={editedGuide.duration}
                    onChange={(e) =>
                      setEditedGuide({ ...editedGuide, duration: e.target.value })
                    }
                    className="border-b border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                    placeholder="e.g., 30 minutes"
                  />
                ) : (
                  <span>{guide.duration}</span>
                )}
              </div>
            )}
            {(editing ? editedGuide.servings : guide.servings) && (
              <div className="flex items-center gap-2">
                <Users size={18} />
                {editing ? (
                  <input
                    type="text"
                    value={editedGuide.servings}
                    onChange={(e) =>
                      setEditedGuide({ ...editedGuide, servings: e.target.value })
                    }
                    className="border-b border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                    placeholder="e.g., 4 servings"
                  />
                ) : (
                  <span>{guide.servings}</span>
                )}
              </div>
            )}
            {(editing || guide.difficulty) && (
              <div className="flex items-center gap-2">
                <TrendingUp size={18} />
                {editing ? (
                  <select
                    value={editedGuide.difficulty || ''}
                    onChange={(e) =>
                      setEditedGuide({ ...editedGuide, difficulty: e.target.value })
                    }
                    className="border-b border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Select difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                ) : (
                  <span className="capitalize">{guide.difficulty}</span>
                )}
              </div>
            )}
          </div>

          {/* Video Player */}
          {guide.source_url && (() => {
            const isTikTok = guide.source_url.includes('tiktok.com');
            const isInstagram = guide.source_url.includes('instagram.com');
            const isYouTube = guide.source_url.includes('youtube.com') || guide.source_url.includes('youtu.be');
            const canEmbed = !isTikTok && !isInstagram;

            return (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Original Video</h3>
                {canEmbed ? (
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                    <iframe
                      src={isYouTube
                        ? guide.source_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                        : guide.source_url}
                      className="w-full h-full"
                      allowFullScreen
                      title="Original video"
                    />
                  </div>
                ) : (
                  <a
                    href={guide.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg transition shadow-lg"
                  >
                    <Video size={24} />
                    <div className="text-left">
                      <p className="font-semibold">Watch on {isTikTok ? 'TikTok' : 'Instagram'}</p>
                      <p className="text-sm text-white/90">Click to open original video</p>
                    </div>
                  </a>
                )}
              </div>
            );
          })()}

          {/* Summary */}
          {(editing || guide.summary) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Summary</h3>
              {editing ? (
                <textarea
                  value={editedGuide.summary}
                  onChange={(e) =>
                    setEditedGuide({ ...editedGuide, summary: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-slate-700"
                  rows={3}
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-100 leading-relaxed">{guide.summary}</p>
              )}
            </div>
          )}

          {/* Ingredients */}
          {guide.ingredients && guide.ingredients.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ingredients / Materials
                </h3>
                {editing && (
                  <button
                    onClick={addIngredient}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add
                  </button>
                )}
              </div>
              <ul className="space-y-3">
                {(editing ? editedGuide.ingredients : guide.ingredients).map(
                  (ingredient, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {editing ? (
                        <>
                          <input
                            type="text"
                            value={ingredient}
                            onChange={(e) =>
                              handleIngredientChange(index, e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => removeIngredient(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-primary-600 dark:text-primary-400">•</span>
                          <span className="text-gray-700 dark:text-gray-100 leading-relaxed">{ingredient}</span>
                        </>
                      )}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Steps */}
          {guide.steps && guide.steps.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Instructions
                </h3>
                {editing && (
                  <button
                    onClick={addStep}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add Step
                  </button>
                )}
              </div>
              <ol className="space-y-4">
                {(editing ? editedGuide.steps : guide.steps).map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    {editing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <textarea
                          value={step}
                          onChange={(e) => handleStepChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          rows={2}
                        />
                        <button
                          onClick={() => removeStep(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <p className="flex-1 text-gray-700 dark:text-gray-100 leading-relaxed">{step}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Tips */}
          {guide.tips && guide.tips.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tips</h3>
              <ul className="space-y-2">
                {guide.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-500">💡</span>
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Source */}
          {guide.source_url && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Source:{' '}
                <a
                  href={guide.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {guide.source_url}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
