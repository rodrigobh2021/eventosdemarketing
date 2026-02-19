import type { Event } from '@/generated/prisma/client';
import { CATEGORY_SINGULAR_TO_SLUG, CATEGORY_SLUG_MAP, SITE_URL } from './constants';

const ATTENDANCE_MODE: Record<string, string> = {
  PRESENCIAL: 'https://schema.org/OfflineEventAttendanceMode',
  ONLINE: 'https://schema.org/OnlineEventAttendanceMode',
  HIBRIDO: 'https://schema.org/MixedEventAttendanceMode',
};

const STATUS_MAP: Record<string, string> = {
  PUBLICADO: 'https://schema.org/EventScheduled',
  CANCELADO: 'https://schema.org/EventCancelled',
  ENCERRADO: 'https://schema.org/EventScheduled',
  RASCUNHO: 'https://schema.org/EventScheduled',
};

const CATEGORY_LABELS: Record<string, string> = {
  CONFERENCIA: 'Conferência',
  WORKSHOP: 'Workshop',
  MEETUP: 'Meetup',
  WEBINAR: 'Webinar',
  CURSO: 'Curso',
  PALESTRA: 'Palestra',
  HACKATHON: 'Hackathon',
};

function buildISODate(date: Date, time: string | null): string {
  // Use UTC components: dates are stored as UTC midnight (e.g. 2026-12-10T00:00:00Z)
  // so getDate() in a UTC-3 timezone would return the day before.
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');

  if (time) {
    // time is "HH:mm" or "HH:mm:ss" in BRT (UTC-3)
    const parts = time.split(':');
    const hh = parts[0].padStart(2, '0');
    const min = parts[1]?.padStart(2, '0') ?? '00';
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00-03:00`;
  }

  return `${yyyy}-${mm}-${dd}`;
}

function buildLocation(event: Event) {
  const locations: unknown[] = [];

  if (event.format === 'PRESENCIAL' || event.format === 'HIBRIDO') {
    const place: Record<string, unknown> = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city,
        addressRegion: event.state,
        addressCountry: 'BR',
        ...(event.address ? { streetAddress: event.address } : {}),
      },
    };

    if (event.venue_name) place.name = event.venue_name;

    if (event.latitude != null && event.longitude != null) {
      place.geo = {
        '@type': 'GeoCoordinates',
        latitude: event.latitude,
        longitude: event.longitude,
      };
    }

    locations.push(place);
  }

  if (event.format === 'ONLINE' || event.format === 'HIBRIDO') {
    locations.push({
      '@type': 'VirtualLocation',
      url: event.event_url ?? `${SITE_URL}/evento/${event.slug}`,
    });
  }

  return locations.length === 1 ? locations[0] : locations;
}

export function generateEventJsonLd(event: Event) {
  const startDate = buildISODate(event.start_date, event.start_time);
  const endDate = event.end_date
    ? buildISODate(event.end_date, event.end_time)
    : event.end_time
      ? buildISODate(event.start_date, event.end_time)
      : undefined;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500),
    startDate,
    ...(endDate ? { endDate } : {}),
    eventStatus: STATUS_MAP[event.status] ?? 'https://schema.org/EventScheduled',
    eventAttendanceMode: ATTENDANCE_MODE[event.format] ?? ATTENDANCE_MODE.PRESENCIAL,
    location: buildLocation(event),
    organizer: {
      '@type': 'Organization',
      name: event.organizer_name,
      ...(event.organizer_url ? { url: event.organizer_url } : {}),
    },
    offers: {
      '@type': 'Offer',
      price: event.is_free ? '0' : (event.price_info ?? '0'),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      ...(event.ticket_url ? { url: event.ticket_url } : {}),
    },
    url: `${SITE_URL}/evento/${event.slug}`,
  };

  if (event.image_url) {
    jsonLd.image = event.image_url;
  }

  return jsonLd;
}

export function generateBreadcrumbJsonLd(event: Event) {
  const categorySlug = CATEGORY_SINGULAR_TO_SLUG[event.category];
  const categoryLabel = CATEGORY_LABELS[event.category] ?? event.category;
  const categoryInfo = categorySlug ? CATEGORY_SLUG_MAP[categorySlug] : null;

  const items = [
    { name: 'Eventos de Marketing', url: SITE_URL },
    { name: 'Eventos', url: `${SITE_URL}/eventos` },
  ];

  if (categorySlug && categoryInfo) {
    items.push({
      name: categoryInfo.label || categoryLabel,
      url: `${SITE_URL}/eventos/${categorySlug}`,
    });
  }

  items.push({
    name: event.title,
    url: `${SITE_URL}/evento/${event.slug}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
