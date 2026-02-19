import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) return NextResponse.json([]);

  const cities = await prisma.cityPage.findMany({
    where: { city: { contains: q, mode: 'insensitive' } },
    select: { slug: true, city: true, state: true },
    orderBy: { city: 'asc' },
    take: 8,
  });

  return NextResponse.json(cities);
}
