import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [pages, countsByCity] = await Promise.all([
      prisma.cityPage.findMany({ orderBy: [{ state: 'asc' }, { city: 'asc' }] }),
      prisma.event.groupBy({
        by: ['city'],
        where: { status: 'PUBLICADO' },
        _count: { id: true },
      }),
    ]);

    const countMap = Object.fromEntries(countsByCity.map((r) => [r.city, r._count.id]));
    const pagesWithCount = pages.map((p) => ({ ...p, event_count: countMap[p.city] ?? 0 }));

    return NextResponse.json({ pages: pagesWithCount });
  } catch (err) {
    console.error('[admin/cities] GET error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.city || !body.state || !body.slug || !body.title) {
      return NextResponse.json({ error: 'Campos obrigatórios: city, state, slug, title' }, { status: 400 });
    }

    const existingCity = await prisma.cityPage.findUnique({
      where: { city_state: { city: body.city, state: body.state } },
    });
    if (existingCity) {
      return NextResponse.json({ error: 'Página para esta cidade já existe' }, { status: 409 });
    }

    const slugTaken = await prisma.cityPage.findUnique({ where: { slug: body.slug } });
    if (slugTaken) {
      return NextResponse.json({ error: 'Slug já está em uso' }, { status: 409 });
    }

    const page = await prisma.cityPage.create({
      data: {
        city: body.city,
        state: body.state,
        slug: body.slug,
        title: body.title,
        description: body.description || null,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
      },
    });

    return NextResponse.json({ page });
  } catch (err) {
    console.error('[admin/cities] POST error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
