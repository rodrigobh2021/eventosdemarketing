/**
 * TESTE 1 — EXCLUSÃO DE EVENTO
 * Verifica que a exclusão de um evento no admin remove corretamente
 * o evento de todas as páginas públicas, sitemap e eventos relacionados.
 */

import { chromium } from '../node_modules/playwright/index.mjs';

const BASE = 'http://localhost:3000';

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(label, status, detail = '') {
  const icon = status === 'PASSOU' ? '✅' : status === 'FALHOU' ? '❌' : '⚠️';
  const line = `${icon} ${status.padEnd(7)} | ${label}${detail ? ` — ${detail}` : ''}`;
  console.log(line);
  return { label, status, detail };
}

async function httpStatus(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  return response ? response.status() : 0;
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const results = [];

  // ── 0. Abrir admin e coletar dados do evento a excluir ─────────────────────

  console.log('\n════════════════════════════════════════════');
  console.log(' TESTE 1 — EXCLUSÃO DE EVENTO');
  console.log('════════════════════════════════════════════\n');

  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 20000 });

  // Aguarda a aba "Eventos" estar visível e clica nela
  const tabEventos = page.getByRole('button', { name: 'Eventos' });
  if (await tabEventos.isVisible()) {
    await tabEventos.click();
  }
  await page.waitForTimeout(1500);

  // Coleta o primeiro evento listado
  const firstEventCard = page.locator('[data-testid="event-card"], .event-card').first();

  // Como o admin não usa data-testid, vamos buscar o título do primeiro item
  // O admin renderiza cards com títulos como links ou p tags
  let eventSlug = null;
  let eventTitle = null;
  let eventCity = null;
  let eventCategory = null;
  let eventTopics = [];

  // Tenta via API diretamente para obter dados concretos
  const apiResp = await page.evaluate(async (base) => {
    const r = await fetch(`${base}/api/admin/events`);
    return r.json();
  }, BASE);

  const events = apiResp.events || [];
  if (events.length === 0) {
    console.log('❌ FALHOU  | Nenhum evento encontrado no admin. Abortando teste.');
    await browser.close();
    process.exit(1);
  }

  // Usar o último evento da lista (menos relacionamentos, menos impacto)
  const targetEvent = events[events.length - 1];
  // Mapeamento de categoria DB → slug de URL (conforme CATEGORY_SINGULAR_TO_SLUG)
  const CAT_TO_SLUG = {
    CONFERENCIA: 'conferencias', WORKSHOP: 'workshops', MEETUP: 'meetups',
    WEBINAR: 'webinars', CURSO: 'cursos', PALESTRA: 'palestras', HACKATHON: 'hackathons',
  };
  // Mapeamento de nome de cidade → slug (conforme CITY_NAME_TO_SLUG)
  const CITY_TO_SLUG = {
    'São Paulo': 'sao-paulo', 'Rio de Janeiro': 'rio-de-janeiro',
    'Belo Horizonte': 'belo-horizonte', 'Curitiba': 'curitiba',
    'Porto Alegre': 'porto-alegre', 'Brasília': 'brasilia',
    'Recife': 'recife', 'Florianópolis': 'florianopolis',
    'Salvador': 'salvador', 'Fortaleza': 'fortaleza',
    'Goiânia': 'goiania', 'Campinas': 'campinas',
  };

  eventSlug = targetEvent.slug;
  eventTitle = targetEvent.title;
  // Usa mapeamento oficial ou fallback com slugify
  eventCity = CITY_TO_SLUG[targetEvent.city]
    || (targetEvent.city || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  eventCategory = CAT_TO_SLUG[targetEvent.category]
    || (targetEvent.category || '').toLowerCase().replace(/_/g, '-');
  eventTopics = targetEvent.topics || [];

  console.log(`📋 Evento selecionado para exclusão:`);
  console.log(`   Título   : ${eventTitle}`);
  console.log(`   Slug     : ${eventSlug}`);
  console.log(`   Cidade   : ${targetEvent.city} (slug: ${eventCity})`);
  console.log(`   Categoria: ${targetEvent.category} (slug: ${eventCategory})`);
  console.log(`   Temas    : ${eventTopics.join(', ')}`);
  console.log(`   ID       : ${targetEvent.id}`);
  console.log('');

  // ── 1. PRÉ-VERIFICAÇÃO: confirma que o evento existe antes de excluir ──────

  console.log('── Pré-verificações ──');

  const preStatus = await httpStatus(page, `${BASE}/evento/${eventSlug}`);
  if (preStatus === 200) {
    results.push(log('Pré: /evento/[slug] existe (200)', 'PASSOU', `status ${preStatus}`));
  } else {
    results.push(log('Pré: /evento/[slug] existe', 'FALHOU', `status ${preStatus} — esperado 200`));
  }

  // Verifica /eventos
  await page.goto(`${BASE}/eventos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const preInEventos = await page.locator(`a[href="/evento/${eventSlug}"]`).count() > 0
    || await page.getByText(eventTitle, { exact: false }).count() > 0;

  results.push(log(
    `Pré: evento visível em /eventos`,
    preInEventos ? 'PASSOU' : 'AVISO',
    preInEventos ? 'card encontrado' : 'card não encontrado na listagem (pode não estar na 1ª página)'
  ));

  console.log('');

  // ── 2. EXCLUIR O EVENTO VIA ADMIN ─────────────────────────────────────────

  console.log('── Excluindo evento via admin ──');

  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.getByRole('button', { name: 'Eventos' }).click();
  await page.waitForTimeout(1000);

  // Encontra o botão Excluir do evento alvo
  // No admin, cada card tem um botão Excluir próximo ao título do evento
  // Busca pelo texto do evento e depois encontra o botão Excluir no mesmo card
  const eventCards = page.locator('.bg-white.rounded-xl');
  const count = await eventCards.count();
  let deleteButton = null;

  for (let i = 0; i < count; i++) {
    const card = eventCards.nth(i);
    const titleEl = card.getByText(eventTitle, { exact: false });
    if (await titleEl.count() > 0) {
      deleteButton = card.getByRole('button', { name: /excluir/i });
      if (await deleteButton.count() > 0) break;
    }
  }

  if (!deleteButton || await deleteButton.count() === 0) {
    // Fallback: clica via API
    console.log('   ⚠️  Botão Excluir não encontrado na UI, usando API diretamente...');
    const delResp = await page.evaluate(async ({ base, id }) => {
      const r = await fetch(`${base}/api/admin/events/${id}`, { method: 'DELETE' });
      return { status: r.status, body: await r.json() };
    }, { base: BASE, id: targetEvent.id });
    console.log(`   API DELETE status: ${delResp.status}`, delResp.body);
    if (delResp.status === 200) {
      results.push(log('Exclusão via API admin', 'PASSOU', `status ${delResp.status}`));
    } else {
      results.push(log('Exclusão via API admin', 'FALHOU', `status ${delResp.status}`));
      await browser.close();
      process.exit(1);
    }
  } else {
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Modal de confirmação
    const confirmBtn = page.getByRole('button', { name: /confirmar exclus/i });
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
      results.push(log('Exclusão pelo botão no admin', 'PASSOU', 'modal confirmado'));
    } else {
      results.push(log('Exclusão pelo botão no admin', 'FALHOU', 'botão de confirmação não apareceu'));
    }
  }

  // Aguarda propagação / revalidação
  await page.waitForTimeout(2000);

  console.log('');

  // ── 3. VERIFICAÇÕES PÓS-EXCLUSÃO ──────────────────────────────────────────

  console.log('── Verificações pós-exclusão ──');

  // a) Aba Eventos do admin não mostra o evento
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.getByRole('button', { name: 'Eventos' }).click();
  await page.waitForTimeout(1500);

  const afterAdminEvents = await page.evaluate(async (base) => {
    const r = await fetch(`${base}/api/admin/events`);
    return r.json();
  }, BASE);
  const stillInAdmin = (afterAdminEvents.events || []).some(e => e.slug === eventSlug);

  results.push(log(
    'a) Evento removido da aba Eventos do admin',
    stillInAdmin ? 'FALHOU' : 'PASSOU',
    stillInAdmin ? 'ainda aparece no admin' : 'não encontrado no admin'
  ));

  // b) /eventos não mostra card do evento
  await page.goto(`${BASE}/eventos`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1000);
  const inEventos = await page.locator(`a[href="/evento/${eventSlug}"]`).count() > 0;
  results.push(log(
    'b) Card do evento ausente em /eventos',
    inEventos ? 'FALHOU' : 'PASSOU',
    inEventos ? 'card ainda aparece' : 'card não encontrado'
  ));

  // c) Página de cidade não mostra o evento
  const citySlug = `eventos-marketing-${eventCity}`;
  await page.goto(`${BASE}/${citySlug}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const statusCity = await page.evaluate(() => document.title);
  const inCity = await page.locator(`a[href="/evento/${eventSlug}"]`).count() > 0;
  results.push(log(
    `c) Card ausente em /${citySlug}`,
    inCity ? 'FALHOU' : 'PASSOU',
    inCity ? 'evento ainda aparece na página de cidade' : 'evento não encontrado na cidade'
  ));

  // d) Páginas de tema não mostram o evento
  for (const topic of eventTopics.slice(0, 2)) { // testa até 2 temas
    const topicPath = `/eventos/${topic}`;
    await page.goto(`${BASE}${topicPath}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const inTopic = await page.locator(`a[href="/evento/${eventSlug}"]`).count() > 0;
    results.push(log(
      `d) Card ausente em /eventos/${topic}`,
      inTopic ? 'FALHOU' : 'PASSOU',
      inTopic ? 'evento ainda aparece no tema' : 'evento não encontrado no tema'
    ));
  }

  if (eventTopics.length === 0) {
    results.push(log('d) Páginas de tema', 'AVISO', 'evento não tinha temas associados'));
  }

  // e) Página de categoria não mostra o evento
  const catPath = `/eventos/${eventCategory}`;
  await page.goto(`${BASE}${catPath}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const inCat = await page.locator(`a[href="/evento/${eventSlug}"]`).count() > 0;
  results.push(log(
    `e) Card ausente em /eventos/${eventCategory}`,
    inCat ? 'FALHOU' : 'PASSOU',
    inCat ? 'evento ainda aparece na categoria' : 'evento não encontrado na categoria'
  ));

  // f) /evento/[slug] retorna 404
  const slugStatus = await httpStatus(page, `${BASE}/evento/${eventSlug}`);
  results.push(log(
    `f) /evento/${eventSlug} retorna 404`,
    slugStatus === 404 ? 'PASSOU' : 'FALHOU',
    `status HTTP: ${slugStatus}`
  ));

  // g) /sitemap.xml não contém a URL do evento
  await page.goto(`${BASE}/sitemap.xml`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const sitemapContent = await page.content();
  const urlInSitemap = sitemapContent.includes(`/evento/${eventSlug}`);
  results.push(log(
    `g) /evento/${eventSlug} ausente no sitemap`,
    urlInSitemap ? 'FALHOU' : 'PASSOU',
    urlInSitemap ? 'URL ainda presente no sitemap.xml' : 'URL não encontrada no sitemap'
  ));

  // h) Eventos relacionados em outros eventos não mostram o excluído
  // Pega outro evento qualquer para verificar
  const otherEvents = (afterAdminEvents.events || []).filter(e => e.slug !== eventSlug).slice(0, 3);
  let relatedCheckPassed = true;
  let relatedChecked = 0;

  for (const other of otherEvents) {
    await page.goto(`${BASE}/evento/${other.slug}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const deletedInRelated = await page.locator(`a[href="/evento/${eventSlug}"]`).count() > 0;
    if (deletedInRelated) {
      relatedCheckPassed = false;
      results.push(log(
        `h) Removido de "Eventos Relacionados" em /evento/${other.slug}`,
        'FALHOU',
        'evento excluído ainda aparece como relacionado'
      ));
    }
    relatedChecked++;
  }

  if (relatedCheckPassed) {
    results.push(log(
      `h) Ausente em Eventos Relacionados (verificado em ${relatedChecked} evento(s))`,
      'PASSOU',
      'evento excluído não aparece como relacionado'
    ));
  }

  // ── 4. RESUMO ─────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════');
  console.log(' RESUMO DO TESTE 1');
  console.log('════════════════════════════════════════════');

  const passou = results.filter(r => r.status === 'PASSOU').length;
  const falhou = results.filter(r => r.status === 'FALHOU').length;
  const aviso = results.filter(r => r.status === 'AVISO').length;

  console.log(`\n   ✅ Passou : ${passou}`);
  console.log(`   ❌ Falhou : ${falhou}`);
  console.log(`   ⚠️  Aviso  : ${aviso}`);
  console.log('');

  if (falhou > 0) {
    console.log('Itens com falha:');
    results.filter(r => r.status === 'FALHOU').forEach(r => {
      console.log(`  ❌ ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
    });
  }

  console.log('\n════════════════════════════════════════════\n');

  await browser.close();
  process.exit(falhou > 0 ? 1 : 0);
})();
