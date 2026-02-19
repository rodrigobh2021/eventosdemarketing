import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { EventCategory, EventFormat } from '@/generated/prisma/client';

type RouteParams = { params: Promise<{ id: string }> };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(title: string, city: string): Promise<string> {
  const base = city ? slugify(`${title} ${city}`) : slugify(title);
  let slug = base;
  let n = 2;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { is_verified, notes, slug: adminSlug, meta_title, meta_description } = await req.json();

    const submission = await prisma.eventSubmission.findUnique({ where: { id } });
    if (!submission) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 });
    }
    if (submission.status !== 'PENDENTE' && submission.status !== 'REJEITADO') {
      return NextResponse.json({ error: 'Submissão já foi aprovada' }, { status: 400 });
    }

    const d = submission.event_data as Record<string, unknown>;

    // Use admin-provided slug if given, else auto-generate
    let slug: string;
    if (adminSlug && typeof adminSlug === 'string' && adminSlug.trim()) {
      const candidate = adminSlug.trim();
      const taken = await prisma.event.findUnique({ where: { slug: candidate } });
      if (taken) {
        return NextResponse.json({ error: `Slug "${candidate}" já está em uso. Escolha outro.` }, { status: 409 });
      }
      slug = candidate;
    } else {
      slug = await uniqueSlug(String(d.title ?? ''), String(d.city ?? ''));
    }

    const event = await prisma.event.create({
      data: {
        slug,
        title: String(d.title ?? ''),
        description: String(d.description ?? ''),
        start_date: new Date(String(d.start_date)),
        end_date: d.end_date ? new Date(String(d.end_date)) : null,
        start_time: d.start_time ? String(d.start_time) : null,
        end_time: d.end_time ? String(d.end_time) : null,
        city: String(d.city ?? 'Online'),
        state: String(d.state ?? 'SP'),
        address: d.address ? String(d.address) : null,
        latitude: typeof d.latitude === 'number' ? d.latitude : null,
        longitude: typeof d.longitude === 'number' ? d.longitude : null,
        venue_name: d.venue_name ? String(d.venue_name) : null,
        category: String(d.category ?? 'CONFERENCIA') as EventCategory,
        topics: Array.isArray(d.topics) ? (d.topics as string[]) : [],
        is_free: Boolean(d.is_free),
        price_info: d.price_info ? String(d.price_info) : null,
        ticket_url: d.ticket_url ? String(d.ticket_url) : null,
        event_url: d.event_url ? String(d.event_url) : null,
        image_url: d.image_url ? String(d.image_url) : null,
        organizer_name: String(d.organizer_name ?? 'Organizador'),
        organizer_url: d.organizer_url ? String(d.organizer_url) : null,
        format: String(d.format ?? 'PRESENCIAL') as EventFormat,
        status: 'PUBLICADO',
        is_verified: Boolean(is_verified),
        source_url: d.source_url ? String(d.source_url) : null,
        meta_title: meta_title ? String(meta_title) : null,
        meta_description: meta_description ? String(meta_description) : null,
      },
    });

    await prisma.eventSubmission.update({
      where: { id },
      data: {
        status: 'APROVADO',
        reviewer_notes: notes?.trim() || null,
        reviewed_at: new Date(),
      },
    });

    // Auto-create CityPage for cities not already registered (skips Online events)
    if (event.city && event.city !== 'Online') {
      const citySlug = slugify(event.city);
      const existingCityPage = await prisma.cityPage.findFirst({
        where: { OR: [{ slug: citySlug }, { city: event.city, state: event.state }] },
      });
      if (!existingCityPage) {
        await prisma.cityPage.create({
          data: {
            city: event.city,
            state: event.state,
            slug: citySlug,
            title: `Eventos de Marketing em ${event.city}`,
            description: `Encontre conferências, workshops, meetups e webinars de marketing em ${event.city}, ${event.state}.`,
            meta_title: `Eventos de Marketing em ${event.city} 2026 | eventosdemarketing.com.br`,
            meta_description: `Encontre os melhores eventos de marketing em ${event.city}, ${event.state}. Conferências, workshops, meetups e webinars. Veja a agenda completa e inscreva-se.`,
          },
        }).catch(() => {/* ignore duplicate errors */});
      }
    }

    return NextResponse.json({ success: true, slug: event.slug });
  } catch (err) {
    console.error('[admin/submissions/[id]/approve] POST error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
