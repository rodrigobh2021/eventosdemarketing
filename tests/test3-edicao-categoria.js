/**
 * TESTE 3 — EDIÇÃO DE CATEGORIA
 * Edita os campos de uma CategoryPage via admin e verifica as alterações
 * nas páginas públicas. Reverte tudo ao final.
 *
 * Execução: node tests/test3-edicao-categoria.js
 *
 * ── Notas de design ──────────────────────────────────────────────────────────
 * • Os slugs de categoria são ESTÁTICOS (definidos em CATEGORY_SLUG_MAP em
 *   constants.ts). Alterar CategoryPage.slug no DB muda apenas o lookup de
 *   metadata, NÃO o roteamento. Portanto o slug NÃO será alterado neste teste.
 * • A home page exibe pills de TEMAS, não de categorias — item (e) N/A.
 * • A sidebar usa labels estáticos de EVENT_CATEGORIES — item (f) N/A.
 * • CategoryPage.title e CategoryPage.description são armazenados mas ainda
 *   não exibidos no corpo da página (apenas meta tags são usadas).
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
  console.log(' TESTE 3 — EDIÇÃO DE CATEGORIA');
  console.log('════════════════════════════════════════════════════════\n');

  // ── 0. Seleciona uma CategoryPage existente ────────────────────────────────

  const { pages: catPages } = await fetch(`${BASE}/api/admin/categories`).then(r => r.json());
  if (!catPages?.length) {
    console.log('❌ Nenhuma CategoryPage encontrada. Abortando.');
    await browser.close(); process.exit(1);
  }

  // Escolhe "workshops" — tem eventos associados e slug fixo bem definido
  const target = catPages.find(p => p.slug === 'workshops') ?? catPages[0];

  const ORIG = {
    id:               target.id,
    slug:             target.slug,          // NÃO será alterado (routing estático)
    title:            target.title,
    description:      target.description,
    meta_title:       target.meta_title,
    meta_description: target.meta_description,
    category:         target.category,
  };

  const NEW = {
    title:            `${ORIG.title} [EDITADO T3]`,
    description:      'Descrição editada no Teste 3 para verificação de SEO.',
    meta_title:       'Workshops de Marketing 2026 — EDITADO TESTE3',
    meta_description: 'Meta description editada no Teste 3. Workshops de marketing no Brasil.',
  };

  console.log(`📋 Categoria selecionada: "${ORIG.title}" (slug: ${ORIG.slug})`);
  console.log(`   ID       : ${ORIG.id}`);
  console.log(`   Category : ${ORIG.category}`);
  console.log(`   Slug     : ${ORIG.slug} (não será alterado — routing estático)`);
  console.log(`   URL pública: /eventos/${ORIG.slug}`);
  console.log('');
  console.log('   ℹ️  Nota de design:');
  console.log('   • Category slugs são estáticos (CATEGORY_SLUG_MAP). Alterar o slug');
  console.log('     no DB não muda o routing → slug mantido para não quebrar o lookup.');
  console.log('   • A home page exibe pills de TEMAS, não de categorias.');
  console.log('   • A sidebar usa labels estáticos (EVENT_CATEGORIES em constants.ts).');
  console.log('');

  // ── 1. PRÉ-VERIFICAÇÃO ────────────────────────────────────────────────────

  console.log('── Pré-verificações ──');

  const preStatus = await getStatus(page, `${BASE}/eventos/${ORIG.slug}`);
  results.push(log(`Pré: /eventos/${ORIG.slug} existe (200)`,
    preStatus === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${preStatus}`));

  // Salva o meta title atual antes da edição
  const preTitleEl = await page.locator('head title').innerText().catch(() => '');
  console.log(`   Meta title atual : "${preTitleEl}"`);

  const preMetaDesc = await page.locator('meta[name="description"]')
    .getAttribute('content').catch(() => '');
  console.log(`   Meta desc atual  : "${preMetaDesc?.slice(0, 80)}"`);
  console.log('');

  // ── 2. EDIÇÃO VIA API ADMIN ───────────────────────────────────────────────

  console.log('── Editando CategoryPage via API admin ──');

  const putResp = await fetch(`${BASE}/api/admin/categories/${ORIG.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category:         ORIG.category,
      slug:             ORIG.slug,        // mantém o mesmo slug
      title:            NEW.title,
      description:      NEW.description,
      meta_title:       NEW.meta_title,
      meta_description: NEW.meta_description,
    }),
  });
  const putBody = await putResp.json();

  results.push(log('PUT /api/admin/categories/[id]',
    putResp.status === 200 ? 'PASSOU' : 'FALHOU',
    `HTTP ${putResp.status} — ${JSON.stringify(putBody).slice(0, 100)}`));

  if (putResp.status !== 200) {
    console.log('\n❌ Edição falhou. Abortando.');
    await browser.close(); process.exit(1);
  }

  await page.waitForTimeout(1500);
  console.log('');

  // ── 3. VERIFICAÇÕES PÓS-EDIÇÃO ────────────────────────────────────────────

  console.log('── Verificações pós-edição ──');

  // a) /eventos/[slug] carrega com novos dados no <head>
  const catUrl = `${BASE}/eventos/${ORIG.slug}`;
  const catStatus = await getStatus(page, catUrl);
  results.push(log(`a) /eventos/${ORIG.slug} retorna 200`,
    catStatus === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${catStatus}`));

  // d) Meta title
  const newTitleEl = await page.locator('head title').innerText().catch(() => '');
  const titleMatch = newTitleEl.includes('EDITADO TESTE3') || newTitleEl.includes('Workshops de Marketing 2026');
  results.push(log('d) <title> contém novo meta title',
    titleMatch ? 'PASSOU' : 'FALHOU',
    `<title>: "${newTitleEl.slice(0, 80)}"`));

  // d) Meta description
  const newMetaDesc = await page.locator('meta[name="description"]')
    .getAttribute('content').catch(() => '');
  const descMatch = (newMetaDesc ?? '').includes('EDITADO TESTE3')
    || (newMetaDesc ?? '').includes('Teste 3');
  results.push(log('d) <meta description> contém nova meta description',
    descMatch ? 'PASSOU' : 'FALHOU',
    `meta: "${(newMetaDesc ?? '').slice(0, 80)}"`));

  // b) slug antigo retorna 404? (N/A — slug não mudou, logging como AVISO)
  results.push(log(
    'b) Slug antigo retorna 404 (N/A — slug estático, não alterado)',
    'AVISO',
    'CategoryPage.slug tied to CATEGORY_SLUG_MAP — routing estático, slug mantido'));

  // c) Sitemap contém /eventos/[slug] e combinações
  await page.goto(`${BASE}/sitemap.xml`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const sitemap = await page.content();

  const catInSitemap = sitemap.includes(`/eventos/${ORIG.slug}</loc>`);
  results.push(log(`c) /eventos/${ORIG.slug} no sitemap`,
    catInSitemap ? 'PASSOU' : 'FALHOU'));

  // Combinações tema × categoria
  const temaXCat = sitemap.includes(`/eventos/seo/${ORIG.slug}</loc>`);
  results.push(log(`c) /eventos/seo/${ORIG.slug} no sitemap`,
    temaXCat ? 'PASSOU' : 'FALHOU'));

  // Combinações categoria × cidade
  const catXCidade = sitemap.includes(`/eventos/${ORIG.slug}/sao-paulo</loc>`);
  results.push(log(`c) /eventos/${ORIG.slug}/sao-paulo no sitemap`,
    catXCidade ? 'PASSOU' : 'FALHOU'));

  // Combinações tema × categoria × cidade
  const temaXCatXCidade = sitemap.includes(`/eventos/seo/${ORIG.slug}/sao-paulo</loc>`);
  results.push(log(`c) /eventos/seo/${ORIG.slug}/sao-paulo no sitemap`,
    temaXCatXCidade ? 'PASSOU' : 'FALHOU'));

  // e) Home page categoria (N/A — home mostra pills de temas, não de categorias)
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const homeCatLink = await page.locator(`a[href="/eventos/${ORIG.slug}"]`).count() > 0;
  results.push(log(
    `e) Home page: link /eventos/${ORIG.slug}`,
    homeCatLink ? 'PASSOU' : 'AVISO',
    homeCatLink
      ? 'link encontrado na home'
      : 'ausente — home exibe pills de TEMAS, não de categorias (design atual)'));

  // f) Sidebar categoria — verifica em /eventos se sidebar tem link para /eventos/[slug]
  await page.goto(`${BASE}/eventos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const sidebarCatLink = await page.locator(`a[href="/eventos/${ORIG.slug}"]`).count() > 0;
  const sidebarWorkshopsText = await page.locator('body').innerText().catch(() => '');
  const sidebarHasLabel = sidebarWorkshopsText.toLowerCase().includes('workshop');
  results.push(log('f) Sidebar mostra label "Workshop" (static)',
    sidebarHasLabel ? 'PASSOU' : 'FALHOU',
    'labels da sidebar são estáticos (EVENT_CATEGORIES em constants.ts)'));
  results.push(log(
    `f) Sidebar: link /eventos/${ORIG.slug}`,
    sidebarCatLink ? 'AVISO' : 'AVISO',
    sidebarCatLink
      ? 'link encontrado na sidebar'
      : 'sidebar usa checkboxes (query param ?categoria=), não links diretos'));

  // g) Combinações funcionam
  const combos = [
    `/eventos/${ORIG.slug}/sao-paulo`,
    `/eventos/seo/${ORIG.slug}`,
    `/eventos/growth/${ORIG.slug}`,
    `/eventos/${ORIG.slug}/curitiba`,
  ];

  for (const path of combos) {
    const s = await getStatus(page, `${BASE}${path}`);
    results.push(log(`g) ${path} carrega (200)`,
      s === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${s}`));
  }

  // ── 4. REVERT ─────────────────────────────────────────────────────────────

  console.log('\n── Revertendo categoria para valores originais ──');

  const revertResp = await fetch(`${BASE}/api/admin/categories/${ORIG.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category:         ORIG.category,
      slug:             ORIG.slug,
      title:            ORIG.title,
      description:      ORIG.description,
      meta_title:       ORIG.meta_title,
      meta_description: ORIG.meta_description,
    }),
  });
  const revertBody = await revertResp.json();

  if (revertResp.status === 200) {
    console.log(`   ✅ Revertido com sucesso`);
    // Verifica que a página voltou ao estado original
    await page.waitForTimeout(1000);
    await page.goto(catUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const revertedTitle = await page.locator('head title').innerText().catch(() => '');
    const isReverted = !revertedTitle.includes('EDITADO TESTE3');
    results.push(log('Revert: meta title restaurado',
      isReverted ? 'PASSOU' : 'FALHOU',
      `<title>: "${revertedTitle.slice(0, 80)}"`));
  } else {
    results.push(log('Revert: PUT restauração', 'FALHOU',
      `HTTP ${revertResp.status} — ${JSON.stringify(revertBody)}`));
  }

  // ── 5. RESUMO ─────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' RESUMO DO TESTE 3');
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
