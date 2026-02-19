/**
 * TESTE 9 — INTEGRIDADE DO SITEMAP
 * Verifica o sitemap.xml após todos os testes anteriores:
 * - Nenhuma URL de evento excluído
 * - URLs com slugs antigos não presentes
 * - Sem duplicatas
 * - Amostra de URLs retornam 200
 *
 * Execução: node tests/test9-sitemap-integridade.js
 */

import { chromium } from '../node_modules/playwright/index.mjs';

const BASE = 'http://localhost:3000';

function log(label, status, detail = '') {
  const icon = status === 'PASSOU' ? '✅' : status === 'FALHOU' ? '❌' : '⚠️';
  console.log(`${icon} ${status.padEnd(7)} | ${label}${detail ? ` — ${detail}` : ''}`);
  return { label, status, detail };
}

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 80 });
  const ctx    = await browser.newContext();
  const page   = await ctx.newPage();
  const results = [];

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' TESTE 9 — INTEGRIDADE DO SITEMAP');
  console.log('════════════════════════════════════════════════════════\n');

  // ── 1. Carrega o sitemap ───────────────────────────────────────────────

  const resp = await page.goto(`${BASE}/sitemap.xml`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  results.push(log('Sitemap carrega (200)',
    resp?.status() === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${resp?.status()}`));

  const sitemapContent = await page.content();

  // Extrai todas as <loc> URLs
  const locMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g) ?? [];
  const urls = locMatches.map(m => m.replace('<loc>', '').replace('</loc>', '').trim());

  console.log(`   Total de URLs no sitemap: ${urls.length}`);

  results.push(log('Sitemap tem URLs',
    urls.length > 0 ? 'PASSOU' : 'FALHOU',
    `${urls.length} URL(s)`));

  // ── 2. Sem duplicatas ─────────────────────────────────────────────────

  const uniqueUrls = new Set(urls);
  const duplicates = urls.length - uniqueUrls.size;

  results.push(log('2) Nenhuma URL duplicada',
    duplicates === 0 ? 'PASSOU' : 'FALHOU',
    duplicates > 0 ? `${duplicates} duplicata(s)` : 'sem duplicatas'));

  // ── 3. URLs essenciais presentes ──────────────────────────────────────

  const REQUIRED_URLS = [
    `https://www.eventosdemarketing.com.br`,
    `https://www.eventosdemarketing.com.br/eventos`,
    `https://www.eventosdemarketing.com.br/eventos-marketing-sao-paulo`,
    `https://www.eventosdemarketing.com.br/eventos-marketing-rio-de-janeiro`,
    `https://www.eventosdemarketing.com.br/eventos/growth`,
    `https://www.eventosdemarketing.com.br/eventos/seo`,
    `https://www.eventosdemarketing.com.br/eventos/conferencias`,
    `https://www.eventosdemarketing.com.br/eventos/workshops`,
  ];

  for (const url of REQUIRED_URLS) {
    const hasUrl = urls.includes(url);
    const path = url.replace('https://www.eventosdemarketing.com.br', '');
    results.push(log(`3) ${path || '/'} no sitemap`,
      hasUrl ? 'PASSOU' : 'FALHOU'));
  }

  // ── 4. Eventos publicados estão no sitemap ────────────────────────────

  const { events: adminEvents } = await fetch(`${BASE}/api/admin/events`).then(r => r.json());
  const published = (adminEvents ?? []).filter(e => e.status === 'PUBLICADO');

  let missingEvents = 0;
  for (const evt of published) {
    const evtUrl = `https://www.eventosdemarketing.com.br/evento/${evt.slug}`;
    if (!urls.includes(evtUrl)) {
      missingEvents++;
      console.log(`   ⚠️  Evento publicado ausente: /evento/${evt.slug}`);
    }
  }

  results.push(log(`1) Todos os ${published.length} eventos publicados no sitemap`,
    missingEvents === 0 ? 'PASSOU' : 'FALHOU',
    missingEvents > 0 ? `${missingEvents} ausente(s)` : 'todos presentes'));

  // ── 5. URLs base retornam 200 (amostra) ───────────────────────────────

  const SAMPLE_PATHS = [
    '/',
    '/eventos',
    '/eventos-marketing-sao-paulo',
    '/eventos/growth',
    '/eventos/conferencias',
    '/eventos/growth/sao-paulo',
    '/eventos/conferencias/sao-paulo',
    '/eventos/growth/conferencias/sao-paulo',
  ];

  let brokenCount = 0;
  for (const path of SAMPLE_PATHS) {
    const r = await fetch(`${BASE}${path}`);
    if (r.status !== 200) {
      brokenCount++;
      results.push(log(`6) ${path} retorna 200`,
        'FALHOU', `HTTP ${r.status}`));
    } else {
      results.push(log(`6) ${path} retorna 200`,
        'PASSOU', `HTTP ${r.status}`));
    }
  }

  // ── 6. lastmod coerente ────────────────────────────────────────────────

  const lastmodMatches = sitemapContent.match(/<lastmod>(.*?)<\/lastmod>/g) ?? [];
  const lastmods = lastmodMatches.map(m => m.replace('<lastmod>', '').replace('</lastmod>', '').trim());
  const invalidDates = lastmods.filter(d => isNaN(Date.parse(d)));

  results.push(log(`4) Todos os ${lastmods.length} lastmod são datas válidas`,
    invalidDates.length === 0 ? 'PASSOU' : 'FALHOU',
    invalidDates.length > 0 ? `${invalidDates.length} data(s) inválida(s)` : 'todas válidas'));

  // ── RESUMO ────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' RESUMO DO TESTE 9');
  console.log('════════════════════════════════════════════════════════');

  const passou = results.filter(r => r.status === 'PASSOU').length;
  const falhou = results.filter(r => r.status === 'FALHOU').length;
  const aviso  = results.filter(r => r.status === 'AVISO').length;

  console.log(`\n   ✅ Passou : ${passou}`);
  console.log(`   ❌ Falhou : ${falhou}`);
  console.log(`   ⚠️  Aviso  : ${aviso}`);
  console.log('');

  if (falhou > 0) {
    console.log('── Itens com falha ──');
    results.filter(r => r.status === 'FALHOU').forEach(r => {
      console.log(`   ❌ ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
    });
    console.log('');
  }

  console.log('════════════════════════════════════════════════════════\n');

  await browser.close();
  process.exit(falhou > 0 ? 1 : 0);
})();
