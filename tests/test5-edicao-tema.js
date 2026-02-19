/**
 * TESTE 5 — EDIÇÃO DE TEMA
 * Edita os campos de uma TopicPage via admin e verifica as alterações
 * nas páginas públicas. Reverte tudo ao final.
 *
 * Execução: node tests/test5-edicao-tema.js
 *
 * ── Notas de design ──────────────────────────────────────────────────────────
 * • Os slugs de tema são ESTÁTICOS (definidos em EVENT_TOPICS em constants.ts).
 *   Alterar TopicPage.slug no DB muda apenas o lookup de metadata, NÃO o
 *   roteamento (validado contra TOPIC_SLUGS set). Slug NÃO será alterado.
 * • TopicPage.meta_title e meta_description SÃO usados em generateMetadata
 *   para /eventos/[tema].
 * • TopicPage.title e description são armazenados mas NÃO renderizados no
 *   corpo da página pública — apenas as meta tags usam esses valores.
 * • Home page pills de temas usam EVENT_TOPICS (estático) — item (e) N/A.
 * • Tags de tema nas páginas individuais de eventos usam TOPIC_SLUG_TO_LABEL
 *   (estático) — item (f) N/A.
 * • H1 e subtítulo da página usam getTemaLabel() → TOPIC_SLUG_TO_LABEL —
 *   estático, não reflete TopicPage.title.
 * • /eventos/[[...params]] usa revalidate=86400 (ISR); em dev é sempre SSR.
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
  console.log(' TESTE 5 — EDIÇÃO DE TEMA');
  console.log('════════════════════════════════════════════════════════\n');

  // ── 0. Seleciona uma TopicPage existente ──────────────────────────────────

  const { pages: topicPages } = await fetch(`${BASE}/api/admin/topics`).then(r => r.json());
  if (!topicPages?.length) {
    console.log('❌ Nenhuma TopicPage encontrada. Abortando.');
    await browser.close(); process.exit(1);
  }

  // Escolhe "growth" — slug representativo e com mais eventos
  const target = topicPages.find(p => p.slug === 'growth') ?? topicPages[0];

  const ORIG = {
    id:               target.id,
    slug:             target.slug,         // NÃO será alterado (routing estático)
    title:            target.title,
    description:      target.description,
    meta_title:       target.meta_title,
    meta_description: target.meta_description,
  };

  const NEW = {
    title:            `${ORIG.title ?? 'Growth Marketing'} [EDITADO T5]`,
    description:      'Descrição editada no Teste 5 para verificação de SEO.',
    meta_title:       'Eventos de Growth Marketing 2026 — EDITADO TESTE5',
    meta_description: 'Meta description editada no Teste 5. Eventos de growth marketing no Brasil.',
  };

  console.log(`📋 Tema selecionado: slug="${ORIG.slug}"`);
  console.log(`   ID       : ${ORIG.id}`);
  console.log(`   Slug     : ${ORIG.slug} (não será alterado — routing estático)`);
  console.log(`   URL pública: /eventos/${ORIG.slug}`);
  console.log('');
  console.log('   ℹ️  Notas de design:');
  console.log('   • Topic slugs são estáticos (EVENT_TOPICS em constants.ts).');
  console.log('     Alterar slug no DB não muda routing → slug mantido.');
  console.log('   • meta_title e meta_description SÃO refletidos nas meta tags.');
  console.log('   • title e description NÃO são renderizados no corpo da página.');
  console.log('   • H1 usa getTemaLabel() → TOPIC_SLUG_TO_LABEL (estático).');
  console.log('   • Home pills e event tags usam constantes estáticas.');
  console.log('');

  // ── 1. PRÉ-VERIFICAÇÃO ────────────────────────────────────────────────────

  console.log('── Pré-verificações ──');

  const topicUrl = `${BASE}/eventos/${ORIG.slug}`;
  const preStatus = await getStatus(page, topicUrl);
  results.push(log(`Pré: /eventos/${ORIG.slug} existe (200)`,
    preStatus === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${preStatus}`));

  const preTitleEl = await page.locator('head title').innerText().catch(() => '');
  console.log(`   Meta title atual : "${preTitleEl}"`);

  const preMetaDesc = await page.locator('meta[name="description"]')
    .getAttribute('content').catch(() => '');
  console.log(`   Meta desc atual  : "${preMetaDesc?.slice(0, 80)}"`);

  const preH1 = await page.locator('h1').first().innerText().catch(() => '');
  console.log(`   H1 atual         : "${preH1?.slice(0, 80)}" (estático, não mudará)`);
  console.log('');

  // ── 2. EDIÇÃO VIA API ADMIN ───────────────────────────────────────────────

  console.log('── Editando TopicPage via API admin ──');

  const putResp = await fetch(`${BASE}/api/admin/topics/${ORIG.id}`, {
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

  results.push(log('PUT /api/admin/topics/[id]',
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

  // a) /eventos/[slug] carrega (200)
  const catStatus = await getStatus(page, topicUrl);
  results.push(log(`a) /eventos/${ORIG.slug} retorna 200`,
    catStatus === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${catStatus}`));

  // d) Meta title
  const newTitleEl = await page.locator('head title').innerText().catch(() => '');
  const titleMatch = newTitleEl.includes('EDITADO TESTE5') || newTitleEl.includes('Growth Marketing 2026');
  results.push(log('d) <title> contém novo meta title',
    titleMatch ? 'PASSOU' : 'FALHOU',
    `<title>: "${newTitleEl.slice(0, 80)}"`));

  // d) Meta description
  const newMetaDesc = await page.locator('meta[name="description"]')
    .getAttribute('content').catch(() => '');
  const descMatch = (newMetaDesc ?? '').includes('EDITADO TESTE5')
    || (newMetaDesc ?? '').includes('Teste 5');
  results.push(log('d) <meta description> contém nova meta description',
    descMatch ? 'PASSOU' : 'FALHOU',
    `meta: "${(newMetaDesc ?? '').slice(0, 80)}"`));

  // H1 é estático (getTemaLabel)
  const newH1 = await page.locator('h1').first().innerText().catch(() => '');
  results.push(log(
    'd) H1 usa label estático (TOPIC_SLUG_TO_LABEL)',
    'AVISO',
    `h1: "${newH1.slice(0, 80)}" — não muda via TopicPage`));

  // b) Slug antigo retorna 404? (N/A — slug não mudou, logging como AVISO)
  results.push(log(
    'b) Slug antigo retorna 404 (N/A — slug estático, não alterado)',
    'AVISO',
    'TopicPage.slug tied to EVENT_TOPICS — routing estático, slug mantido'));

  // c) Sitemap contém /eventos/[slug] e combinações
  await page.goto(`${BASE}/sitemap.xml`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const sitemap = await page.content();

  const topicInSitemap = sitemap.includes(`/eventos/${ORIG.slug}</loc>`);
  results.push(log(`c) /eventos/${ORIG.slug} no sitemap`,
    topicInSitemap ? 'PASSOU' : 'FALHOU'));

  // Combinações tema × cidade
  const topicXCidade = sitemap.includes(`/eventos/${ORIG.slug}/sao-paulo</loc>`);
  results.push(log(`c) /eventos/${ORIG.slug}/sao-paulo no sitemap`,
    topicXCidade ? 'PASSOU' : 'FALHOU'));

  // Combinações tema × categoria
  const topicXCat = sitemap.includes(`/eventos/${ORIG.slug}/conferencias</loc>`);
  results.push(log(`c) /eventos/${ORIG.slug}/conferencias no sitemap`,
    topicXCat ? 'PASSOU' : 'FALHOU'));

  // Combinações tema × categoria × cidade
  const topicXCatXCidade = sitemap.includes(`/eventos/${ORIG.slug}/conferencias/sao-paulo</loc>`);
  results.push(log(`c) /eventos/${ORIG.slug}/conferencias/sao-paulo no sitemap`,
    topicXCatXCidade ? 'PASSOU' : 'FALHOU'));

  // e) Home page topic pills (N/A — usa EVENT_TOPICS estático)
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const homeTopicLink = await page.locator(`a[href="/eventos/${ORIG.slug}"]`).count() > 0;
  results.push(log(
    `e) Home page: link /eventos/${ORIG.slug}`,
    homeTopicLink ? 'PASSOU' : 'AVISO',
    homeTopicLink
      ? 'link encontrado na home'
      : 'ausente — home usa EVENT_TOPICS estático'));

  // Verifica que o label na home é estático (não usa TopicPage.title)
  const homeBodyText = await page.locator('body').innerText().catch(() => '');
  const homePillLabel = homeBodyText.includes('Growth') || homeBodyText.toLowerCase().includes('growth');
  results.push(log('e) Label na home "Growth" é estático',
    homePillLabel ? 'PASSOU' : 'FALHOU',
    'label vem de EVENT_TOPICS (estático)'));

  // f) Tags de tema na página individual de evento (N/A — usa TOPIC_SLUG_TO_LABEL)
  results.push(log(
    'f) Tags de tema em eventos individuais (N/A — TOPIC_SLUG_TO_LABEL)',
    'AVISO',
    'event page usa TOPIC_SLUG_TO_LABEL[topic] — não reflete TopicPage.title'));

  // k) Combinações de URL funcionam
  const combos = [
    `/eventos/${ORIG.slug}/sao-paulo`,
    `/eventos/${ORIG.slug}/conferencias`,
    `/eventos/${ORIG.slug}/conferencias/sao-paulo`,
    `/eventos/${ORIG.slug}/curitiba`,
  ];

  for (const path of combos) {
    const s = await getStatus(page, `${BASE}${path}`);
    results.push(log(`k) ${path} carrega (200)`,
      s === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${s}`));
  }

  // ── 4. REVERT ─────────────────────────────────────────────────────────────

  console.log('\n── Revertendo tema para valores originais ──');

  const revertResp = await fetch(`${BASE}/api/admin/topics/${ORIG.id}`, {
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
    await page.goto(topicUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const revertedTitle = await page.locator('head title').innerText().catch(() => '');
    const isReverted = !revertedTitle.includes('EDITADO TESTE5');
    results.push(log('Revert: meta title restaurado',
      isReverted ? 'PASSOU' : 'FALHOU',
      `<title>: "${revertedTitle.slice(0, 80)}"`));
  } else {
    results.push(log('Revert: PUT restauração', 'FALHOU',
      `HTTP ${revertResp.status} — ${JSON.stringify(revertBody)}`));
  }

  // ── 5. RESUMO ─────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' RESUMO DO TESTE 5');
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
