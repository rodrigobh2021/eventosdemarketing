import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { EventCategory, EventFormat, EventStatus } from '@/generated/prisma/client';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Validate slug uniqueness if changed
    const newSlug = body.slug?.trim() || event.slug;
    if (newSlug !== event.slug) {
      const existing = await prisma.event.findUnique({ where: { slug: newSlug } });
      if (existing) {
        return NextResponse.json({ error: 'Slug já está em uso por outro evento' }, { status: 409 });
      }
    }

    await prisma.event.update({
      where: { id },
      data: {
        slug: newSlug,
        title: body.title,
        description: body.description,
        start_date: new Date(body.start_date),
        end_date: body.end_date ? new Date(body.end_date) : null,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
        city: body.city,
        state: body.state,
        address: body.address || null,
        venue_name: body.venue_name || null,
        latitude: typeof body.latitude === 'number' ? body.latitude : null,
        longitude: typeof body.longitude === 'number' ? body.longitude : null,
        category: body.category as EventCategory,
        topics: Array.isArray(body.topics) ? body.topics : [],
        is_free: Boolean(body.is_free),
        price_info: body.price_info || null,
        ticket_url: body.ticket_url || null,
        event_url: body.event_url || null,
        image_url: body.image_url || null,
        organizer_name: body.organizer_name,
        organizer_url: body.organizer_url || null,
        format: body.format as EventFormat,
        status: body.status as EventStatus,
        is_verified: Boolean(body.is_verified),
        source_url: body.source_url || null,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/events/[id]] PUT error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/events/[id]] DELETE error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
