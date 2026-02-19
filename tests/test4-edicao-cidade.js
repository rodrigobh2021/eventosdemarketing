/**
 * TESTE 4 — EDIÇÃO DE CIDADE
 * Edita os campos de uma CityPage via admin e verifica as alterações
 * nas páginas públicas. Reverte tudo ao final.
 *
 * Execução: node tests/test4-edicao-cidade.js
 *
 * ── Notas de design ──────────────────────────────────────────────────────────
 * • Os slugs de cidade são ESTÁTICOS (definidos em MAIN_CITIES em constants.ts).
 *   Alterar CityPage.slug no DB muda apenas o lookup de metadata, NÃO o
 *   roteamento (validado contra CITY_SLUGS set). Slug NÃO será alterado.
 * • A home page exibe city cards com nomes de array local CITIES (estático) —
 *   item (h) N/A.
 * • A sidebar usa MAIN_CITIES de constants.ts — item (i) N/A.
 * • O badge "Ver mais eventos em [Cidade]" usa CITY_SLUG_TO_NAME (estático) —
 *   item (j) N/A.
 * • CityPage.title e CityPage.description SÃO renderizados no corpo da página
 *   (ao contrário de CategoryPage). A page usa `force-dynamic` → SSR imediato.
 * • A rota PUT /api/admin/cities/[id] NÃO atualiza `city` ou `state` (usados
 *   para lookup de eventos no DB).
 */

import { chromium } from '../node_modules/playwright/index.mjs';

const BASE = 'http://localhost:3000';

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(label, status, detail = '') {
  const icon = status === 'PASSOU' ? '✅' : status === 'FALHOU' ? '❌' : '⚠️';
  console.log(`${icon} ${status.padEnd(7)} | ${label}${detail ? ` — ${detail}` : ''}`);
  return { label, status, detail };
}

async function getStatus(page, url) {
  const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  return r ? r.status() : 0;
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 80 });
  const ctx    = await browser.newContext();
  const page   = await ctx.newPage();
  const results = [];

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' TESTE 4 — EDIÇÃO DE CIDADE');
  console.log('════════════════════════════════════════════════════════\n');

  // ── 0. Seleciona uma CityPage existente ───────────────────────────────────

  const { pages: cityPages } = await fetch(`${BASE}/api/admin/cities`).then(r => r.json());
  if (!cityPages?.length) {
    console.log('❌ Nenhuma CityPage encontrada. Abortando.');
    await browser.close(); process.exit(1);
  }

  // Escolhe "sao-paulo" — slug mais representativo e com mais eventos
  const target = cityPages.find(p => p.slug === 'sao-paulo') ?? cityPages[0];

  const ORIG = {
    id:               target.id,
    slug:             target.slug,         // NÃO será alterado (routing estático)
    city:             target.city,
    state:            target.state,
    title:            target.title,
    description:      target.description,
    meta_title:       target.meta_title,
    meta_description: target.meta_description,
  };

  const NEW = {
    title:            `${ORIG.title ?? 'Eventos de Marketing em São Paulo'} [EDITADO T4]`,
    description:      'Descrição editada no Teste 4 para verificação de SEO e renderização na página pública.',
    meta_title:       'Eventos de Marketing SP 2026 — EDITADO TESTE4',
    meta_description: 'Meta description editada no Teste 4. Encontre eventos em São Paulo.',
  };

  console.log(`📋 Cidade selecionada: "${ORIG.city}" (slug: ${ORIG.slug})`);
  console.log(`   ID       : ${ORIG.id}`);
  console.log(`   State    : ${ORIG.state}`);
  console.log(`   Slug     : ${ORIG.slug} (não será alterado — routing estático)`);
  console.log(`   URL pública: /eventos-marketing-${ORIG.slug}`);
  console.log('');
  console.log('   ℹ️  Notas de design:');
  console.log('   • City slugs são estáticos (MAIN_CITIES em constants.ts).');
  console.log('     Alterar slug no DB não muda routing → slug mantido.');
  console.log('   • Home "Explore por Cidade" usa array local CITIES (estático).');
  console.log('   • Sidebar usa MAIN_CITIES (estático).');
  console.log('   • Badge "Ver mais eventos" usa CITY_SLUG_TO_NAME (estático).');
  console.log('   • title e description SÃO renderizados no corpo da página.');
  console.log('');

  // ── 1. PRÉ-VERIFICAÇÃO ────────────────────────────────────────────────────

  console.log('── Pré-verificações ──');

  const cityUrl = `${BASE}/eventos-marketing-${ORIG.slug}`;
  const preStatus = await getStatus(page, cityUrl);
  results.push(log(`Pré: /eventos-marketing-${ORIG.slug} existe (200)`,
    preStatus === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${preStatus}`));

  const preTitleEl = await page.locator('head title').innerText().catch(() => '');
  console.log(`   Meta title atual : "${preTitleEl}"`);

  const preMetaDesc = await page.locator('meta[name="description"]')
    .getAttribute('content').catch(() => '');
  console.log(`   Meta desc atual  : "${preMetaDesc?.slice(0, 80)}"`);

  const preH1 = await page.locator('h1').first().innerText().catch(() => '');
  console.log(`   H1 atual         : "${preH1?.slice(0, 80)}"`);
  console.log('');

  // ── 2. EDIÇÃO VIA API ADMIN ───────────────────────────────────────────────

  console.log('── Editando CityPage via API admin ──');

  const putResp = await fetch(`${BASE}/api/admin/cities/${ORIG.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug:             ORIG.slug,        // mantém o mesmo slug
      title:            NEW.title,
      description:      NEW.description,
      meta_title:       NEW.meta_title,
      meta_description: NEW.meta_description,
    }),
  });
  const putBody = await putResp.json();

  results.push(log('PUT /api/admin/cities/[id]',
    putResp.status === 200 ? 'PASSOU' : 'FALHOU',
    `HTTP ${putResp.status} — ${JSON.stringify(putBody).slice(0, 120)}`));

  if (putResp.status !== 200) {
    console.log('\n❌ Edição falhou. Abortando.');
    await browser.close(); process.exit(1);
  }

  await page.waitForTimeout(1500);
  console.log('');

  // ── 3. VERIFICAÇÕES PÓS-EDIÇÃO ────────────────────────────────────────────

  console.log('── Verificações pós-edição ──');

  // a) /eventos-marketing-[slug] carrega (200)
  const catStatus = await getStatus(page, cityUrl);
  results.push(log(`a) /eventos-marketing-${ORIG.slug} retorna 200`,
    catStatus === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${catStatus}`));

  // d) Meta title
  const newTitleEl = await page.locator('head title').innerText().catch(() => '');
  const titleMatch = newTitleEl.includes('EDITADO TESTE4') || newTitleEl.includes('Eventos de Marketing SP 2026');
  results.push(log('d) <title> contém novo meta title',
    titleMatch ? 'PASSOU' : 'FALHOU',
    `<title>: "${newTitleEl.slice(0, 80)}"`));

  // d) Meta description
  const newMetaDesc = await page.locator('meta[name="description"]')
    .getAttribute('content').catch(() => '');
  const descMatch = (newMetaDesc ?? '').includes('EDITADO TESTE4')
    || (newMetaDesc ?? '').includes('Teste 4');
  results.push(log('d) <meta description> contém nova meta description',
    descMatch ? 'PASSOU' : 'FALHOU',
    `meta: "${(newMetaDesc ?? '').slice(0, 80)}"`));

  // f) H1 (title da página) reflete novo valor
  const newH1 = await page.locator('h1').first().innerText().catch(() => '');
  const h1Match = newH1.includes('EDITADO T4');
  results.push(log('f) <h1> reflete novo title',
    h1Match ? 'PASSOU' : 'FALHOU',
    `h1: "${newH1.slice(0, 80)}"`));

  // g) Descrição renderizada no corpo da página
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const bodyDescMatch = bodyText.includes('Descrição editada no Teste 4')
    || bodyText.includes('verificação de SEO');
  results.push(log('g) Descrição nova renderizada no corpo da página',
    bodyDescMatch ? 'PASSOU' : 'FALHOU',
    'busca texto "Descrição editada no Teste 4"'));

  // b) Slug antigo retorna 404? (N/A — slug não mudou, logging como AVISO)
  results.push(log(
    'b) Slug antigo retorna 404 (N/A — slug estático, não alterado)',
    'AVISO',
    'CityPage.slug tied to MAIN_CITIES — routing estático, slug mantido'));

  // c) Sitemap contém /eventos-marketing-[slug] e combinações
  await page.goto(`${BASE}/sitemap.xml`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const sitemap = await page.content();

  const cityInSitemap = sitemap.includes(`/eventos-marketing-${ORIG.slug}</loc>`);
  results.push(log(`c) /eventos-marketing-${ORIG.slug} no sitemap`,
    cityInSitemap ? 'PASSOU' : 'FALHOU'));

  // Combinações tema × cidade
  const temaXCidade = sitemap.includes(`/eventos/growth/${ORIG.slug}</loc>`);
  results.push(log(`c) /eventos/growth/${ORIG.slug} no sitemap`,
    temaXCidade ? 'PASSOU' : 'FALHOU'));

  // Combinações categoria × cidade
  const catXCidade = sitemap.includes(`/eventos/conferencias/${ORIG.slug}</loc>`);
  results.push(log(`c) /eventos/conferencias/${ORIG.slug} no sitemap`,
    catXCidade ? 'PASSOU' : 'FALHOU'));

  // Combinações tema × categoria × cidade
  const temaXCatXCidade = sitemap.includes(`/eventos/growth/conferencias/${ORIG.slug}</loc>`);
  results.push(log(`c) /eventos/growth/conferencias/${ORIG.slug} no sitemap`,
    temaXCatXCidade ? 'PASSOU' : 'FALHOU'));

  // e) Home page cards "Explore por Cidade" (N/A — home usa array local CITIES estático)
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const homeCityLink = await page.locator(`a[href="/eventos-marketing-${ORIG.slug}"]`).count() > 0;
  results.push(log(
    `e) Home page: link /eventos-marketing-${ORIG.slug}`,
    homeCityLink ? 'PASSOU' : 'AVISO',
    homeCityLink
      ? 'link encontrado na home'
      : 'ausente — home usa array local CITIES estático'));

  // i) Sidebar cidade — verifica dropdown em /eventos
  await page.goto(`${BASE}/eventos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const sidebarText = await page.locator('body').innerText().catch(() => '');
  const sidebarHasCity = sidebarText.toLowerCase().includes('são paulo')
    || sidebarText.toLowerCase().includes('sao paulo');
  results.push(log('i) Sidebar mostra "São Paulo" (static MAIN_CITIES)',
    sidebarHasCity ? 'PASSOU' : 'FALHOU',
    'nome exibido vem de MAIN_CITIES (estático)'));

  results.push(log(
    'h) Home "Explore por Cidade" nome (N/A — array local estático)',
    'AVISO',
    'home page usa CITIES array local com city.name — não reflete CityPage'));

  results.push(log(
    'j) Badge "Ver mais eventos em [Cidade]" (N/A — usa CITY_SLUG_TO_NAME)',
    'AVISO',
    'valor vem de CITY_SLUG_TO_NAME em constants.ts — não reflete CityPage'));

  // g) Combinações de URL funcionam
  const combos = [
    `/eventos/growth/${ORIG.slug}`,
    `/eventos/conferencias/${ORIG.slug}`,
    `/eventos/growth/conferencias/${ORIG.slug}`,
    `/eventos/seo/${ORIG.slug}`,
  ];

  for (const path of combos) {
    const s = await getStatus(page, `${BASE}${path}`);
    results.push(log(`k) ${path} carrega (200)`,
      s === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${s}`));
  }

  // ── 4. REVERT ─────────────────────────────────────────────────────────────

  console.log('\n── Revertendo cidade para valores originais ──');

  const revertResp = await fetch(`${BASE}/api/admin/cities/${ORIG.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug:             ORIG.slug,
      title:            ORIG.title ?? '',
      description:      ORIG.description ?? null,
      meta_title:       ORIG.meta_title ?? null,
      meta_description: ORIG.meta_description ?? null,
    }),
  });
  const revertBody = await revertResp.json();

  if (revertResp.status === 200) {
    console.log('   ✅ Revertido com sucesso');
    await page.waitForTimeout(1000);
    await page.goto(cityUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const revertedTitle = await page.locator('head title').innerText().catch(() => '');
    const isReverted = !revertedTitle.includes('EDITADO TESTE4');
    results.push(log('Revert: meta title restaurado',
      isReverted ? 'PASSOU' : 'FALHOU',
      `<title>: "${revertedTitle.slice(0, 80)}"`));

    // Também verifica que o H1 foi revertido
    const revertedH1 = await page.locator('h1').first().innerText().catch(() => '');
    const h1Reverted = !revertedH1.includes('EDITADO T4');
    results.push(log('Revert: H1 restaurado',
      h1Reverted ? 'PASSOU' : 'FALHOU',
      `h1: "${revertedH1.slice(0, 80)}"`));
  } else {
    results.push(log('Revert: PUT restauração', 'FALHOU',
      `HTTP ${revertResp.status} — ${JSON.stringify(revertBody)}`));
  }

  // ── 5. RESUMO ─────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' RESUMO DO TESTE 4');
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

  if (aviso > 0) {
    console.log('── Avisos (design constraints) ──');
    results.filter(r => r.status === 'AVISO').forEach(r => {
      console.log(`   ⚠️  ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
    });
    console.log('');
  }

  console.log('════════════════════════════════════════════════════════\n');

  await browser.close();
  process.exit(falhou > 0 ? 1 : 0);
})();
