import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    const page = await prisma.cityPage.findUnique({ where: { id } });
    if (!page) {
      return NextResponse.json({ error: 'Página de cidade não encontrada' }, { status: 404 });
    }

    if (body.slug && body.slug !== page.slug) {
      const taken = await prisma.cityPage.findUnique({ where: { slug: body.slug } });
      if (taken) {
        return NextResponse.json({ error: 'Slug já está em uso' }, { status: 409 });
      }
    }

    const updated = await prisma.cityPage.update({
      where: { id },
      data: {
        slug: body.slug || page.slug,
        title: body.title || page.title,
        description: body.description ?? null,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
      },
    });

    return NextResponse.json({ page: updated });
  } catch (err) {
    console.error('[admin/cities/[id]] PUT error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const page = await prisma.cityPage.findUnique({ where: { id } });
    if (!page) {
      return NextResponse.json({ error: 'Página de cidade não encontrada' }, { status: 404 });
    }

    await prisma.cityPage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/cities/[id]] DELETE error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
