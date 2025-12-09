'use client';

import { useState, useEffect } from 'react';

/**
 * Typewriter Component - Types out text character by character
 * Creates an engaging, live-typing effect
 */
export default function Typewriter({ text, speed = 30, onComplete }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className="inline-flex items-baseline">
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-blink ml-0.5 text-primary-500">|</span>
      )}
    </span>
  );
}
