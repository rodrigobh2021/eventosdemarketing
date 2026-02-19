import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cron job: POST /api/cron/close-events
// Vercel cron schedule: "0 3 * * *" (daily at 03:00 UTC = 00:00 Brasília)
//
// Marks as ENCERRADO all published events whose last date has passed:
//  - If end_date exists → end_date < start of today
//  - If end_date is null → start_date < start of today

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}

async function run() {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await prisma.event.updateMany({
      where: {
        status: 'PUBLICADO',
        OR: [
          // Has end_date and it has already passed
          { end_date: { lt: startOfToday } },
          // No end_date but start_date has passed
          { end_date: null, start_date: { lt: startOfToday } },
        ],
      },
      data: { status: 'ENCERRADO' },
    });

    console.log(`[cron/close-events] ${result.count} evento(s) encerrado(s).`);

    return NextResponse.json({
      ok: true,
      message: `${result.count} evento(s) marcado(s) como Encerrado.`,
      count: result.count,
    });
  } catch (err) {
    console.error('[cron/close-events] error:', err);
    return NextResponse.json({ ok: false, error: 'Erro interno' }, { status: 500 });
  }
}
