import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const pages = await prisma.topicPage.findMany({
      orderBy: { topic: 'asc' },
    });
    return NextResponse.json({ pages });
  } catch (err) {
    console.error('[admin/topics] GET error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.topic || !body.slug || !body.title) {
      return NextResponse.json({ error: 'Campos obrigatórios: topic, slug, title' }, { status: 400 });
    }

    const existingTopic = await prisma.topicPage.findUnique({ where: { topic: body.topic } });
    if (existingTopic) {
      return NextResponse.json({ error: 'Página para este tema já existe' }, { status: 409 });
    }

    const slugTaken = await prisma.topicPage.findUnique({ where: { slug: body.slug } });
    if (slugTaken) {
      return NextResponse.json({ error: 'Slug já está em uso' }, { status: 409 });
    }

    const page = await prisma.topicPage.create({
      data: {
        topic: body.topic,
        slug: body.slug,
        title: body.title,
        description: body.description || null,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
      },
    });

    return NextResponse.json({ page });
  } catch (err) {
    console.error('[admin/topics] POST error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
