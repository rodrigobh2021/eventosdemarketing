import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import EventCard from '@/components/events/EventCard';
import EventFilters, {
  EventDatePills,
  MobileFilterDrawer,
  SortSelect,
} from '@/components/events/EventFilters';
import Pagination from '@/components/events/Pagination';
import {
  CITY_SLUG_TO_NAME,
  TOPIC_SLUG_TO_LABEL,
  ITEMS_PER_PAGE,
} from '@/lib/constants';
import { buildEventUrl, getCategoriaLabel } from '@/lib/utils';
import type { Prisma } from '@/generated/prisma/client';

// ─── Types ────────────────────────────────────────────────────────────

export type ListingProps = {
  /** Topic slug from the URL path, e.g. "seo" */
  tema?: string;
  /** Category DB enum from the URL path, e.g. "CURSO" */
  categoria?: string;
  /** Category plural URL slug, e.g. "cursos" */
  categoriaSlug?: string;
  /** City slug from the URL path, e.g. "sao-paulo" */
  cidade?: string;
  /** Page title to display as h1 */
  title: string;
  /** Subtitle / description below the h1 */
  subtitle: string;
  /** Base path for "clear filters" link, e.g. "/eventos/seo" */
  basePath: string;
  /** Query params from searchParams */
  searchParams: Record<string, string | string[] | undefined>;
};

// ─── Helpers ──────────────────────────────────────────────────────────

function citySlugToDbName(slug: string): string | null {
  if (slug === 'online') return 'Online';
  return CITY_SLUG_TO_NAME[slug] ?? null;
}

function buildDateRange(periodo: string | null): { gte: Date; lte?: Date } | null {
  if (!periodo) return null;
  const now = new Date();
  const today = startOfDay(now);
  switch (periodo) {
    case 'hoje':
      return { gte: today, lte: endOfDay(now) };
    case 'semana':
      return { gte: today, lte: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'mes':
      return { gte: today, lte: endOfMonth(now) };
    default:
      return null;
  }
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────

function Breadcrumbs({ tema, categoriaSlug, cidade }: { tema?: string; categoriaSlug?: string; cidade?: string }) {
  const crumbs: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Eventos', href: tema || categoriaSlug || cidade ? '/eventos' : undefined },
  ];

  if (tema) {
    const temaLabel = TOPIC_SLUG_TO_LABEL[tema] ?? tema;
    const hasMore = categoriaSlug || cidade;
    crumbs.push({ label: temaLabel, href: hasMore ? buildEventUrl({ tema }) : undefined });
  }

  if (categoriaSlug) {
    const catLabel = getCategoriaLabel(categoriaSlug);
    const hasMore = cidade;
    crumbs.push({ label: catLabel, href: hasMore ? buildEventUrl({ tema, categoria: categoriaSlug }) : undefined });
  }

  if (cidade) {
    const cidadeLabel = CITY_SLUG_TO_NAME[cidade] ?? cidade;
    crumbs.push({ label: cidadeLabel });
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-text-secondary">
        {crumbs.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
            )}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-primary transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-text font-medium">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export default async function EventListingPage({
  tema,
  categoria,
  categoriaSlug,
  cidade,
  title,
  subtitle,
  basePath,
  searchParams,
}: ListingProps) {
  // ── Parse filters ─────────────────────────────────────────────────

  // Topic — from URL path (prop) or query param
  const activeTema = tema ?? ((searchParams.tema as string) || null);
  // City — from URL path (prop) or query param
  const activeCidade = cidade ?? ((searchParams.cidade as string) || null);

  const categoriaParam = (searchParams.categoria as string) ?? null;
  const formato = (searchParams.formato as string) ?? null;
  const gratuito = searchParams.gratuito === 'true';
  const periodo = (searchParams.periodo as string) ?? null;
  const dataInicio = (searchParams.data_inicio as string) ?? null;
  const dataFim = (searchParams.data_fim as string) ?? null;
  const ordem = (searchParams.ordem as string) ?? null;
  const pagina = Math.max(1, parseInt((searchParams.pagina as string) ?? '1', 10) || 1);

  // ── Build Prisma WHERE ────────────────────────────────────────────

  const where: Prisma.EventWhereInput = { status: 'PUBLICADO' };

  // Topic (supports comma-separated from query param)
  if (activeTema) {
    const topics = activeTema.split(',').filter(Boolean);
    if (topics.length > 0) where.topics = { hasSome: topics };
  }

  // City
  if (activeCidade) {
    const dbCity = citySlugToDbName(activeCidade);
    if (dbCity) where.city = dbCity;
  }

  // Category — from URL path (prop) takes priority, then query param
  if (categoria) {
    where.category = categoria as never;
  } else if (categoriaParam) {
    const cats = categoriaParam.split(',').filter(Boolean);
    if (cats.length > 0) where.category = { in: cats as never[] };
  }

  // Format
  if (formato) {
    where.format = formato as never;
  }

  // Free only
  if (gratuito) {
    where.is_free = true;
  }

  // Date — explicit range takes priority over period pills
  if (dataInicio || dataFim) {
    const dateFilter: Record<string, Date> = {};
    if (dataInicio) dateFilter.gte = startOfDay(new Date(dataInicio));
    if (dataFim) dateFilter.lte = endOfDay(new Date(dataFim));
    where.start_date = dateFilter;
  } else {
    const dateRange = buildDateRange(periodo);
    if (dateRange) {
      where.start_date = dateRange;
    } else {
      where.start_date = { gte: startOfDay(new Date()) };
    }
  }

  // ── Sort order ────────────────────────────────────────────────────

  let orderBy: Prisma.EventOrderByWithRelationInput;
  switch (ordem) {
    case 'recentes':
      orderBy = { created_at: 'desc' };
      break;
    case 'nome':
      orderBy = { title: 'asc' };
      break;
    default:
      orderBy = { start_date: 'asc' };
  }

  // ── Query ─────────────────────────────────────────────────────────

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.event.count({ where }),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // ── Dynamic subtitle ──────────────────────────────────────────────

  const hasQueryFilters =
    activeTema || activeCidade || categoriaParam || formato || gratuito || periodo || dataInicio || dataFim;

  let displaySubtitle = subtitle;
  if (hasQueryFilters) {
    const parts: string[] = [];
    parts.push(`${total} evento${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`);

    if (activeCidade) {
      const cityName = CITY_SLUG_TO_NAME[activeCidade];
      if (cityName) parts.push(`em ${cityName}`);
    }
    if (activeTema) {
      // Handle single topic label for subtitle
      const firstTopic = activeTema.split(',')[0];
      const topicLabel = TOPIC_SLUG_TO_LABEL[firstTopic];
      if (topicLabel) {
        const extraCount = activeTema.split(',').filter(Boolean).length - 1;
        parts.push(`sobre ${topicLabel}${extraCount > 0 ? ` +${extraCount}` : ''}`);
      }
    }
    displaySubtitle = parts.join(' ');
  }

  return (
    <div className="min-h-screen bg-bg-alt">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-text sm:text-3xl">{title}</h1>
          <p className="mt-1 text-text-secondary">{displaySubtitle}</p>
        </div>
      </div>

      {/* Date pills + sort + mobile filter button */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Suspense>
            <EventDatePills />
          </Suspense>
          <div className="flex items-center gap-3">
            <Suspense>
              <SortSelect />
            </Suspense>
            <Suspense>
              <MobileFilterDrawer currentTema={tema} currentCategoria={categoriaSlug} currentCidade={cidade} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
          <Breadcrumbs tema={tema} categoriaSlug={categoriaSlug} cidade={cidade} />
        </div>
      </div>

      {/* Main content: sidebar + grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar — desktop only */}
          <aside className="hidden w-[280px] shrink-0 lg:block">
            <div className="sticky top-20 rounded-[var(--radius-card)] border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text">
                Filtrar por
              </h2>
              <Suspense>
                <EventFilters currentTema={tema} currentCategoria={categoriaSlug} currentCidade={cidade} />
              </Suspense>
            </div>
          </aside>

          {/* Results */}
          <div className="min-w-0 flex-1">
            {/* Result count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                {total} evento{total !== 1 ? 's' : ''}
              </p>
            </div>

            {events.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>

                <div className="mt-10">
                  <Suspense>
                    <Pagination totalPages={totalPages} currentPage={pagina} />
                  </Suspense>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-gray-200 bg-white px-6 py-16 text-center">
                <svg
                  className="mb-4 h-12 w-12 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-text">Nenhum evento encontrado</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Tente ajustar seus filtros para encontrar mais eventos.
                </p>
                <a
                  href={basePath}
                  className="mt-6 rounded-[var(--radius-btn)] bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  Limpar filtros
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
