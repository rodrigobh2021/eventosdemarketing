import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { reason } = await req.json();

    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Motivo de rejeição obrigatório' }, { status: 400 });
    }

    const submission = await prisma.eventSubmission.findUnique({ where: { id } });
    if (!submission) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 });
    }

    await prisma.eventSubmission.update({
      where: { id },
      data: {
        status: 'REJEITADO',
        reviewer_notes: reason.trim(),
        reviewed_at: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/submissions/[id]/reject] POST error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
