'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

const FEATURED_EVENTS = [
  {
    title: 'CMO Summit 2026',
    date: '25 de março',
    city: 'São Paulo - SP',
    image: '/images/destaque/cmo-summit.jpg',
    url: '/evento/cmo-summit-2026',
  },
  {
    title: 'VTEX Day 2026',
    date: '16 de abril',
    city: 'São Paulo - SP',
    image: '/images/destaque/vtex-day.webp',
    url: '/evento/vtex-day-2026',
  },
  {
    title: 'ProXXIma 2026',
    date: '26 de maio',
    city: 'São Paulo - SP',
    image: '/images/destaque/proxxima-2026.webp',
    url: '/evento/proxxima-2026-sao-paulo',
  },
];

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

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: '420px' }}
      onMouseEnter={() => multi && setPaused(true)}
      onMouseLeave={() => multi && setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Background images ── */}
      {FEATURED_EVENTS.map((ev, i) => (
        <div
          key={ev.image}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={ev.image}
            alt={ev.title}
            fill
            priority={i === 0}
            quality={85}
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ))}

      {/* ── Overlays ── */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/40 via-transparent to-transparent sm:hidden" />

      {/* ── Callouts — all rendered, fade in/out ── */}
      {FEATURED_EVENTS.map((ev, i) => (
        <Link
          key={ev.url}
          href={ev.url}
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
          className={[
            'absolute z-[3] flex flex-col gap-0.5 rounded-[var(--radius-card)] bg-black/50 backdrop-blur-sm transition-opacity duration-700 hover:bg-black/60',
            /* mobile: top-right, small */
            'top-4 right-4 px-3 py-2 sm:hidden',
          ].join(' ')}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">⭐ Evento em Destaque</span>
          <span className="text-xs font-bold text-white">{ev.title}</span>
          <span className="text-[11px] text-white/70">{ev.date} · {ev.city}</span>
        </Link>
      ))}

      {FEATURED_EVENTS.map((ev, i) => (
        <Link
          key={ev.url + '-desktop'}
          href={ev.url}
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
          className={[
            'absolute z-[3] flex-col gap-1 rounded-[var(--radius-card)] bg-black/45 backdrop-blur-sm transition-opacity duration-700 hover:bg-black/55',
            /* desktop: bottom-right, larger */
            'right-8 bottom-6 hidden px-6 py-4 sm:flex',
          ].join(' ')}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">⭐ Evento em Destaque</span>
          <span className="text-base font-bold text-white">{ev.title}</span>
          <span className="text-sm text-white/75">{ev.date} · {ev.city}</span>
        </Link>
      ))}

      {/* ── MOBILE: title + search + dots, bottom-left ── */}
      <div className="absolute left-4 right-4 bottom-6 z-[2] flex flex-col items-start text-left sm:hidden">
        <h1 className="text-xl font-bold leading-snug tracking-tight text-white">
          <span className="block whitespace-nowrap">Descubra os melhores eventos</span>
          <span className="block">de marketing do Brasil</span>
        </h1>
        <div className="mt-4 flex w-full max-w-xs overflow-hidden rounded-[var(--radius-card)] bg-white shadow-xl">
          <div className="relative flex-1">
            <svg className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
            <input type="text" placeholder="Buscar eventos..." className="w-full py-3 pr-3 pl-9 text-xs text-text placeholder:text-gray-400 focus:outline-none" />
          </div>
          <button type="button" className="bg-accent px-4 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-accent/90">Buscar</button>
        </div>
        {multi && (
          <div className="mt-3 flex gap-2">
            {FEATURED_EVENTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full bg-white transition-all duration-300 ${i === current ? 'w-4 opacity-100' : 'w-1.5 opacity-50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP: title + search + dots, left-center ── */}
      <div className="relative z-[2] hidden sm:flex sm:min-h-[480px] sm:items-center sm:justify-start sm:px-10 sm:py-16 lg:px-20">
        <div className="flex max-w-lg flex-col items-start text-left">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white">
            <span className="block whitespace-nowrap">Descubra os melhores eventos</span>
            <span className="block">de marketing do Brasil</span>
          </h1>
          <div className="mt-8 flex w-full overflow-hidden rounded-[var(--radius-card)] bg-white shadow-xl">
            <div className="relative flex-1">
              <svg className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              <input type="text" placeholder="Buscar por nome, tema ou cidade..." className="w-full py-4 pr-4 pl-12 text-sm text-text placeholder:text-gray-400 focus:outline-none" />
            </div>
            <button type="button" className="bg-accent px-6 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-accent/90 sm:px-8">Buscar</button>
          </div>
          {multi && (
            <div className="mt-4 flex gap-2">
              {FEATURED_EVENTS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full bg-white transition-all duration-300 ${i === current ? 'w-5 opacity-100' : 'w-2 opacity-50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
