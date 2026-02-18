import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { event_data } = await req.json();

    const submission = await prisma.eventSubmission.findUnique({ where: { id } });
    if (!submission) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 });
    }

    await prisma.eventSubmission.update({
      where: { id },
      data: { event_data },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/submissions/[id]] PUT error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
