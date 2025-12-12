'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { guidesAPI } from '@/lib/api';
import ReminderModal from './ReminderModal';
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
  Bell,
  FileText,
  Copy,
  Search,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import jsPDF from 'jspdf';

const typeIcons = {
  recipe: ChefHat,
  craft: Hammer,
  howto: Book,
  other: FileQuestion,
  unclear: FileQuestion,
};

const getContentLabels = (type) => {
  const labels = {
    recipe: {
      ingredients: 'Ingredients',
      steps: 'Instructions',
    },
    craft: {
      ingredients: 'Materials & Supplies',
      steps: 'Steps',
    },
    howto: {
      ingredients: 'Products & Tools',
      steps: 'Steps',
    },
    other: {
      ingredients: "What You'll Need",
      steps: 'Steps',
    },
    unclear: {
      ingredients: 'Ingredients / Materials',
      steps: 'Instructions',
    },
  };
  return labels[type] || labels.unclear;
};

const HighlightedText = ({ text, searchQuery, isActive }) => {
  if (!searchQuery || !text) return <span>{text}</span>;
  
  const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark 
            key={index} 
            className={`px-0.5 rounded ${isActive ? 'bg-orange-400' : 'bg-yellow-300'}`}
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

export default function GuideDetailModal({ guide, userId, isOpen, onClose, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedGuide, setEditedGuide] = useState({ ...guide });
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [copySuccess, setCopySuccess] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef(null);
  const contentRef = useRef(null);

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const modalRef = useRef(null);
  const intentionalCloseRef = useRef(false);

  const Icon = typeIcons[guide.type] || FileQuestion;

  useEffect(() => {
    if (isOpen) {
      sessionStorage.setItem('openGuideId', guide.id);
      sessionStorage.setItem('openGuideData', JSON.stringify(guide));
      document.body.style.overflow = 'hidden';
    } else {
      sessionStorage.removeItem('openGuideId');
      sessionStorage.removeItem('openGuideData');
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, guide]);

  useEffect(() => {
    if (!isOpen) return;

    intentionalCloseRef.current = false;
    window.history.pushState({ modalOpen: true, guideId: guide.id }, '');

    const handlePopState = (e) => {
      if (!document.hidden) {
        intentionalCloseRef.current = true;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose, guide.id]);

  const performSearch = useCallback((query) => {
    if (!query.trim()) {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const matches = [];
    const lowerQuery = query.toLowerCase();

    if (guide.title?.toLowerCase().includes(lowerQuery)) {
      matches.push({ type: 'title', index: 0 });
    }

    if (guide.summary?.toLowerCase().includes(lowerQuery)) {
      matches.push({ type: 'summary', index: 0 });
    }

    guide.ingredients?.forEach((ingredient, idx) => {
      if (ingredient.toLowerCase().includes(lowerQuery)) {
        matches.push({ type: 'ingredient', index: idx });
      }
    });

    guide.steps?.forEach((step, idx) => {
      if (step.toLowerCase().includes(lowerQuery)) {
        matches.push({ type: 'step', index: idx });
      }
    });

    guide.tips?.forEach((tip, idx) => {
      if (tip.toLowerCase().includes(lowerQuery)) {
        matches.push({ type: 'tip', index: idx });
      }
    });

    setSearchMatches(matches);
    setCurrentMatchIndex(0);

    if (matches.length > 0) {
      scrollToMatch(matches[0]);
    }
  }, [guide]);

  const scrollToMatch = (match) => {
    if (!match) return;
    const elementId = `${match.type}-${match.index}`;
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const goToNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(searchMatches[nextIndex]);
  };

  const goToPrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(searchMatches[prevIndex]);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchMatches([]);
    setCurrentMatchIndex(0);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 200);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, performSearch]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSearch) return;
      if (e.key === 'Escape') {
        closeSearch();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        goToNextMatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, searchMatches, currentMatchIndex]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      setIsSwiping(true);
      setSwipeOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) {
      touchStartX.current = 0;
      touchStartY.current = 0;
      return;
    }

    if (Math.abs(swipeOffset) > window.innerWidth * 0.4) {
      intentionalCloseRef.current = true;
      window.history.back();
    } else {
      setSwipeOffset(0);
    }

    setIsSwiping(false);
    touchStartX.current = 0;
    touchStartY.current = 0;
  };

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

  const handleNativeShare = async () => {
    const shareText = `${guide.title}\n\n${guide.summary || ''}\n\nIngredients:\n${guide.ingredients?.map(i => `• ${i}`).join('\n') || ''}\n\nSteps:\n${guide.steps?.map((s, i) => `${i + 1}. ${s}`).join('\n') || ''}\n\nShared from Garde`;

    if (navigator.share) {
      try {
        await navigator.share({ title: guide.title, text: shareText });
        setShowShareMenu(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const shareText = `${guide.title}\n\n${guide.summary || ''}\n\nIngredients:\n${guide.ingredients?.map(i => `• ${i}`).join('\n') || ''}\n\nSteps:\n${guide.steps?.map((s, i) => `${i + 1}. ${s}`).join('\n') || ''}\n\nShared from Garde`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setShowCopyToast(true);
      setShowShareMenu(false);
      setTimeout(() => setShowCopyToast(false), 3000);
    } catch (error) {
      setCopySuccess(false);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 4000);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      doc.setFontSize(20);
      doc.text(guide.title, margin, yPos);
      yPos += 15;

      if (guide.summary) {
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(guide.summary, pageWidth - margin * 2);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 7 + 10;
      }

      if (guide.ingredients?.length > 0) {
        doc.setFontSize(14);
        doc.text(getContentLabels(guide.type).ingredients, margin, yPos);
        yPos += 10;
        doc.setFontSize(12);
        guide.ingredients.forEach(ing => {
          doc.text(`• ${ing}`, margin, yPos);
          yPos += 7;
        });
        yPos += 5;
      }

      if (guide.steps?.length > 0) {
        doc.setFontSize(14);
        doc.text(getContentLabels(guide.type).steps, margin, yPos);
        yPos += 10;
        doc.setFontSize(12);
        guide.steps.forEach((step, i) => {
          const lines = doc.splitTextToSize(`${i + 1}. ${step}`, pageWidth - margin * 2);
          doc.text(lines, margin, yPos);
          yPos += lines.length * 7 + 3;
        });
      }

      doc.save(`${guide.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      setShowShareMenu(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
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

  const handleClose = () => {
    intentionalCloseRef.current = true;
    closeSearch();
    onClose();
  };

  if (!isOpen) return null;

  const swipeProgress = Math.min(Math.abs(swipeOffset) / window.innerWidth, 1);
  const opacity = 1 - swipeProgress * 0.5;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 bg-white dark:bg-slate-900"
      style={{ opacity, transition: isSwiping ? 'none' : 'opacity 0.3s ease-out' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="h-full flex flex-col"
        style={{ transform: `translateX(${swipeOffset}px)`, transition: isSwiping ? 'none' : 'transform 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={handleClose}
                className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Icon size={24} className="text-primary-600 flex-shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{guide.title}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{guide.type}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-lg transition ${showSearch ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
              >
                <Search size={22} />
              </button>

              {!editing && (
                <div className="relative" ref={shareMenuRef}>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    <Share2 size={22} />
                  </button>
                  
                  {showShareMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50">
                      {navigator.share && (
                        <button onClick={handleNativeShare} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white">
                          <Share2 size={18} /> Share via...
                        </button>
                      )}
                      <button onClick={handleCopyLink} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white border-t border-gray-200 dark:border-slate-700">
                        <Copy size={18} /> Copy to clipboard
                      </button>
                      <button onClick={handleExportPDF} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white border-t border-gray-200 dark:border-slate-700">
                        <FileText size={18} /> Export as PDF
                      </button>
                    </div>
                  )}
                </div>
              )}

              {editing ? (
                <button onClick={handleSave} disabled={saving} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition disabled:opacity-50">
                  <Save size={22} />
                </button>
              ) : (
                <button onClick={() => setEditing(true)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition">
                  <Edit size={22} />
                </button>
              )}
            </div>
          </div>

          {showSearch && (
            <div className="mt-3 flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-2">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in this guide..."
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-sm"
              />
              {searchMatches.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <span>{currentMatchIndex + 1}/{searchMatches.length}</span>
                  <button onClick={goToPrevMatch} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"><ChevronUp size={16} /></button>
                  <button onClick={goToNextMatch} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"><ChevronDown size={16} /></button>
                </div>
              )}
              <button onClick={closeSearch} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {guide.duration && (
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>{guide.duration}</span>
                </div>
              )}
              {guide.servings && (
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  <span>{guide.servings}</span>
                </div>
              )}
              {guide.difficulty && (
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} />
                  <span className="capitalize">{guide.difficulty}</span>
                </div>
              )}
            </div>

            {/* Summary */}
            {guide.summary && (
              <div id="summary-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Summary</h3>
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                  <HighlightedText text={guide.summary} searchQuery={searchQuery} isActive={searchMatches[currentMatchIndex]?.type === 'summary'} />
                </p>
              </div>
            )}

            {/* Ingredients */}
            {guide.ingredients?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{getContentLabels(guide.type).ingredients}</h3>
                <ul className="space-y-3">
                  {(editing ? editedGuide.ingredients : guide.ingredients).map((ingredient, index) => (
                    <li key={index} id={`ingredient-${index}`} className="flex items-center gap-2">
                      {editing ? (
                        <input
                          type="text"
                          value={ingredient}
                          onChange={(e) => handleIngredientChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg"
                        />
                      ) : (
                        <>
                          <span className="text-primary-600">•</span>
                          <span className="text-gray-700 dark:text-gray-200">
                            <HighlightedText text={ingredient} searchQuery={searchQuery} isActive={searchMatches[currentMatchIndex]?.type === 'ingredient' && searchMatches[currentMatchIndex]?.index === index} />
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Steps */}
            {guide.steps?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{getContentLabels(guide.type).steps}</h3>
                <ol className="space-y-4">
                  {(editing ? editedGuide.steps : guide.steps).map((step, index) => (
                    <li key={index} id={`step-${index}`} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center font-medium">{index + 1}</span>
                      {editing ? (
                        <textarea
                          value={step}
                          onChange={(e) => handleStepChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg"
                          rows={2}
                        />
                      ) : (
                        <p className="flex-1 text-gray-700 dark:text-gray-200 leading-relaxed">
                          <HighlightedText text={step} searchQuery={searchQuery} isActive={searchMatches[currentMatchIndex]?.type === 'step' && searchMatches[currentMatchIndex]?.index === index} />
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tips */}
            {guide.tips?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tips</h3>
                <ul className="space-y-2">
                  {guide.tips.map((tip, index) => (
                    <li key={index} id={`tip-${index}`} className="flex items-start gap-2">
                      <span className="text-yellow-500">💡</span>
                      <span className="text-gray-700 dark:text-gray-200">
                        <HighlightedText text={tip} searchQuery={searchQuery} isActive={searchMatches[currentMatchIndex]?.type === 'tip' && searchMatches[currentMatchIndex]?.index === index} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source URL */}
            {guide.source_url && (
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-500">
                  Source: <a href={guide.source_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">{guide.source_url}</a>
                </p>
              </div>
            )}

            <div className="h-8" />
          </div>
        </div>
      </div>

      {/* Toast */}
      {showCopyToast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${copySuccess ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {copySuccess ? 'Copied to clipboard!' : 'Copy failed'}
          </div>
        </div>
      )}

      <ReminderModal
        guide={guide}
        userId={userId}
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onSuccess={() => alert('Reminder set!')}
      />
    </div>
  );
}
