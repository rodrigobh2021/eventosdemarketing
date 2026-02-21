import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';
import type { ScrapedEventData, ScrapeMeta } from '@/types';

// ─── Page Fetching with fetch + cheerio ──────────────────────────────

interface PageData {
  html: string;
  visibleText: string;
  metaTags: Record<string, string>;
  jsonLdScripts: string[];
  title: string;
}

// ─── Jina AI Reader fallback for SPAs ────────────────────────────────

async function fetchPageViaJina(url: string): Promise<PageData> {
  const jinaUrl = `https://r.jina.ai/${url}`;

  let response: Response;
  try {
    response = await fetch(jinaUrl, {
      headers: {
        Accept: 'application/json',
        'X-Return-Format': 'markdown',
      },
      signal: AbortSignal.timeout(45_000),
    });
  } catch (err) {
    throw new Error(
      `Jina Reader falhou ao acessar a página: ${err instanceof Error ? err.message : 'erro desconhecido'}`,
    );
  }

  if (!response.ok) {
    throw new Error(`Jina Reader retornou HTTP ${response.status}`);
  }

  const json = (await response.json()) as {
    data?: { content?: string; title?: string; description?: string };
  };
  const content = json.data?.content ?? '';
  const title = json.data?.title ?? '';
  const description = json.data?.description ?? '';

  if (!content || content.length < 50) {
    throw new Error(
      'Este site usa renderização JavaScript e não pôde ser lido automaticamente. ' +
        'Por favor, preencha o formulário manualmente.',
    );
  }

  const metaTags: Record<string, string> = {};
  if (description) metaTags['description'] = description;

  return {
    html: `<html><body>${content}</body></html>`,
    visibleText: content,
    metaTags,
    jsonLdScripts: [],
    title,
  };
}

// Domains known to block server-side scraping (anti-bot, queue systems)
const ANTI_BOT_DOMAINS = [
  'queue-it.net',
  'queue-it.com',
  'datadome.co',
  'imperva.com',
  'perimeterx.net',
  'kasada.io',
];

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
};

async function fetchPageWithHttp(url: string): Promise<PageData> {
  // Follow redirects manually to detect anti-bot systems before failing
  let currentUrl = url;
  let response: Response | null = null;
  const MAX_REDIRECTS = 10;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    try {
      response = await fetch(currentUrl, {
        headers: FETCH_HEADERS,
        redirect: 'manual',
        signal: AbortSignal.timeout(20_000),
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new Error(`Timeout ao acessar ${url}. Verifique se a URL está correta.`);
      }
      throw new Error(
        `Não foi possível acessar a página: ${err instanceof Error ? err.message : 'erro desconhecido'}`,
      );
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) break;

      const resolvedLocation = new URL(location, currentUrl).href;

      const isAntiBot = ANTI_BOT_DOMAINS.some((d) => resolvedLocation.includes(d));
      if (isAntiBot) {
        throw new Error(
          'Este site usa proteção anti-bot que impede a extração automática. ' +
            'Por favor, preencha as informações do evento manualmente.',
        );
      }

      currentUrl = resolvedLocation;
      continue;
    }

    break;
  }

  if (!response || !response.ok) {
    const status = response?.status ?? 0;
    if (status === 403 || status === 429) {
      throw new Error(
        'Este site bloqueou o acesso automático (HTTP ' +
          status +
          '). Por favor, preencha as informações do evento manualmente.',
      );
    }
    throw new Error(
      `Não foi possível acessar a página: HTTP ${status}`,
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title =
    $('title').text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    '';

  const metaTags: Record<string, string> = {};
  $('meta[property^="og:"], meta[name^="og:"]').each((_, el) => {
    const key = $(el).attr('property') || $(el).attr('name') || '';
    const val = $(el).attr('content') || '';
    if (key && val) metaTags[key] = val;
  });
  const descContent = $('meta[name="description"]').attr('content');
  if (descContent) metaTags['description'] = descContent;

  const jsonLdScripts: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).html() || '';
    if (text) jsonLdScripts.push(text);
  });

  $('script, style, nav, footer, header, iframe, noscript, svg, form').remove();
  const visibleText = $('body').text().replace(/\s+/g, ' ').trim();

  return { html, visibleText, metaTags, jsonLdScripts, title };
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

  // Use whichever text is longer/better — basic visibleText
  // or cheerio's extraction with deeper filtering
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
  // start_date: use empty string if missing/invalid so the user can fill manually
  const validStartDate =
    startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : '';

  // category: fall back to CONFERENCIA if the AI returned something invalid
  const validCategory: ScrapedEventData['category'] =
    category && VALID_CATEGORIES.has(category)
      ? (category as ScrapedEventData['category'])
      : 'CONFERENCIA';

  const format = (data.format as string) || 'PRESENCIAL';
  const topics = Array.isArray(data.topics)
    ? (data.topics as string[]).filter((t) => VALID_TOPICS.has(t))
    : [];
  const city = (data.city as string) || null;

  return {
    title,
    description: (data.description as string) || '',
    start_date: validStartDate,
    end_date: (data.end_date as string) || null,
    start_time: (data.start_time as string) || null,
    end_time: (data.end_time as string) || null,
    city,
    state: (data.state as string) || null,
    address: (data.address as string) || null,
    venue_name: (data.venue_name as string) || null,
    category: validCategory,
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
  // 1. Fetch page with HTTP + cheerio
  let pageData = await fetchPageWithHttp(url);

  // 2. Extract and clean content
  let content = extractContent(pageData);

  // Detect SPA shell: minimal text but page loaded OK → try Jina Reader
  const isSpaShell =
    content.text.length < 50 &&
    (pageData.html.includes('id="root"') || pageData.html.includes("id='root'") ||
      pageData.html.includes('id="app"') || pageData.html.includes("id='app'"));

  if (isSpaShell) {
    pageData = await fetchPageViaJina(url);
    content = extractContent(pageData);
  }

  if (content.text.length < 50 && !content.hasOgTags && !content.hasJsonLd) {
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
