import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { EventCategory } from '@/generated/prisma/client';

export async function GET() {
  try {
    const pages = await prisma.categoryPage.findMany({
      orderBy: { category: 'asc' },
    });
    return NextResponse.json({ pages });
  } catch (err) {
    console.error('[admin/categories] GET error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.category || !body.slug || !body.title) {
      return NextResponse.json({ error: 'Campos obrigatórios: category, slug, title' }, { status: 400 });
    }

    const existing = await prisma.categoryPage.findUnique({ where: { category: body.category as EventCategory } });
    if (existing) {
      return NextResponse.json({ error: 'Página para esta categoria já existe' }, { status: 409 });
    }

    const slugTaken = await prisma.categoryPage.findUnique({ where: { slug: body.slug } });
    if (slugTaken) {
      return NextResponse.json({ error: 'Slug já está em uso' }, { status: 409 });
    }

    const page = await prisma.categoryPage.create({
      data: {
        category: body.category as EventCategory,
        slug: body.slug,
        title: body.title,
        description: body.description || null,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
      },
    });

    return NextResponse.json({ page });
  } catch (err) {
    console.error('[admin/categories] POST error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
