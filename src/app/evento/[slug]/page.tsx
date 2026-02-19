import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { prisma } from '@/lib/prisma';
import { TOPIC_SLUG_TO_LABEL, ITEMS_PER_PAGE, CATEGORY_SINGULAR_TO_SLUG, CATEGORY_SLUG_MAP, MAIN_CITIES } from '@/lib/constants';
import { buildEventUrl } from '@/lib/utils';
import { generateEventJsonLd, generateBreadcrumbJsonLd } from '@/lib/schema-org';
import EventCard from '@/components/events/EventCard';
import ShareButton from '@/components/shared/ShareButton';
import CalendarButton from '@/components/shared/CalendarButton';
import ExpandableDescription from '@/components/shared/ExpandableDescription';
import Tooltip from '@/components/shared/Tooltip';
import { Info } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  CONFERENCIA: 'Conferencia',
  WORKSHOP: 'Workshop',
  MEETUP: 'Meetup',
  WEBINAR: 'Webinar',
  CURSO: 'Curso',
  PALESTRA: 'Palestra',
  HACKATHON: 'Hackathon',
};

const CATEGORY_COLORS: Record<string, string> = {
  CONFERENCIA: 'bg-indigo-100 text-indigo-700',
  WORKSHOP: 'bg-orange-100 text-orange-700',
  MEETUP: 'bg-emerald-100 text-emerald-700',
  WEBINAR: 'bg-purple-100 text-purple-700',
  CURSO: 'bg-cyan-100 text-cyan-700',
  PALESTRA: 'bg-rose-100 text-rose-700',
  HACKATHON: 'bg-yellow-100 text-yellow-700',
};

const FORMAT_LABELS: Record<string, string> = {
  PRESENCIAL: 'Presencial',
  ONLINE: 'Online',
  HIBRIDO: 'Hibrido',
};

const FORMAT_COLORS: Record<string, string> = {
  PRESENCIAL: 'bg-blue-100 text-blue-700',
  ONLINE: 'bg-purple-100 text-purple-700',
  HIBRIDO: 'bg-amber-100 text-amber-700',
};

const BANNER_GRADIENTS: Record<string, string> = {
  CONFERENCIA: 'from-indigo-500 to-blue-600',
  WORKSHOP: 'from-orange-400 to-rose-500',
  MEETUP: 'from-emerald-400 to-teal-600',
  WEBINAR: 'from-purple-500 to-violet-600',
  CURSO: 'from-cyan-400 to-blue-500',
  PALESTRA: 'from-rose-400 to-pink-600',
  HACKATHON: 'from-yellow-400 to-orange-500',
};

// ─── Helpers ──────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Dates from Prisma arrive as UTC midnight (e.g. 2026-03-27T00:00:00.000Z).
// date-fns format() uses local time, so UTC-3 would shift March 27 → March 26.
// utcDay() re-interprets the UTC Y/M/D as a local-time date to prevent this shift.
function utcDay(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function formatDateRange(startDate: Date, endDate: Date | null): string {
  const start = utcDay(startDate);
  const end = endDate ? utcDay(endDate) : null;

  if (!end || isSameDay(start, end)) {
    return format(start, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${format(start, 'dd', { locale: ptBR })} a ${format(end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  }

  return `${format(start, "dd 'de' MMMM", { locale: ptBR })} a ${format(end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
}

function formatTimeRange(startTime: string | null, endTime: string | null): string | null {
  if (!startTime) return null;

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':');
    return m === '00' ? `${parseInt(h)}h` : `${parseInt(h)}h${m}`;
  };

  if (endTime) return `Das ${fmtTime(startTime)} as ${fmtTime(endTime)}`;
  return `A partir das ${fmtTime(startTime)}`;
}

// ─── Metadata ─────────────────────────────────────────────────────────

type MetadataProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });

  if (!event) return {};

  const title = event.meta_title ?? event.title;
  const description = event.meta_description ?? stripHtml(event.description).slice(0, 160);

  const canonicalUrl = `https://www.eventosdemarketing.com.br/evento/${slug}`;
  const ogImage = event.image_url ?? '/og-image.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: canonicalUrl },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EventoPage({ params }: Props) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug },
  });

  if (!event) notFound();

  // RASCUNHO: page is not publicly accessible
  if (event.status === 'RASCUNHO') notFound();

  const isInactive = event.status === 'CANCELADO' || event.status === 'ENCERRADO';
  const isPresencial = event.format === 'PRESENCIAL' || event.format === 'HIBRIDO';
  const isOnline = event.format === 'ONLINE' || event.format === 'HIBRIDO';
  const hasCoords = event.latitude != null && event.longitude != null;
  const dateStr = formatDateRange(event.start_date, event.end_date);
  const timeStr = formatTimeRange(event.start_time, event.end_time);
  const eventUrl = `https://www.eventosdemarketing.com.br/evento/${event.slug}`;

  // Correção 7: buscar cidade no banco se não estiver em MAIN_CITIES
  const mainCityInfo = isPresencial ? MAIN_CITIES.find((c) => c.name === event.city) : undefined;
  const dbCityInfo = isPresencial && !mainCityInfo
    ? await prisma.cityPage.findFirst({ where: { city: event.city }, select: { slug: true, city: true } })
    : null;
  const cityInfo = mainCityInfo
    ? { slug: mainCityInfo.slug, name: mainCityInfo.name }
    : dbCityInfo
      ? { slug: dbCityInfo.slug, name: dbCityInfo.city }
      : null;

  const calendarLocation =
    event.format === 'ONLINE'
      ? 'Evento Online'
      : [event.venue_name, event.address, `${event.city} - ${event.state}`]
          .filter(Boolean)
          .join(', ');
  const calendarDescription = stripHtml(event.description);

  // Related events: same topics OR same city, exclude current
  const relatedEvents = await prisma.event.findMany({
    where: {
      status: 'PUBLICADO',
      id: { not: event.id },
      start_date: { gte: new Date() },
      OR: [
        { topics: { hasSome: event.topics } },
        { city: event.city },
      ],
    },
    orderBy: { start_date: 'asc' },
    take: 3,
  });

  const eventJsonLd = generateEventJsonLd(event);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(event);

  return (
    <div className="min-h-screen bg-bg-alt">
      {/* ── JSON-LD Structured Data ──────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ── Banner ──────────────────────────────────────────────────── */}
      <div className="relative h-[200px] w-full overflow-hidden sm:h-[300px]">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${BANNER_GRADIENTS[event.category] ?? 'from-gray-400 to-gray-600'}`}
          >
            <span className="text-6xl font-bold text-white/30 sm:text-8xl">
              {event.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* ── Status Banners ──────────────────────────────────────────── */}
      {event.status === 'CANCELADO' && (
        <div className="bg-red-600 text-white px-4 py-3 text-center">
          <p className="text-sm font-semibold">⚠️ Este evento foi cancelado.</p>
        </div>
      )}
      {event.status === 'ENCERRADO' && (
        <div className="bg-gray-600 text-white px-4 py-3 text-center">
          <p className="text-sm font-semibold">📅 Este evento já aconteceu.</p>
        </div>
      )}

      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-text-secondary">
              {(() => {
                const categorySlug = CATEGORY_SINGULAR_TO_SLUG[event.category];
                const categoryInfo = categorySlug ? CATEGORY_SLUG_MAP[categorySlug] : null;
                const crumbs: { label: string; href?: string }[] = [
                  { label: 'Home', href: '/' },
                  { label: 'Eventos', href: '/eventos' },
                ];
                if (categorySlug && categoryInfo) {
                  crumbs.push({ label: categoryInfo.label, href: `/eventos/${categorySlug}` });
                }
                crumbs.push({ label: event.title });

                return crumbs.map((crumb, i) => (
                  <li key={i} className="flex items-center gap-1">
                    {i > 0 && (
                      <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                      </svg>
                    )}
                    {crumb.href ? (
                      <Link href={crumb.href} className="transition-colors hover:text-primary">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="line-clamp-1 font-medium text-text">{crumb.label}</span>
                    )}
                  </li>
                ));
              })()}
            </ol>
          </nav>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">

          {/* ── Left Column (content) ────────────────────────────────── */}
          <div className="min-w-0 flex-1">

            {/* Badges */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[event.category] ?? 'bg-gray-100 text-gray-700'}`}>
                {CATEGORY_LABELS[event.category] ?? event.category}
              </span>
              <span className={`rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold ${FORMAT_COLORS[event.format] ?? 'bg-gray-100 text-gray-700'}`}>
                {FORMAT_LABELS[event.format] ?? event.format}
              </span>
              {event.is_verified && (
                <Tooltip
                  text="Este evento foi verificado diretamente com o organizador. As informações de data, local e ingressos foram confirmadas."
                  position="bottom"
                >
                  <span className="flex cursor-default items-center gap-1.5 rounded-[var(--radius-pill)] bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Evento Verificado
                    <Info className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </span>
                </Tooltip>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-text sm:text-3xl lg:text-4xl">
              {event.title}
            </h1>

            {/* Organizer */}
            <p className="mt-2 text-text-secondary">
              por{' '}
              {event.organizer_url ? (
                <a
                  href={event.organizer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {event.organizer_name}
                </a>
              ) : (
                <span className="font-medium">{event.organizer_name}</span>
              )}
            </p>

            {/* Date & Time */}
            <div className="mt-6 flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <div>
                <p className="font-medium capitalize text-text">{dateStr}</p>
                {timeStr && <p className="text-sm text-text-secondary">{timeStr}</p>}
              </div>
            </div>

            {/* Location */}
            <div className="mt-4 flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <div>
                {isPresencial && (
                  <>
                    {event.venue_name && (
                      <p className="font-medium text-text">{event.venue_name}</p>
                    )}
                    <p className="text-sm text-text-secondary">
                      {[event.address, `${event.city} - ${event.state}`]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </>
                )}
                {isOnline && (
                  <p className="flex items-center gap-1.5 font-medium text-text">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    Evento Online
                  </p>
                )}
              </div>
            </div>

            {/* City badge */}
            {cityInfo && (
              <Link
                href={`/eventos-marketing-${cityInfo.slug}`}
                className="mt-3 ml-8 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-blue-50 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-blue-100"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                Ver mais eventos em {cityInfo.name}
              </Link>
            )}

            {/* Description */}
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-text">Sobre o evento</h2>
              <ExpandableDescription html={event.description} />
            </div>

            {/* Topics */}
            {event.topics.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 text-lg font-semibold text-text">Temas</h2>
                <div className="flex flex-wrap gap-2">
                  {event.topics.map((topic) => (
                    <Link
                      key={topic}
                      href={buildEventUrl({ tema: topic })}
                      className="rounded-[var(--radius-pill)] border border-gray-200 bg-white px-3 py-1.5 text-sm text-text transition-colors hover:border-primary hover:text-primary"
                    >
                      {TOPIC_SLUG_TO_LABEL[topic] ?? topic}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column (action sidebar) ────────────────────────── */}
          <aside className="w-full shrink-0 lg:w-[360px]">
            <div className="sticky top-20 space-y-5 rounded-[var(--radius-card)] border border-gray-200 bg-white p-6 shadow-sm">

              {isInactive ? (
                <>
                  {/* Status note */}
                  <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    event.status === 'CANCELADO'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {event.status === 'CANCELADO' ? '⚠️ Este evento foi cancelado.' : '📅 Este evento já aconteceu.'}
                  </div>

                  {/* Secondary link to event site */}
                  {event.event_url && (
                    <a
                      href={event.event_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-gray-300 px-6 py-3 text-sm font-medium text-text-secondary transition-colors hover:border-gray-400 hover:text-text"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      Visitar site do evento
                    </a>
                  )}

                  {/* Share */}
                  <ShareButton url={eventUrl} title={event.title} />

                  {/* Divider */}
                  <hr className="border-gray-100" />

                  {/* Interest */}
                  <div className="text-center">
                    <p className="text-sm text-text-secondary">
                      <span className="font-semibold text-text">{event.interest_count}</span>{' '}
                      pessoa{event.interest_count !== 1 ? 's' : ''} interessada{event.interest_count !== 1 ? 's' : ''}
                    </p>
                    <button
                      type="button"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-gray-200 px-4 py-2.5 text-sm font-medium text-text transition-colors hover:border-red-300 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                      Tenho Interesse
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Price */}
                  <div>
                    {event.is_free ? (
                      <p className="text-2xl font-bold text-success">Gratuito</p>
                    ) : (
                      <p className="text-2xl font-bold text-text">{event.price_info ?? 'Consulte'}</p>
                    )}
                  </div>

                  {/* Primary CTA */}
                  {event.ticket_url ? (
                    <a
                      href={event.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-accent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-accent/90"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                      </svg>
                      Comprar Ingresso
                    </a>
                  ) : event.event_url ? (
                    <a
                      href={event.event_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-accent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-accent/90"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      Acessar Site do Evento
                    </a>
                  ) : (
                    <div className="flex w-full items-center justify-center rounded-[var(--radius-btn)] bg-gray-100 px-6 py-3 text-base font-medium text-text-secondary">
                      Informacoes em breve
                    </div>
                  )}

                  {/* Calendar */}
                  <CalendarButton
                    slug={event.slug}
                    title={event.title}
                    description={calendarDescription}
                    startDate={event.start_date.toISOString()}
                    endDate={event.end_date?.toISOString() ?? null}
                    startTime={event.start_time}
                    endTime={event.end_time}
                    location={calendarLocation}
                  />

                  {/* Share */}
                  <ShareButton url={eventUrl} title={event.title} />

                  {/* Divider */}
                  <hr className="border-gray-100" />

                  {/* Interest */}
                  <div className="text-center">
                    <p className="text-sm text-text-secondary">
                      <span className="font-semibold text-text">{event.interest_count}</span>{' '}
                      pessoa{event.interest_count !== 1 ? 's' : ''} interessada{event.interest_count !== 1 ? 's' : ''}
                    </p>
                    <button
                      type="button"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-gray-200 px-4 py-2.5 text-sm font-medium text-text transition-colors hover:border-red-300 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                      Tenho Interesse
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ── Map ─────────────────────────────────────────────────────── */}
      {/* Correção 6: fallback para endereço/cidade quando lat/lng não disponíveis */}
      {isPresencial && (hasCoords || event.address || event.city) && (
        <div className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="mb-4 text-lg font-semibold text-text">Como chegar</h2>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-gray-200">
              <iframe
                title="Mapa do evento"
                src={hasCoords
                  ? `https://maps.google.com/maps?q=${event.latitude},${event.longitude}&z=15&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(
                      [event.address, event.city, event.state].filter(Boolean).join(', ')
                    )}&output=embed`}
                className="h-[300px] w-full sm:h-[400px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <p className="mt-3 text-sm text-text-secondary">
              {[event.venue_name, event.address, `${event.city} - ${event.state}`]
                .filter(Boolean)
                .join(' - ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Related Events ──────────────────────────────────────────── */}
      {relatedEvents.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-lg font-semibold text-text">Eventos Relacionados</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedEvents.map((related) => (
                <EventCard key={related.id} event={related} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
