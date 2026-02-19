'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

// Position → tooltip placement classes + arrow classes
const PLACEMENT = {
  top: {
    tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    arrow: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent border-x-4 border-t-4 border-b-0',
  },
  bottom: {
    tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
    arrow: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent border-x-4 border-b-4 border-t-0',
  },
  left: {
    tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
    arrow: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent border-y-4 border-l-4 border-r-0',
  },
  right: {
    tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
    arrow: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent border-y-4 border-r-4 border-l-0',
  },
};

export default function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const placement = PLACEMENT[position];

  // Close on click outside (mobile tap-away)
  useEffect(() => {
    if (!visible) return;
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [visible]);

  const showWithDelay = useCallback(() => {
    hoverTimer.current = setTimeout(() => setVisible(true), 200);
  }, []);

  const hideOnLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setVisible(false);
  }, []);

  const toggleOnClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setVisible(v => !v);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={showWithDelay}
      onMouseLeave={hideOnLeave}
      onClick={toggleOnClick}
    >
      {children}

      {/* Tooltip bubble */}
      <div
        role="tooltip"
        className={`pointer-events-none absolute z-50 w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg transition-all duration-150 ${placement.tooltip} ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {text}
        {/* Arrow */}
        <span className={`absolute h-0 w-0 border-solid ${placement.arrow}`} />
      </div>
    </div>
  );
}
