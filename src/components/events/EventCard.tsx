import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Event } from '@/generated/prisma/client';

const FORMAT_LABELS: Record<string, string> = {
  PRESENCIAL: 'Presencial',
  ONLINE: 'Online',
  HIBRIDO: 'Híbrido',
};

const FORMAT_COLORS: Record<string, string> = {
  PRESENCIAL: 'bg-blue-100 text-blue-700',
  ONLINE: 'bg-purple-100 text-purple-700',
  HIBRIDO: 'bg-amber-100 text-amber-700',
};

const PLACEHOLDER_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-orange-400 to-rose-500',
  'from-emerald-400 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-pink-400 to-rose-500',
  'from-cyan-400 to-blue-500',
];

function getPlaceholderGradient(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}

export default function EventCard({ event }: { event: Event }) {
  const isCancelled = event.status === 'CANCELADO';

  // event.start_date is UTC midnight from Prisma; re-interpret as local date to avoid day shift
  const _d = new Date(event.start_date);
  const formattedDate = format(
    new Date(_d.getUTCFullYear(), _d.getUTCMonth(), _d.getUTCDate()),
    "EEE, dd 'de' MMM",
    { locale: ptBR },
  );

  const location =
    event.format === 'ONLINE'
      ? 'Evento Online'
      : [event.venue_name, event.city].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/evento/${event.slug}`}
      className={`group flex flex-col overflow-hidden rounded-[var(--radius-card)] border bg-white transition-shadow hover:shadow-lg ${
        isCancelled ? 'border-red-200 opacity-75' : 'border-gray-200'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getPlaceholderGradient(event.slug)}`}
          >
            <span className="text-3xl font-bold text-white/80">
              {event.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Format badge */}
        <span
          className={`absolute top-3 left-3 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-medium ${FORMAT_COLORS[event.format] ?? 'bg-gray-100 text-gray-700'}`}
        >
          {FORMAT_LABELS[event.format] ?? event.format}
        </span>
        {/* Cancelled badge */}
        {isCancelled && (
          <span className="absolute top-3 right-3 rounded-[var(--radius-pill)] bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
            Cancelado
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {/* Date */}
        <time className="text-sm font-semibold text-primary uppercase">{formattedDate}</time>

        {/* Title */}
        <h3 className="line-clamp-2 text-base font-semibold text-text group-hover:text-primary">
          {event.title}
        </h3>

        {/* Location */}
        <p className="line-clamp-1 text-sm text-text-secondary">{location}</p>

        {/* Price */}
        <div className="mt-auto pt-2">
          {event.is_free ? (
            <span className="inline-block rounded-[var(--radius-pill)] bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
              Gratuito
            </span>
          ) : (
            <span className="text-sm font-medium text-text-secondary">{event.price_info}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
