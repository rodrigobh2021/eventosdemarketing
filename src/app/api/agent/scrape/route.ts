import { NextResponse } from 'next/server';
import { scrapeEventFromUrl } from '@/lib/scraper';
import type { ScrapeApiResult } from '@/types';

export const maxDuration = 60;

export async function POST(req: Request): Promise<NextResponse<ScrapeApiResult>> {
  try {
    const body = await req.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Campo "url" é obrigatório' },
        { status: 400 },
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: `URL inválida: ${url}` },
        { status: 400 },
      );
    }

    const { data, meta } = await scrapeEventFromUrl(url);

    return NextResponse.json({ success: true, data, meta });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao processar a URL';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
