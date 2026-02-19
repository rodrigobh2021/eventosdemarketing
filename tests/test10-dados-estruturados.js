/**
 * TESTE 10 — DADOS ESTRUTURADOS (JSON-LD)
 * Verifica dados estruturados em 3 páginas de eventos:
 * - @type: Event com todos os campos obrigatórios
 * - Datas em formato ISO 8601
 * - Location correto (Place/VirtualLocation)
 * - Offers com preço e URL
 * - BreadcrumbList presente e correto
 *
 * Execução: node tests/test10-dados-estruturados.js
 */

import { chromium } from '../node_modules/playwright/index.mjs';

const BASE = 'http://localhost:3000';

function log(label, status, detail = '') {
  const icon = status === 'PASSOU' ? '✅' : status === 'FALHOU' ? '❌' : '⚠️';
  console.log(`${icon} ${status.padEnd(7)} | ${label}${detail ? ` — ${detail}` : ''}`);
  return { label, status, detail };
}

async function extractJsonLd(page) {
  const scripts = await page.locator('script[type="application/ld+json"]').allInnerTexts();
  const result = { event: null, breadcrumb: null };
  for (const raw of scripts) {
    try {
      const ld = JSON.parse(raw);
      if (ld['@type'] === 'Event') result.event = ld;
      else if (ld['@type'] === 'BreadcrumbList') result.breadcrumb = ld;
      else if (Array.isArray(ld['@graph'])) {
        for (const node of ld['@graph']) {
          if (node['@type'] === 'Event') result.event = node;
          if (node['@type'] === 'BreadcrumbList') result.breadcrumb = node;
        }
      }
    } catch { /* ignore parse errors */ }
  }
  return result;
}

function isIso8601(str) {
  if (!str) return false;
  // Accept full ISO date: YYYY-MM-DD or YYYY-MM-DDThh:mm:ss±hh:mm
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)?)?$/.test(str);
}

async function verifyEventPage(page, results, eventSlug, label) {
  console.log(`\n  ── ${label}: /evento/${eventSlug} ──`);

  const resp = await page.goto(`${BASE}/evento/${eventSlug}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const status = resp?.status() ?? 0;

  if (status !== 200) {
    results.push(log(`${label}) Página carrega (200)`, 'FALHOU', `HTTP ${status}`));
    return;
  }

  results.push(log(`${label}) Página carrega (200)`, 'PASSOU', `HTTP ${status}`));

  const { event: eventLd, breadcrumb } = await extractJsonLd(page);

  // 1. JSON-LD @type=Event presente
  results.push(log(`${label}) JSON-LD @type=Event presente`,
    eventLd !== null ? 'PASSOU' : 'FALHOU',
    eventLd ? `name: "${String(eventLd.name ?? '').slice(0, 50)}"` : 'não encontrado'));

  if (!eventLd) return;

  // 2. Campos obrigatórios do schema.org Event
  const requiredFields = ['name', 'startDate', 'eventStatus', 'eventAttendanceMode', 'location', 'organizer', 'url'];
  for (const field of requiredFields) {
    const hasField = eventLd[field] != null;
    results.push(log(`${label}) Campo obrigatório "${field}"`,
      hasField ? 'PASSOU' : 'FALHOU',
      hasField ? `${JSON.stringify(eventLd[field]).slice(0, 60)}` : 'ausente'));
  }

  // 3. Datas em ISO 8601
  const startDateValid = isIso8601(eventLd.startDate);
  results.push(log(`${label}) startDate em ISO 8601`,
    startDateValid ? 'PASSOU' : 'FALHOU',
    `startDate: "${eventLd.startDate}"`));

  if (eventLd.endDate) {
    const endDateValid = isIso8601(eventLd.endDate);
    results.push(log(`${label}) endDate em ISO 8601`,
      endDateValid ? 'PASSOU' : 'FALHOU',
      `endDate: "${eventLd.endDate}"`));
  }

  // 4. Location — Place ou VirtualLocation
  const loc = eventLd.location;
  const locTypes = Array.isArray(loc) ? loc.map(l => l['@type']) : [loc?.['@type']];
  const validLocTypes = locTypes.every(t => t === 'Place' || t === 'VirtualLocation');
  results.push(log(`${label}) location é Place ou VirtualLocation`,
    validLocTypes ? 'PASSOU' : 'FALHOU',
    `types: ${locTypes.join(', ')}`));

  if (!Array.isArray(loc) && loc?.['@type'] === 'Place') {
    const hasAddress = loc.address?.['@type'] === 'PostalAddress';
    results.push(log(`${label}) Place.address é PostalAddress`,
      hasAddress ? 'PASSOU' : 'FALHOU'));
  }

  // 5. Offers
  const offers = eventLd.offers;
  if (offers) {
    results.push(log(`${label}) Offers presente`,
      offers['@type'] === 'Offer' ? 'PASSOU' : 'FALHOU',
      `@type: ${offers['@type']}`));

    const hasPrice = offers.price != null;
    results.push(log(`${label}) Offers.price presente`,
      hasPrice ? 'PASSOU' : 'FALHOU',
      `price: "${offers.price}", currency: "${offers.priceCurrency}"`));
  } else {
    results.push(log(`${label}) Offers presente`, 'FALHOU', 'offers ausente'));
  }

  // 6. Organizer
  const organizer = eventLd.organizer;
  results.push(log(`${label}) Organizer presente`,
    organizer?.name ? 'PASSOU' : 'FALHOU',
    `name: "${organizer?.name}"`));

  // 7. BreadcrumbList
  results.push(log(`${label}) BreadcrumbList presente`,
    breadcrumb !== null ? 'PASSOU' : 'FALHOU',
    breadcrumb ? `${breadcrumb.itemListElement?.length} itens` : 'não encontrado'));

  if (breadcrumb?.itemListElement) {
    const items = breadcrumb.itemListElement;
    // Primeiro item deve ser a home
    const firstItem = items[0];
    results.push(log(`${label}) BreadcrumbList item 1 = home`,
      firstItem?.item?.includes('eventosdemarketing') ? 'PASSOU' : 'FALHOU',
      `item: "${firstItem?.item}"`));

    // Último item deve ser o evento
    const lastItem = items[items.length - 1];
    results.push(log(`${label}) BreadcrumbList último item = evento`,
      lastItem?.item?.includes(`/evento/${eventSlug}`) ? 'PASSOU' : 'FALHOU',
      `item: "${lastItem?.item}"`));
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 80 });
  const ctx    = await browser.newContext();
  const page   = await ctx.newPage();
  const results = [];

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' TESTE 10 — DADOS ESTRUTURADOS (JSON-LD)');
  console.log('════════════════════════════════════════════════════════\n');

  // Busca eventos para testar
  const { events: allEvents } = await fetch(`${BASE}/api/admin/events`).then(r => r.json());
  const published = (allEvents ?? []).filter(e => e.status === 'PUBLICADO');

  if (published.length === 0) {
    console.log('❌ Nenhum evento publicado encontrado. Abortando.');
    await browser.close(); process.exit(1);
  }

  // Seleciona até 3 eventos: presencial, online, e mais recente se houver
  const presencial = published.find(e => e.format === 'PRESENCIAL');
  const online = published.find(e => e.format === 'ONLINE');
  const recente = published.filter(e => e !== presencial && e !== online)[0];

  const toTest = [presencial, online, recente].filter(Boolean).slice(0, 3);

  console.log(`   Eventos a testar: ${toTest.length}`);
  toTest.forEach((e, i) => console.log(`     ${i+1}. "${e.title}" (${e.format}) → /evento/${e.slug}`));

  for (let i = 0; i < toTest.length; i++) {
    await verifyEventPage(page, results, toTest[i].slug, `E${i+1}`);
  }

  // ── RESUMO ────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' RESUMO DO TESTE 10');
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
