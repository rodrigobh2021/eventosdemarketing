import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import EventCard from '@/components/events/EventCard';
import { EVENT_TOPICS } from '@/lib/constants';

export const revalidate = 60;

// ─── Data ─────────────────────────────────────────────────────────────

const HOME_TOPICS = EVENT_TOPICS.slice(0, 11);

const FEATURED_EVENT = {
  title: 'CMO Summit 2026',
  date: '25 de março',
  city: 'São Paulo - SP',
  image: '/images/destaque/cmo-summit.jpg',
  url: '/evento/cmo-summit-2026',
};

const CITIES = [
  { slug: 'sao-paulo',      name: 'São Paulo',      state: 'SP', image: '/images/cidades/sao-paulo.jpg'      },
  { slug: 'rio-de-janeiro', name: 'Rio de Janeiro', state: 'RJ', image: '/images/cidades/rio-de-janeiro.jpg' },
  { slug: 'belo-horizonte', name: 'Belo Horizonte', state: 'MG', image: '/images/cidades/belo-horizonte.jpg' },
  { slug: 'curitiba',       name: 'Curitiba',       state: 'PR', image: '/images/cidades/curitiba.jpg'       },
  { slug: 'porto-alegre',   name: 'Porto Alegre',   state: 'RS', image: '/images/cidades/porto-alegre.jpg'   },
  { slug: 'brasilia',       name: 'Brasília',       state: 'DF', image: '/images/cidades/brasilia.jpg'       },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────

export default async function Home() {
  const events = await prisma.event.findMany({
    where: {
      status: 'PUBLICADO',
      start_date: { gte: new Date() },
    },
    orderBy: { start_date: 'asc' },
    take: 6,
  });

  return (
    <>
      {/* ── 1. Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: '420px' }}>
        {/* Background image */}
        <Image
          src={FEATURED_EVENT.image}
          alt={FEATURED_EVENT.title}
          fill
          priority
          quality={85}
          className="object-cover"
          sizes="100vw"
        />
        {/* Dark overlay — heavier on left (desktop) / bottom (mobile) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20 sm:bg-gradient-to-r" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:hidden" />

        {/* ── MOBILE layout ── */}
        {/* Callout: top-right */}
        <Link
          href={FEATURED_EVENT.url}
          className="absolute top-4 right-4 flex flex-col gap-0.5 rounded-[var(--radius-card)] bg-black/50 px-3 py-2 text-left backdrop-blur-sm transition-colors hover:bg-black/60 sm:hidden"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">⭐ Evento em Destaque</span>
          <span className="text-xs font-bold text-white">{FEATURED_EVENT.title}</span>
          <span className="text-[11px] text-white/70">{FEATURED_EVENT.date} · {FEATURED_EVENT.city}</span>
        </Link>
        {/* Title + search: bottom-left */}
        <div className="absolute left-4 bottom-6 flex max-w-[58%] flex-col items-start text-left sm:hidden">
          <h1 className="text-xl font-bold leading-snug tracking-tight text-white">
            Descubra os melhores eventos de marketing do Brasil
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

        {/* ── DESKTOP layout ── */}
        {/* Title + search: left side, vertically centered */}
        <div className="relative hidden sm:flex sm:min-h-[480px] sm:items-center sm:justify-start sm:px-10 sm:py-16 lg:px-20">
          <div className="flex max-w-md flex-col items-start text-left">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
              Descubra os melhores eventos de marketing do Brasil
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
          </div>
        </div>
        {/* Callout: bottom-right (desktop) */}
        <Link
          href={FEATURED_EVENT.url}
          className="absolute right-8 bottom-6 hidden flex-col gap-1 rounded-[var(--radius-card)] bg-black/45 px-6 py-4 text-left backdrop-blur-sm transition-colors hover:bg-black/55 sm:flex"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">⭐ Evento em Destaque</span>
          <span className="text-base font-bold text-white">{FEATURED_EVENT.title}</span>
          <span className="text-sm text-white/75">{FEATURED_EVENT.date} · {FEATURED_EVENT.city}</span>
        </Link>
      </section>

      {/* ── 2. Categories ──────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-none sm:flex-wrap sm:justify-center sm:overflow-visible">
            {HOME_TOPICS.map((topic) => (
              <Link
                key={topic.slug}
                href={`/eventos/${topic.slug}`}
                className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary"
              >
                <span>{topic.emoji}</span>
                {topic.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Featured Events ─────────────────────────────────────── */}
      <section className="bg-bg-alt py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-text sm:text-3xl">Próximos Eventos</h2>
            <p className="mt-2 text-text-secondary">
              Eventos que vão acontecer nos próximos dias
            </p>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-text-secondary">
              Nenhum evento próximo encontrado.
            </p>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/eventos"
              className="inline-block rounded-[var(--radius-btn)] border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              Ver todos os eventos
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Cities ──────────────────────────────────────────────── */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-text sm:text-3xl">Explore por Cidade</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/eventos-marketing-${city.slug}`}
                className="group relative flex h-48 items-end overflow-hidden rounded-[var(--radius-card)] sm:h-56"
              >
                {'image' in city && city.image ? (
                  <Image
                    src={city.image}
                    alt={`Eventos de marketing em ${city.name}`}
                    fill
                    quality={85}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="relative p-4">
                  <h3 className="text-lg font-bold text-white sm:text-xl">{city.name}</h3>
                  <span className="text-sm text-white/70">{city.state}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CTA Organizers ──────────────────────────────────────── */}
      <section className="bg-primary px-4 py-14 text-center sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Você organiza eventos de marketing?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-blue-100">
            Cadastre seu evento gratuitamente e alcance milhares de profissionais de marketing.
          </p>
          <Link
            href="/para-organizadores"
            className="mt-8 inline-block rounded-[var(--radius-btn)] bg-white px-8 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-blue-50"
          >
            Cadastrar meu evento
          </Link>
        </div>
      </section>

      {/* ── 6. CTA Notifications ───────────────────────────────────── */}
      <section className="bg-bg-alt px-4 py-14 text-center sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-text sm:text-3xl">Não perca nenhum evento</h2>
          <p className="mt-3 text-text-secondary">
            Receba alertas quando novos eventos do seu interesse forem cadastrados.
          </p>

          <div className="mx-auto mt-8 flex max-w-md overflow-hidden rounded-[var(--radius-card)] border border-gray-200 bg-white shadow-sm">
            <input
              type="email"
              placeholder="seu@email.com"
              className="flex-1 px-4 py-3.5 text-sm text-text placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="button"
              className="bg-accent px-6 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-accent/90"
            >
              Quero receber
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
