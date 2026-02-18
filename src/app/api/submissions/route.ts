import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { submissionSchema } from '@/lib/submission-schema';
import type { SubmissionSource } from '@/generated/prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = submissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { source, ...eventData } = parsed.data;

    const submission = await prisma.eventSubmission.create({
      data: {
        event_data: eventData as object,
        source: source as SubmissionSource,
        status: 'PENDENTE',
      },
    });

    return NextResponse.json({ success: true, id: submission.id });
  } catch (err) {
    console.error('[submissions] POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
