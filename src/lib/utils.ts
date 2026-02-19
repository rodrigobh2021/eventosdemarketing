import {
  TOPIC_SLUGS,
  CATEGORY_SLUGS,
  CATEGORY_SLUG_MAP,
  CITY_SLUGS,
  TOPIC_SLUG_TO_LABEL,
  CITY_SLUG_TO_NAME,
  CATEGORY_SINGULAR_TO_SLUG,
} from '@/lib/constants';

// ─── URL Builder ───────────────────────────────────────────────────────

/**
 * Build the canonical URL for an event listing page.
 *
 * Rules:
 *   { }                                                    → /eventos
 *   { tema: "seo" }                                        → /eventos/seo
 *   { categoria: "cursos" }                                → /eventos/cursos
 *   { categoria: "cursos", cidade: "sao-paulo" }           → /eventos/cursos/sao-paulo
 *   { tema: "seo", categoria: "cursos" }                   → /eventos/seo/cursos
 *   { tema: "seo", categoria: "cursos", cidade: "sp" }     → /eventos/seo/cursos/sao-paulo
 *   { tema: "seo", cidade: "sao-paulo" }                   → /eventos/seo/sao-paulo
 *   { cidade: "sao-paulo" }                                → /eventos-marketing-sao-paulo
 *
 * `categoria` is the plural URL slug (e.g. "cursos", "workshops").
 */
export function buildEventUrl({
  tema,
  categoria,
  cidade,
}: {
  tema?: string;
  categoria?: string;
  cidade?: string;
} = {}): string {
  // City-only → vanity URL
  if (!tema && !categoria && cidade) return `/eventos-marketing-${cidade}`;

  const segments = ['/eventos'];
  if (tema) segments.push(tema);
  if (categoria) segments.push(categoria);
  if (cidade) segments.push(cidade);
  return segments.join('/');
}

// ─── URL Parser ────────────────────────────────────────────────────────

export type ParsedEventParams = {
  tema?: string;
  categoria?: string;     // plural slug, e.g. "cursos"
  categoriaSingular?: string; // DB enum, e.g. "CURSO"
  cidade?: string;
  valid: boolean;
};

/**
 * Parse the catch-all segments from `/eventos/[[...params]]`.
 *
 * Valid patterns:
 *   []                                → all events
 *   [tema]                            → /eventos/seo
 *   [categoriaSlug]                   → /eventos/cursos
 *   [tema, categoriaSlug]             → /eventos/seo/cursos
 *   [tema, cidadeSlug]                → /eventos/seo/sao-paulo
 *   [categoriaSlug, cidadeSlug]       → /eventos/cursos/sao-paulo
 *   [tema, categoriaSlug, cidadeSlug] → /eventos/seo/cursos/sao-paulo
 */
export function parseEventParams(
  params: string[] = [],
  extraCities: Set<string> = new Set(),
): ParsedEventParams {
  if (params.length === 0) return { valid: true };
  if (params.length > 3) return { valid: false };

  const [first, second, third] = params;
  const isCity = (s: string) => CITY_SLUGS.has(s) || extraCities.has(s);

  // ── 1 segment ──────────────────────────────────────────────────────
  if (params.length === 1) {
    if (CATEGORY_SLUGS.has(first)) {
      const cat = CATEGORY_SLUG_MAP[first];
      return { categoria: first, categoriaSingular: cat.singular, valid: true };
    }
    if (TOPIC_SLUGS.has(first)) {
      return { tema: first, valid: true };
    }
    return { valid: false };
  }

  // ── 2 segments ─────────────────────────────────────────────────────
  if (params.length === 2) {
    // tema + categoria
    if (TOPIC_SLUGS.has(first) && CATEGORY_SLUGS.has(second)) {
      const cat = CATEGORY_SLUG_MAP[second];
      return { tema: first, categoria: second, categoriaSingular: cat.singular, valid: true };
    }
    // tema + cidade
    if (TOPIC_SLUGS.has(first) && isCity(second)) {
      return { tema: first, cidade: second, valid: true };
    }
    // categoria + cidade
    if (CATEGORY_SLUGS.has(first) && isCity(second)) {
      const cat = CATEGORY_SLUG_MAP[first];
      return { categoria: first, categoriaSingular: cat.singular, cidade: second, valid: true };
    }
    return { valid: false };
  }

  // ── 3 segments: tema + categoria + cidade ──────────────────────────
  if (!TOPIC_SLUGS.has(first) || !CATEGORY_SLUGS.has(second) || !isCity(third)) {
    return { valid: false };
  }

  const cat = CATEGORY_SLUG_MAP[second];
  return { tema: first, categoria: second, categoriaSingular: cat.singular, cidade: third, valid: true };
}

// ─── Label Helpers ─────────────────────────────────────────────────────

export function getTemaLabel(tema: string): string {
  return TOPIC_SLUG_TO_LABEL[tema] ?? tema;
}

export function getCidadeLabel(cidade: string): string {
  return CITY_SLUG_TO_NAME[cidade] ?? cidade;
}

export function getCategoriaLabel(categoriaSlug: string): string {
  return CATEGORY_SLUG_MAP[categoriaSlug]?.label ?? categoriaSlug;
}

/**
 * Convert a DB enum category (e.g. "WORKSHOP") to its URL slug ("workshops").
 */
export function categoryEnumToSlug(enumValue: string): string | undefined {
  return CATEGORY_SINGULAR_TO_SLUG[enumValue];
}
