'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SITE_URL } from '@/lib/constants';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleSearch(q: string, closeMobile = false) {
    const trimmed = q.trim();
    if (!trimmed) return;
    if (closeMobile) setMobileMenuOpen(false);
    router.push(`/eventos?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? 'border-b border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-md'
          : 'bg-white'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href={SITE_URL} className="flex shrink-0 items-center">
          <span className="text-xl font-bold tracking-tight text-[var(--color-text)]">
            eventos<span className="text-[var(--color-accent)]">de</span>marketing
          </span>
        </Link>

        {/* Search bar — desktop */}
        <div className="mx-4 hidden max-w-md flex-1 md:flex">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              placeholder="Buscar eventos de marketing..."
              className="w-full rounded-[var(--radius-pill)] border border-gray-200 bg-[var(--color-bg-alt)] py-2 pr-10 pl-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSearch(searchQuery)}
              aria-label="Buscar"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)] text-white transition-opacity hover:opacity-85"
            >
              <SearchIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center md:flex">
          <Link
            href={`${SITE_URL}/cadastrar-evento`}
            className="rounded-[var(--radius-btn)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)]/90"
          >
            Cadastre um Evento
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="rounded-[var(--radius-btn)] p-2 text-[var(--color-text-secondary)] hover:bg-gray-100 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {mobileMenuOpen ? (
            <CloseIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 md:hidden">
          {/* Mobile search — hidden on homepage (shown below header instead) */}
          {!isHome && (
            <div className="relative my-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery, true)}
                placeholder="Buscar eventos de marketing..."
                className="w-full rounded-[var(--radius-pill)] border border-gray-200 bg-[var(--color-bg-alt)] py-2 pr-10 pl-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleSearch(searchQuery, true)}
                aria-label="Buscar"
                className="absolute top-1/2 right-1.5 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)] text-white transition-opacity hover:opacity-85"
              >
                <SearchIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Link
              href={`${SITE_URL}/cadastrar-evento`}
              className="rounded-[var(--radius-btn)] bg-[var(--color-accent)] px-4 py-2.5 text-center text-sm font-medium text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cadastre um Evento
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
