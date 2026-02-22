'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

const FEATURED_EVENTS = [
  {
    title: 'CMO Summit 2026',
    date: '25 de março',
    city: 'São Paulo',
    state: 'SP',
    category: 'Conferência',
    image: '/images/destaque/cmo-summit.jpg',
    url: '/evento/cmo-summit-2026',
  },
  {
    title: 'VTEX Day 2026',
    date: '16 de abril',
    city: 'São Paulo',
    state: 'SP',
    category: 'Conferência',
    image: '/images/destaque/vtex-day.webp',
    url: '/evento/vtex-day-2026',
  },
  {
    title: 'ProXXIma 2026',
    date: '26 de maio',
    city: 'São Paulo',
    state: 'SP',
    category: 'Conferência',
    image: '/images/destaque/proxxima-2026.webp',
    url: '/evento/proxxima-2026-sao-paulo',
  },
];

// Badge color cycles with each slide
const BADGE_COLORS = ['#e8612d', '#6366f1', '#0891b2'];

const INTERVAL = 6000;

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = FEATURED_EVENTS.length;
  const multi = count > 1;

  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + count) % count), [count]);

  useEffect(() => {
    if (!multi || paused) return;
    const t = setTimeout(next, INTERVAL);
    return () => clearTimeout(t);
  }, [current, paused, multi, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
    touchStartX.current = null;
  };

  const ev = FEATURED_EVENTS[current];
  const badgeColor = BADGE_COLORS[current % BADGE_COLORS.length];

  return (
    <section
      className="group relative overflow-hidden min-h-[360px] sm:min-h-[500px]"
      style={{ maxHeight: '68vh' }}
      onMouseEnter={() => multi && setPaused(true)}
      onMouseLeave={() => multi && setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 1. Background images — cross-fade ── */}
      {FEATURED_EVENTS.map((e, i) => (
        <div
          key={e.image}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <Image
            src={e.image}
            alt={e.title}
            fill
            priority={i === 0}
            quality={85}
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ))}

      {/* ── 2. Bottom gradient overlay — Netflix-style ── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.65) 22%, rgba(0,0,0,0.25) 45%, transparent 62%)',
        }}
      />

      {/* ── 3. Nav arrows — upper third ── */}
      {multi && (
        <>
          <button
            onClick={prev}
            aria-label="Slide anterior"
            style={{ top: '30%' }}
            className="absolute left-3 z-[5] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-2xl text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/65 sm:flex sm:opacity-0 sm:group-hover:opacity-100"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Próximo slide"
            style={{ top: '30%' }}
            className="absolute right-3 z-[5] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-2xl text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/65 sm:flex sm:opacity-0 sm:group-hover:opacity-100"
          >
            ›
          </button>
        </>
      )}

      {/* ── 4. Callout — text over gradient, no card ── */}
      <div className="absolute bottom-0 left-0 right-0 z-[4]">

        {/* Desktop */}
        <div className="hidden sm:flex flex-col items-center gap-2 text-center px-6 pb-5">
          <span
            className="rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white whitespace-nowrap transition-colors duration-700"
            style={{ backgroundColor: badgeColor }}
          >
            ⭐ Evento em Destaque
          </span>
          <p className="text-[26px] font-bold leading-tight text-white max-w-[640px]">
            {ev.title}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              {ev.date}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              {ev.city}, {ev.state}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
              {ev.category}
            </span>
          </div>
          {/* Ghost button */}
          <Link
            href={ev.url}
            className="mt-1 rounded-lg border-2 border-white px-6 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white hover:text-[#1a1a2e]"
          >
            Ver Evento →
          </Link>
          {/* Dots */}
          {multi && (
            <div className="mt-1 flex justify-center gap-2">
              {FEATURED_EVENTS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-6' : 'bg-white/35 w-2'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="sm:hidden flex flex-col items-center gap-2 px-3 pb-3 text-center">
          <span
            className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white transition-colors duration-700"
            style={{ backgroundColor: badgeColor }}
          >
            ⭐ Evento em Destaque
          </span>
          <p className="text-[20px] font-bold leading-tight text-white">
            {ev.title}
          </p>
          <p className="text-xs text-white/80 leading-relaxed">
            📅 {ev.date}&ensp;·&ensp;📍 {ev.city}, {ev.state}&ensp;·&ensp;🏷️ {ev.category}
          </p>
          {/* Ghost button — slightly filled for mobile legibility */}
          <Link
            href={ev.url}
            className="block w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white transition-all duration-200 hover:bg-white hover:text-[#1a1a2e]"
            style={{ border: '2.5px solid white', backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            Ver Evento →
          </Link>
          {/* Dots */}
          {multi && (
            <div className="flex justify-center gap-2 pt-0.5">
              {FEATURED_EVENTS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-6' : 'bg-white/35 w-2'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
