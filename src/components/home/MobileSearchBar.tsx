'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileSearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/eventos?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="bg-white px-4 py-2.5 border-b border-gray-100 md:hidden">
      <div className="relative">
        <svg
          className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar eventos de marketing..."
          className="w-full rounded-[var(--radius-pill)] border border-gray-200 bg-[var(--color-bg-alt)] py-2 pl-9 pr-10 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSearch}
          aria-label="Buscar"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)] text-white transition-opacity hover:opacity-85"
        >
          <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
