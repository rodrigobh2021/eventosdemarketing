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
      className="group relative overflow-hidden"
      style={{ minHeight: '380px', maxHeight: '65vh' }}
      onMouseEnter={() => multi && setPaused(true)}
      onMouseLeave={() => multi && setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 1. Background images — fade via z-index + opacity ── */}
      {FEATURED_EVENTS.map((ev, i) => (
        <div
          key={ev.image}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
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

      {/* ── 2. Overlays — stronger on left for legibility ── */}
      {/* horizontal: heavy on left where title sits */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
      {/* vertical: subtle top-to-bottom darkening */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/20 via-transparent to-black/50" />

      {/* ── 4. Nav arrows — desktop only (mobile uses swipe) ── */}
      {multi && (
        <>
          <button
            onClick={prev}
            aria-label="Slide anterior"
            className="absolute left-3 top-1/2 z-[5] -translate-y-1/2 hidden h-10 w-10 items-center justify-center rounded-full bg-black/40 text-2xl text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/65 sm:flex sm:opacity-0 sm:group-hover:opacity-100"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Próximo slide"
            className="absolute right-3 top-1/2 z-[5] -translate-y-1/2 hidden h-10 w-10 items-center justify-center rounded-full bg-black/40 text-2xl text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/65 sm:flex sm:opacity-0 sm:group-hover:opacity-100"
          >
            ›
          </button>
        </>
      )}

      {/* ── Mobile callout: full-width bar at the bottom ── */}
      {FEATURED_EVENTS.map((ev, i) => (
        <Link
          key={ev.url + '-m'}
          href={ev.url}
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
          className="absolute bottom-3 left-3 right-3 z-[4] flex items-center gap-3 rounded-xl bg-black/55 px-4 py-3 backdrop-blur-sm transition-opacity duration-700 hover:bg-black/65 sm:hidden"
        >
          <span className="shrink-0 text-base leading-none">⭐</span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Evento em Destaque</span>
            <span className="truncate text-sm font-bold text-white">{ev.title}</span>
            <span className="text-[11px] text-white/70">{ev.date} · {ev.city}</span>
          </div>
          <span className="shrink-0 text-xl leading-none text-white/70">›</span>
        </Link>
      ))}

      {/* ── Desktop callout: bottom-right ── */}
      {FEATURED_EVENTS.map((ev, i) => (
        <Link
          key={ev.url + '-d'}
          href={ev.url}
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
          className="absolute right-5 bottom-6 z-[4] hidden flex-col gap-1 rounded-[var(--radius-card)] bg-black/50 px-6 py-4 backdrop-blur-sm transition-opacity duration-700 hover:bg-black/65 sm:flex"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">⭐ Evento em Destaque</span>
          <span className="text-base font-bold text-white">{ev.title}</span>
          <span className="text-sm text-white/75">{ev.date} · {ev.city}</span>
        </Link>
      ))}

      {/* ── MOBILE: title + search, vertically centered ── */}
      <div className="absolute inset-x-4 top-[42%] z-[3] -translate-y-1/2 flex flex-col items-start text-left sm:hidden">
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
      </div>

      {/* ── 6. MOBILE dots — above the callout ── */}
      {multi && (
        <div className="absolute bottom-[76px] left-1/2 z-[4] -translate-x-1/2 flex gap-2 sm:hidden">
          {FEATURED_EVENTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-3 w-3 rounded-full border-2 border-white transition-all duration-300 ${i === current ? 'bg-white opacity-100' : 'bg-transparent opacity-60'}`}
            />
          ))}
        </div>
      )}

      {/* ── DESKTOP: title + search + dots, left-center ── */}
      <div className="relative z-[3] hidden sm:flex sm:min-h-[520px] sm:items-center sm:justify-start sm:px-10 sm:py-16 lg:px-20">
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
                  className={`h-3 w-3 rounded-full border-2 border-white transition-all duration-300 ${i === current ? 'bg-white opacity-100' : 'bg-transparent opacity-60'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
