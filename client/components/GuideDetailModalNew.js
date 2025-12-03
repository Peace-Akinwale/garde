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
  Check,
  Plus,
  Trash2,
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
  const [showCopyToast, setShowCopyToast] = useState(false);

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
        await navigator.share({ title: guide.title, text: shareText });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 animate-fadeIn">
      {/* Header - Fixed */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
                title="Share"
              >
                <Share2 size={20} />
              </button>
            )}
            {editing ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
                title="Edit"
              >
                <Edit size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Icon size={32} className="text-primary-500" />
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 capitalize">
              {guide.type}
            </span>
          </div>

          {editing ? (
            <input
              type="text"
              value={editedGuide.title}
              onChange={(e) => setEditedGuide({ ...editedGuide, title: e.target.value })}
              className="w-full text-4xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-primary-500 focus:outline-none pb-2"
            />
          ) : (
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              {guide.title}
            </h1>
          )}
        </div>

        {/* Metadata */}
        {(guide.duration || guide.servings || guide.difficulty) && (
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-slate-800">
            {guide.duration && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock size={20} />
                <span className="text-sm font-medium">{guide.duration}</span>
              </div>
            )}
            {guide.servings && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Users size={20} />
                <span className="text-sm font-medium">{guide.servings}</span>
              </div>
            )}
            {guide.difficulty && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <TrendingUp size={20} />
                <span className="text-sm font-medium capitalize">{guide.difficulty}</span>
              </div>
            )}
            {guide.source_url && (
              <a
                href={guide.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
              >
                <Video size={20} />
                <span className="text-sm font-medium">Watch Video</span>
              </a>
            )}
          </div>
        )}

        {/* Summary */}
        {guide.summary && (
          <div className="mb-12">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {guide.summary}
            </p>
          </div>
        )}

        {/* Ingredients */}
        {guide.ingredients && guide.ingredients.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Ingredients
            </h2>
            <div className="space-y-3">
              {(editing ? editedGuide.ingredients : guide.ingredients).map((ingredient, index) => (
                <div key={index} className="flex items-start gap-3 group">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                  {editing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => {
                          const newIngredients = [...editedGuide.ingredients];
                          newIngredients[index] = e.target.value;
                          setEditedGuide({ ...editedGuide, ingredients: newIngredients });
                        }}
                        className="flex-1 text-lg text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => {
                          const newIngredients = editedGuide.ingredients.filter((_, i) => i !== index);
                          setEditedGuide({ ...editedGuide, ingredients: newIngredients });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <span className="flex-1 text-lg text-gray-800 dark:text-gray-200">
                      {ingredient}
                    </span>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  onClick={() => setEditedGuide({ ...editedGuide, ingredients: [...editedGuide.ingredients, ''] })}
                  className="flex items-center gap-2 px-4 py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"
                >
                  <Plus size={18} />
                  Add Ingredient
                </button>
              )}
            </div>
          </div>
        )}

        {/* Steps */}
        {guide.steps && guide.steps.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Instructions
            </h2>
            <div className="space-y-6">
              {(editing ? editedGuide.steps : guide.steps).map((step, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  {editing ? (
                    <div className="flex-1 flex items-start gap-2">
                      <textarea
                        value={step}
                        onChange={(e) => {
                          const newSteps = [...editedGuide.steps];
                          newSteps[index] = e.target.value;
                          setEditedGuide({ ...editedGuide, steps: newSteps });
                        }}
                        rows={3}
                        className="flex-1 text-lg text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      />
                      <button
                        onClick={() => {
                          const newSteps = editedGuide.steps.filter((_, i) => i !== index);
                          setEditedGuide({ ...editedGuide, steps: newSteps });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <p className="flex-1 text-lg text-gray-800 dark:text-gray-200 leading-relaxed pt-0.5">
                      {step}
                    </p>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  onClick={() => setEditedGuide({ ...editedGuide, steps: [...editedGuide.steps, ''] })}
                  className="flex items-center gap-2 px-4 py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition ml-12"
                >
                  <Plus size={18} />
                  Add Step
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tips */}
        {guide.tips && guide.tips.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-900/50">
            <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-4">
              Tips & Notes
            </h2>
            <ul className="space-y-2">
              {guide.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                  <Check size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Toast */}
      {showCopyToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg animate-slideUp">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
