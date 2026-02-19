'use client';

import { useState, useRef, useEffect } from 'react';

const COLLAPSED_HEIGHT = 200; // px

export default function ExpandableDescription({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [safeHtml, setSafeHtml] = useState(html); // SSR: serve raw (trusted from DB)
  const [needsExpand, setNeedsExpand] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Client-side sanitization with DOMPurify
  useEffect(() => {
    import('dompurify').then(({ default: DOMPurify }) => {
      setSafeHtml(
        DOMPurify.sanitize(html, {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
            'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote',
          ],
          ALLOWED_ATTR: ['href', 'target', 'rel'],
        }),
      );
    });
  }, [html]);

  // Check if content overflows after safeHtml is ready
  useEffect(() => {
    if (ref.current && ref.current.scrollHeight > COLLAPSED_HEIGHT + 40) {
      setNeedsExpand(true);
    }
  }, [safeHtml]);

  return (
    <div className="relative">
      <div
        ref={ref}
        className="prose prose-sm max-w-none text-text-secondary prose-headings:text-text prose-a:text-primary"
        style={
          needsExpand && !expanded
            ? { maxHeight: COLLAPSED_HEIGHT, overflow: 'hidden' }
            : undefined
        }
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {needsExpand && !expanded && (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center bg-gradient-to-t from-white pb-1 pt-16">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-[var(--radius-btn)] bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
          >
            Leia mais
          </button>
        </div>
      )}
    </div>
  );
}
