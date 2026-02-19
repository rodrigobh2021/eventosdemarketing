import { NextResponse } from 'next/server';
import ical, { ICalAlarmType } from 'ical-generator';
import { prisma } from '@/lib/prisma';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function buildDate(date: Date, time: string | null): Date {
  if (!time) return date;
  const [h, m] = time.split(':').map(Number);
  // Dates are stored as UTC midnight (e.g. 2026-12-10T00:00:00Z).
  // setHours() uses local time which in UTC-3 rolls back to the previous day.
  // Instead, build the ISO string from UTC date components + BRT (UTC-3) offset
  // so the resulting Date correctly represents the intended local time.
  const yr = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dy = String(date.getUTCDate()).padStart(2, '0');
  const hr = String(h).padStart(2, '0');
  const mn = String(m).padStart(2, '0');
  return new Date(`${yr}-${mo}-${dy}T${hr}:${mn}:00-03:00`);
}

function buildLocation(event: {
  format: string;
  venue_name: string | null;
  address: string | null;
  city: string;
  state: string;
}): string {
  if (event.format === 'ONLINE') return 'Evento Online';
  return [event.venue_name, event.address, `${event.city} - ${event.state}`]
    .filter(Boolean)
    .join(', ');
}

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) {
    return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
  }

  const start = buildDate(event.start_date, event.start_time);
  const end = event.end_date
    ? buildDate(event.end_date, event.end_time)
    : event.end_time
      ? buildDate(event.start_date, event.end_time)
      : undefined;

  const cal = ical({ name: 'Eventos de Marketing' });

  const icalEvent = cal.createEvent({
    start,
    ...(end ? { end } : {}),
    summary: event.title,
    description: stripHtml(event.description)
      + `\n\n---\n\u{1F517} Saiba mais sobre este evento:\nhttps://www.eventosdemarketing.com.br/evento/${event.slug}\n\n\u{1F4C5} Encontre mais eventos de marketing em:\nhttps://www.eventosdemarketing.com.br`,
    location: buildLocation(event),
    url: `https://www.eventosdemarketing.com.br/evento/${event.slug}`,
    organizer: {
      name: event.organizer_name,
      email: 'contato@eventosdemarketing.com.br',
    },
  });

  // Reminder: 1 day before
  icalEvent.createAlarm({
    type: ICalAlarmType.display,
    triggerBefore: 24 * 60 * 60, // seconds
    description: `Lembrete: ${event.title} é amanhã!`,
  });

  // Reminder: 1 hour before
  icalEvent.createAlarm({
    type: ICalAlarmType.display,
    triggerBefore: 60 * 60, // seconds
    description: `Lembrete: ${event.title} começa em 1 hora!`,
  });

  const icsContent = cal.toString();

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
    },
  });
}
