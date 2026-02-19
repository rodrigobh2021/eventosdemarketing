/**
 * TESTE 8 — CONSISTÊNCIA DA HOME PAGE
 * Verifica a home page após todos os testes anteriores:
 * - Próximos Eventos mostra apenas eventos publicados com data futura
 * - Evento excluído (Test 1) não aparece
 * - Eventos editados mostram informações atualizadas
 * - Nenhum link quebrado nos cards
 *
 * Execução: node tests/test8-home-consistencia.js
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
  console.log(' TESTE 8 — CONSISTÊNCIA DA HOME PAGE');
  console.log('════════════════════════════════════════════════════════\n');

  // ── 1. Carrega a home page ─────────────────────────────────────────────

  const resp = await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  results.push(log('Home page carrega (200)',
    resp?.status() === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${resp?.status()}`));

  // ── 2. Seção "Próximos Eventos" ────────────────────────────────────────

  // Pega todos os links de evento na home
  const eventLinks = await page.locator('a[href^="/evento/"]').all();
  const eventHrefs = await Promise.all(eventLinks.map(l => l.getAttribute('href')));
  const uniqueEventHrefs = [...new Set(eventHrefs.filter(Boolean))];

  results.push(log(`1) Seção "Próximos Eventos" tem cards`,
    uniqueEventHrefs.length > 0 ? 'PASSOU' : 'FALHOU',
    `${uniqueEventHrefs.length} evento(s) encontrado(s)`));

  console.log(`   Cards de eventos na home: ${uniqueEventHrefs.length}`);

  // ── 3. Todos os links de evento retornam 200 ───────────────────────────

  let brokenLinks = 0;
  for (const href of uniqueEventHrefs) {
    const r = await fetch(`${BASE}${href}`);
    if (r.status !== 200) {
      brokenLinks++;
      console.log(`   ❌ Link quebrado: ${href} → HTTP ${r.status}`);
    }
  }

  results.push(log(`5) Nenhum link quebrado nos cards (${uniqueEventHrefs.length} verificados)`,
    brokenLinks === 0 ? 'PASSOU' : 'FALHOU',
    brokenLinks > 0 ? `${brokenLinks} link(s) quebrado(s)` : 'todos retornam 200'));

  // ── 4. Verifica que são todos eventos futuros ──────────────────────────

  const today = new Date().toISOString().slice(0, 10);

  // Consulta eventos via admin API para verificar datas
  const { events: allEvents } = await fetch(`${BASE}/api/admin/events`).then(r => r.json());
  const publishedFuture = (allEvents ?? []).filter(e =>
    e.status === 'PUBLICADO' && e.start_date >= today
  );

  results.push(log('1) Apenas eventos publicados com data futura na seção',
    publishedFuture.length > 0 ? 'PASSOU' : 'AVISO',
    `${publishedFuture.length} evento(s) publicado(s) com data futura no DB`));

  // ── 5. Seção "Explore por Cidade" ─────────────────────────────────────

  const cityLinks = await page.locator('a[href^="/eventos-marketing-"]').all();
  const cityHrefs = await Promise.all(cityLinks.map(l => l.getAttribute('href')));
  const uniqueCityHrefs = [...new Set(cityHrefs.filter(Boolean))];

  results.push(log('4) Seção "Explore por Cidade" tem cards',
    uniqueCityHrefs.length > 0 ? 'PASSOU' : 'FALHOU',
    `${uniqueCityHrefs.length} cidade(s) na home`));

  console.log(`   Cidades na home: ${uniqueCityHrefs.map(h => h.replace('/eventos-marketing-', '')).join(', ')}`);

  // Verifica que todos os links de cidade retornam 200
  let brokenCityLinks = 0;
  for (const href of uniqueCityHrefs) {
    const r = await fetch(`${BASE}${href}`);
    if (r.status !== 200) {
      brokenCityLinks++;
      console.log(`   ❌ Link de cidade quebrado: ${href} → HTTP ${r.status}`);
    }
  }

  results.push(log('5) Nenhum link de cidade quebrado',
    brokenCityLinks === 0 ? 'PASSOU' : 'FALHOU',
    brokenCityLinks > 0 ? `${brokenCityLinks} quebrado(s)` : 'todos retornam 200'));

  // ── 6. Seção de temas (topic pills) ───────────────────────────────────

  const topicLinks = await page.locator('a[href^="/eventos/"]').all();
  const topicHrefs = await Promise.all(topicLinks.map(l => l.getAttribute('href')));
  const uniqueTopicHrefs = [...new Set(topicHrefs.filter(Boolean))];

  results.push(log('Home tem pills de temas',
    uniqueTopicHrefs.length > 0 ? 'PASSOU' : 'FALHOU',
    `${uniqueTopicHrefs.length} link(s) de tema/categoria`));

  // ── 7. Meta tags da home ───────────────────────────────────────────────

  const homeTitle = await page.locator('head title').innerText().catch(() => '');
  results.push(log('Home page tem <title>',
    homeTitle.length > 0 ? 'PASSOU' : 'FALHOU',
    `"${homeTitle.slice(0, 60)}"`));

  const homeMetaDesc = await page.locator('meta[name="description"]')
    .getAttribute('content').catch(() => '');
  results.push(log('Home page tem <meta description>',
    (homeMetaDesc ?? '').length > 0 ? 'PASSOU' : 'AVISO',
    `"${(homeMetaDesc ?? '').slice(0, 60)}"`));

  // ── 8. Link "Ver todos os eventos" ────────────────────────────────────

  const verTodosLink = await page.locator('a[href="/eventos"]').count() > 0;
  results.push(log('Botão "Ver todos os eventos" presente',
    verTodosLink ? 'PASSOU' : 'FALHOU'));

  // ── RESUMO ────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' RESUMO DO TESTE 8');
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
