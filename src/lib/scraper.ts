import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';
import type { ScrapedEventData, ScrapeMeta } from '@/types';

// ─── Page Fetching with Playwright ──────────────────────────────────

interface PageData {
  html: string;
  visibleText: string;
  metaTags: Record<string, string>;
  jsonLdScripts: string[];
  title: string;
}

async function fetchPageWithBrowser(url: string): Promise<PageData> {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'pt-BR',
    });
    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: 'load',
      timeout: 30_000,
    });

    // Wait for SPAs to render
    await page.waitForTimeout(3000);

    // Extract all data from the rendered page
    const html = await page.content();
    const visibleText = await page.evaluate(() => document.body.innerText);
    const title = await page.title();

    const metaTags = await page.evaluate(() => {
      const tags: Record<string, string> = {};
      document
        .querySelectorAll('meta[property^="og:"], meta[name^="og:"]')
        .forEach((el) => {
          const key = el.getAttribute('property') || el.getAttribute('name') || '';
          const val = el.getAttribute('content') || '';
          if (key && val) tags[key] = val;
        });
      const desc = document.querySelector('meta[name="description"]');
      if (desc) {
        const val = desc.getAttribute('content');
        if (val) tags['description'] = val;
      }
      return tags;
    });

    const jsonLdScripts = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts)
        .map((s) => s.textContent || '')
        .filter(Boolean);
    });

    await context.close();

    return { html, visibleText, metaTags, jsonLdScripts, title };
  } catch (err) {
    if (err instanceof Error && err.message.includes('Timeout')) {
      throw new Error(
        `Timeout de 30s ao acessar ${url}. Verifique se a URL está correta.`,
      );
    }
    throw new Error(
      `Não foi possível acessar a página: ${err instanceof Error ? err.message : 'erro desconhecido'}`,
    );
  } finally {
    await browser.close();
  }
}

// ─── HTML Cleaning (Cheerio) ────────────────────────────────────────

interface ExtractedContent {
  text: string;
  metaTags: Record<string, string>;
  jsonLd: string | null;
  hasJsonLd: boolean;
  hasOgTags: boolean;
}

function extractContent(pageData: PageData): ExtractedContent {
  const $ = cheerio.load(pageData.html);

  // Merge Playwright meta tags with any cheerio might find
  const metaTags = { ...pageData.metaTags };

  // Find event-related JSON-LD
  let jsonLd: string | null = null;
  for (const script of pageData.jsonLdScripts) {
    if (script.includes('Event') || script.includes('event')) {
      jsonLd = script;
      break;
    }
  }

  // Also check cheerio-parsed HTML for JSON-LD (backup)
  if (!jsonLd) {
    $('script[type="application/ld+json"]').each((_, el) => {
      const text = $(el).html();
      if (text && (text.includes('Event') || text.includes('event'))) {
        jsonLd = text;
      }
    });
  }

  // Remove non-content elements for cheerio text extraction
  $('script, style, nav, footer, header, iframe, noscript, svg, form').remove();
  $('[class*="cookie"], [class*="banner"], [class*="popup"], [class*="modal"]').remove();
  $('[class*="sidebar"], [class*="ads"], [class*="advertisement"]').remove();
  $('[id*="cookie"], [id*="banner"], [id*="popup"], [id*="modal"]').remove();

  const cheerioText = $('body')
    .text()
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Use whichever text is longer/better — Playwright's visibleText (JS-rendered)
  // or cheerio's extraction from the HTML
  const text = pageData.visibleText.length > cheerioText.length
    ? pageData.visibleText.slice(0, 15_000)
    : cheerioText.slice(0, 15_000);

  const hasOgTags = Object.keys(metaTags).some((k) => k.startsWith('og:'));

  return { text, metaTags, jsonLd, hasJsonLd: jsonLd !== null, hasOgTags };
}

// ─── Slug Generation ───────────────────────────────────────────────

function generateSlug(title: string, city: string | null): string {
  const base = city ? `${title} ${city}` : title;
  return base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// ─── Claude API Call ───────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um agente especializado em extrair informações de eventos de marketing a partir do conteúdo de páginas web.

INSTRUÇÕES IMPORTANTES:
- Analise TODOS os dados fornecidos: texto visível, meta tags e dados estruturados (JSON-LD)
- Cruze informações de diferentes fontes para maior precisão
- Se a data estiver em formato relativo ("próximo sábado"), converta para data absoluta considerando a data atual
- Para preços: defina price_type como "a_partir_de" (menor valor disponível), "unico" (valor fixo único) ou "nao_informado" (sem info); price_value deve ser o valor numérico em reais (ex: 1490.00 para R$1.490,00); se is_free=true, price_type e price_value devem ser null
- Para ticket_url, priorize links de compra (Sympla, Eventbrite, etc.)
- Se o evento tiver múltiplos dias, use start_date e end_date
- Para a descrição, retorne o conteúdo em HTML simples. Preserve a estrutura: parágrafos como <p>, listas como <ul>/<li>, negritos como <strong>, itálicos como <em>, headings como <h2>/<h3>. NÃO inclua tags <html>, <body>, <head> ou estilos inline. Capture o máximo de detalhes (programação, palestrantes, público-alvo)
- Se alguma informação não estiver disponível, use null
- NUNCA invente informações que não estejam na página

Para "topics", identifique quais se aplicam:
growth, branding, midia-paga, seo, conteudo, dados-e-analytics, crm, inteligencia-artificial, social-media, produto, email-marketing, inbound-marketing, performance, ux-e-design, ecommerce, video-e-streaming, comunidade, lideranca-em-marketing

Para "category":
CONFERENCIA, WORKSHOP, MEETUP, WEBINAR, CURSO, PALESTRA, HACKATHON

Para "format": PRESENCIAL, ONLINE, HIBRIDO

Retorne APENAS o JSON válido, sem explicações ou markdown.`;

function buildUserMessage(url: string, content: ExtractedContent): string {
  const metaStr = Object.entries(content.metaTags)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return `URL do evento: ${url}

Meta tags encontradas:
${metaStr || '(nenhuma)'}

Dados estruturados encontrados:
${content.jsonLd || '(nenhum)'}

Conteúdo da página:
${content.text}

Extraia as informações no seguinte formato JSON:
{
  "title": "string",
  "description": "string (descrição completa em HTML: <p>, <ul>/<li>, <strong>, <em>, <h2>/<h3> — sem <html>/<body>/<head> ou estilos inline)",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD ou null",
  "start_time": "HH:MM ou null",
  "end_time": "HH:MM ou null",
  "city": "string ou null",
  "state": "string (UF, 2 letras) ou null",
  "address": "string (endereço completo) ou null",
  "venue_name": "string (nome do local) ou null",
  "category": "CONFERENCIA|WORKSHOP|MEETUP|WEBINAR|CURSO|PALESTRA|HACKATHON",
  "topics": ["array de topics aplicáveis"],
  "is_free": true/false,
  "price_type": "a_partir_de|unico|nao_informado ou null se is_free=true",
  "price_value": number (valor em reais, ex: 97.00) ou null,
  "ticket_url": "string (URL para compra) ou null",
  "event_url": "string (URL oficial do evento)",
  "image_url": "string (URL da imagem/banner) ou null",
  "organizer_name": "string",
  "organizer_url": "string ou null",
  "format": "PRESENCIAL|ONLINE|HIBRIDO",
  "latitude": null,
  "longitude": null
}`;
}

function parseJsonResponse(raw: string): Record<string, unknown> {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {
    // Try extracting from markdown code block
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match?.[1]) {
      return JSON.parse(match[1].trim());
    }
    throw new Error('Não foi possível extrair JSON da resposta do modelo');
  }
}

const VALID_CATEGORIES = new Set([
  'CONFERENCIA', 'WORKSHOP', 'MEETUP', 'WEBINAR', 'CURSO', 'PALESTRA', 'HACKATHON',
]);
const VALID_FORMATS = new Set(['PRESENCIAL', 'ONLINE', 'HIBRIDO']);
const VALID_TOPICS = new Set([
  'growth', 'branding', 'midia-paga', 'seo', 'conteudo', 'dados-e-analytics',
  'crm', 'inteligencia-artificial', 'social-media', 'produto', 'email-marketing',
  'inbound-marketing', 'performance', 'ux-e-design', 'ecommerce',
  'video-e-streaming', 'comunidade', 'lideranca-em-marketing',
]);

function validateAndBuild(data: Record<string, unknown>, url: string): ScrapedEventData {
  const title = data.title as string | undefined;
  const startDate = data.start_date as string | undefined;
  const category = data.category as string | undefined;

  if (!title || typeof title !== 'string') {
    throw new Error('Campo obrigatório ausente: title');
  }
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error('Campo obrigatório ausente ou inválido: start_date (esperado YYYY-MM-DD)');
  }
  if (!category || !VALID_CATEGORIES.has(category)) {
    throw new Error(`Campo obrigatório ausente ou inválido: category (recebido: ${category})`);
  }

  const format = (data.format as string) || 'PRESENCIAL';
  const topics = Array.isArray(data.topics)
    ? (data.topics as string[]).filter((t) => VALID_TOPICS.has(t))
    : [];
  const city = (data.city as string) || null;

  return {
    title,
    description: (data.description as string) || '',
    start_date: startDate,
    end_date: (data.end_date as string) || null,
    start_time: (data.start_time as string) || null,
    end_time: (data.end_time as string) || null,
    city,
    state: (data.state as string) || null,
    address: (data.address as string) || null,
    venue_name: (data.venue_name as string) || null,
    category: category as ScrapedEventData['category'],
    topics,
    is_free: Boolean(data.is_free),
    price_type: (['a_partir_de', 'unico', 'nao_informado'].includes(data.price_type as string) ? data.price_type as ScrapedEventData['price_type'] : null),
    price_value: typeof data.price_value === 'number' && data.price_value > 0 ? data.price_value : null,
    ticket_url: (data.ticket_url as string) || null,
    event_url: (data.event_url as string) || url,
    image_url: (data.image_url as string) || null,
    organizer_name: (data.organizer_name as string) || 'Organizador',
    organizer_url: (data.organizer_url as string) || null,
    format: VALID_FORMATS.has(format) ? (format as ScrapedEventData['format']) : 'PRESENCIAL',
    latitude: typeof data.latitude === 'number' ? data.latitude : null,
    longitude: typeof data.longitude === 'number' ? data.longitude : null,
    slug: generateSlug(title, city),
  };
}

// ─── Confidence Calculation ─────────────────────────────────────────

function calcConfidence(data: ScrapedEventData): ScrapeMeta['confidence'] {
  const optionalFields: (keyof ScrapedEventData)[] = [
    'description', 'end_date', 'start_time', 'end_time',
    'city', 'state', 'address', 'venue_name',
    'price_type', 'ticket_url', 'image_url', 'organizer_url',
  ];
  const filled = optionalFields.filter((f) => data[f] !== null && data[f] !== '').length;
  if (filled >= 8) return 'high';
  if (filled >= 4) return 'medium';
  return 'low';
}

// ─── Main Export ────────────────────────────────────────────────────

export async function scrapeEventFromUrl(
  url: string,
): Promise<{ data: ScrapedEventData; meta: ScrapeMeta }> {
  // 1. Fetch page with headless browser
  const pageData = await fetchPageWithBrowser(url);

  // 2. Extract and clean content
  const content = extractContent(pageData);

  if (content.text.length < 50) {
    throw new Error(
      'Conteúdo da página muito curto — a URL pode estar bloqueando scraping ou ser inválida',
    );
  }

  // 3. Call Claude API
  const anthropic = new Anthropic();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserMessage(url, content) },
    ],
  });

  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  if (!responseText) {
    throw new Error('Resposta vazia do modelo');
  }

  // 4. Parse and validate
  const parsed = parseJsonResponse(responseText);
  const data = validateAndBuild(parsed, url);

  const meta: ScrapeMeta = {
    source_url: url,
    extracted_at: new Date().toISOString(),
    has_jsonld: content.hasJsonLd,
    has_og_tags: content.hasOgTags,
    confidence: calcConfidence(data),
  };

  return { data, meta };
}
