import { NextResponse } from 'next/server';
import ical, { ICalAlarmType } from 'ical-generator';
import { prisma } from '@/lib/prisma';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function buildDate(date: Date, time: string | null): Date {
  if (!time) return date;
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
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
