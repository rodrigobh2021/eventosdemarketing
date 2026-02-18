import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { SubmissionStatus } from '@/generated/prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');

    const [pendente, aprovado, rejeitado, submissions] = await Promise.all([
      prisma.eventSubmission.count({ where: { status: 'PENDENTE' } }),
      prisma.eventSubmission.count({ where: { status: 'APROVADO' } }),
      prisma.eventSubmission.count({ where: { status: 'REJEITADO' } }),
      prisma.eventSubmission.findMany({
        where: statusParam ? { status: statusParam as SubmissionStatus } : undefined,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return NextResponse.json({
      submissions,
      counts: { PENDENTE: pendente, APROVADO: aprovado, REJEITADO: rejeitado },
    });
  } catch (err) {
    console.error('[admin/submissions] GET error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
