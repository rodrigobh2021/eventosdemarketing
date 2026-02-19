/**
 * TESTE 6 — CRIAÇÃO DE NOVA CIDADE + EVENTO MANUAL
 * Submete um evento em cidade inexistente (Contagem-MG), aprova via admin e
 * verifica que todas as URLs públicas e a CityPage são criadas corretamente.
 * Limpa o evento e a CityPage ao final.
 *
 * Execução: node tests/test6-nova-cidade-manual.js
 */

import { chromium } from '../node_modules/playwright/index.mjs';

const BASE = 'http://localhost:3000';

const EVENT_DATA = {
  title:          'Meetup de Marketing Digital Contagem',
  category:       'MEETUP',
  format:         'PRESENCIAL',
  topics:         ['growth', 'social-media'],
  start_date:     '2026-04-15',
  start_time:     '19:00',
  end_time:       '22:00',
  venue_name:     'Espaço Coworking Contagem',
  address:        'Rua Fictícia, 123 - Centro',
  city:           'Contagem',
  state:          'MG',
  is_free:        true,
  price_info:     null,
  ticket_url:     null,
  description:    'Meetup mensal de marketing digital em Contagem-MG. Troque experiências sobre growth hacking, mídia paga e social media com profissionais da região.',
  event_url:      'https://exemplo.com/meetup-contagem',
  image_url:      null,
  organizer_name: 'Comunidade Marketing Contagem',
  organizer_url:  null,
  source_url:     null,
  source:         'ORGANIZADOR',
  is_organizer:   false,
  organizer_email: null,
  submitter_email: null,
  is_verified:    false,
};

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

  let eventSlug  = null;
  let eventId    = null;
  let cityPageId = null;
  let submissionId = null;

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' TESTE 6 — CRIAÇÃO DE NOVA CIDADE + EVENTO MANUAL');
  console.log('════════════════════════════════════════════════════════\n');

  try {

    // ── 0. PRÉ-CONDIÇÃO: Contagem não deve ter CityPage nem eventos ────────

    console.log('── Pré-condições ──');

    const { pages: prePages } = await fetch(`${BASE}/api/admin/cities`).then(r => r.json());
    const existingContagem = prePages.find(p => p.slug === 'contagem');
    if (existingContagem) {
      console.log('⚠️  CityPage "contagem" já existe — será reutilizada');
      cityPageId = existingContagem.id;
    } else {
      console.log('   ✓ CityPage "contagem" não existe ainda');
    }

    const preStatusContagem = await getStatus(page, `${BASE}/eventos-marketing-contagem`);
    results.push(log('Pré: /eventos-marketing-contagem ainda não existe (404)',
      preStatusContagem === 404 ? 'PASSOU' : 'AVISO',
      `HTTP ${preStatusContagem}${preStatusContagem !== 404 ? ' — página já existe' : ''}`));

    console.log('');

    // ── 1. SUBMISSÃO DO EVENTO ─────────────────────────────────────────────

    console.log('── Submetendo evento via API ──');

    const submitResp = await fetch(`${BASE}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(EVENT_DATA),
    });
    const submitBody = await submitResp.json();

    results.push(log('POST /api/submissions',
      submitResp.status === 200 ? 'PASSOU' : 'FALHOU',
      `HTTP ${submitResp.status} — id: ${submitBody.id ?? JSON.stringify(submitBody).slice(0, 80)}`));

    if (submitResp.status !== 200) {
      console.log('\n❌ Submissão falhou. Abortando.');
      console.log(JSON.stringify(submitBody, null, 2));
      await browser.close(); process.exit(1);
    }

    submissionId = submitBody.id;
    console.log(`   ✓ Submissão criada: ${submissionId}`);

    // Verifica que aparece na aba Pendentes
    const { submissions } = await fetch(`${BASE}/api/admin/submissions`).then(r => r.json());
    const pending = (submissions ?? []).find(s => s.id === submissionId);
    results.push(log('Submissão aparece na aba Pendentes do admin',
      pending ? 'PASSOU' : 'FALHOU',
      pending ? `status: ${pending.status}, source: ${pending.source}` : 'não encontrada'));

    console.log('');

    // ── 2. APROVAÇÃO VIA ADMIN ────────────────────────────────────────────

    console.log('── Aprovando evento via admin ──');

    const approveResp = await fetch(`${BASE}/api/admin/submissions/${submissionId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_verified: false, notes: 'Aprovado pelo Teste 6' }),
    });
    const approveBody = await approveResp.json();

    results.push(log('POST /approve — evento publicado',
      approveResp.status === 200 ? 'PASSOU' : 'FALHOU',
      `HTTP ${approveResp.status} — slug: ${approveBody.slug ?? JSON.stringify(approveBody).slice(0, 80)}`));

    if (approveResp.status !== 200) {
      console.log('\n❌ Aprovação falhou. Abortando.');
      console.log(JSON.stringify(approveBody, null, 2));
      await browser.close(); process.exit(1);
    }

    eventSlug = approveBody.slug;
    console.log(`   ✓ Evento publicado: /evento/${eventSlug}`);

    await page.waitForTimeout(1500);
    console.log('');

    // ── 3. VERIFICAÇÕES PÓS-APROVAÇÃO ────────────────────────────────────

    console.log('── Verificações pós-aprovação ──');

    // 1. Evento aparece na aba Eventos do admin
    const { events: adminEvents } = await fetch(`${BASE}/api/admin/events`).then(r => r.json());
    const adminEvent = (adminEvents ?? []).find(e => e.slug === eventSlug);
    results.push(log('1) Evento na aba Eventos do admin',
      adminEvent ? 'PASSOU' : 'FALHOU',
      adminEvent ? `id: ${adminEvent.id}` : 'não encontrado'));
    if (adminEvent) eventId = adminEvent.id;

    // 2. CityPage "Contagem" criada automaticamente
    const { pages: afterPages } = await fetch(`${BASE}/api/admin/cities`).then(r => r.json());
    const contagemPage = afterPages.find(p => p.slug === 'contagem');
    results.push(log('2) CityPage "contagem" criada automaticamente no admin',
      contagemPage ? 'PASSOU' : 'FALHOU',
      contagemPage
        ? `id: ${contagemPage.id}, title: "${contagemPage.title}"`
        : 'CityPage não encontrada — approve route não a criou'));
    if (contagemPage) cityPageId = contagemPage.id;

    // 3. Evento publicado e acessível
    const eventStatus = await getStatus(page, `${BASE}/evento/${eventSlug}`);
    results.push(log(`3) /evento/${eventSlug} retorna 200`,
      eventStatus === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${eventStatus}`));

    // Sem selo de verificado
    const eventBody = await page.locator('body').innerText().catch(() => '');
    const hasVerifiedBadge = eventBody.toLowerCase().includes('verificado')
      && !eventBody.toLowerCase().includes('não verificado');
    results.push(log('9) Evento NÃO tem selo de verificado',
      !hasVerifiedBadge ? 'PASSOU' : 'FALHOU',
      'event is_verified=false'));

    // 4. JSON-LD correto
    const jsonLdRaw = await page.locator('script[type="application/ld+json"]').first()
      .innerText().catch(() => '');
    let jsonLdValid = false;
    let jsonLdData = null;
    try {
      const allScripts = await page.locator('script[type="application/ld+json"]').allInnerTexts();
      for (const raw of allScripts) {
        const ld = JSON.parse(raw);
        if (ld['@type'] === 'Event') { jsonLdData = ld; jsonLdValid = true; break; }
        if (Array.isArray(ld['@graph'])) {
          const ev = ld['@graph'].find(n => n['@type'] === 'Event');
          if (ev) { jsonLdData = ev; jsonLdValid = true; break; }
        }
      }
    } catch { /* ignore parse errors */ }
    results.push(log('4) JSON-LD @type=Event presente na página do evento',
      jsonLdValid ? 'PASSOU' : 'FALHOU',
      jsonLdValid ? `name: "${jsonLdData?.name?.slice(0, 50)}"` : 'não encontrado'));

    if (jsonLdData) {
      const cityInLd = JSON.stringify(jsonLdData).includes('Contagem');
      results.push(log('4) JSON-LD contém cidade "Contagem"',
        cityInLd ? 'PASSOU' : 'FALHOU'));
    }

    // 5. Landing page da cidade
    const cityPageStatus = await getStatus(page, `${BASE}/eventos-marketing-contagem`);
    results.push(log('5) /eventos-marketing-contagem retorna 200',
      cityPageStatus === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${cityPageStatus}`));

    if (cityPageStatus === 200) {
      const cityH1 = await page.locator('h1').first().innerText().catch(() => '');
      const cityMetaTitle = await page.locator('head title').innerText().catch(() => '');
      results.push(log('5) H1 da página de Contagem contém "Contagem"',
        cityH1.toLowerCase().includes('contagem') ? 'PASSOU' : 'FALHOU',
        `h1: "${cityH1.slice(0, 80)}"`));
      console.log(`   Meta title: "${cityMetaTitle}"`);
    }

    // 6. Páginas combinadas
    const combos = [
      `/eventos/growth/contagem`,
      `/eventos/social-media/contagem`,
      `/eventos/meetups/contagem`,
      `/eventos/growth/meetups/contagem`,
      `/eventos/social-media/meetups/contagem`,
    ];

    for (const path of combos) {
      const s = await getStatus(page, `${BASE}${path}`);
      results.push(log(`6) ${path} carrega (200)`,
        s === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${s}`));
    }

    // 7. Sitemap
    await page.goto(`${BASE}/sitemap.xml`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const sitemap = await page.content();

    const eventInSitemap = sitemap.includes(`/evento/${eventSlug}</loc>`);
    results.push(log(`7) /evento/${eventSlug} no sitemap`,
      eventInSitemap ? 'PASSOU' : 'FALHOU'));

    const cityInSitemap = sitemap.includes(`/eventos-marketing-contagem</loc>`);
    results.push(log('7) /eventos-marketing-contagem no sitemap',
      cityInSitemap ? 'PASSOU' : 'FALHOU'));

    const growthContagemInSitemap = sitemap.includes(`/eventos/growth/contagem</loc>`);
    results.push(log('7) /eventos/growth/contagem no sitemap',
      growthContagemInSitemap ? 'PASSOU' : 'FALHOU'));

    const meetupsContagemInSitemap = sitemap.includes(`/eventos/meetups/contagem</loc>`);
    results.push(log('7) /eventos/meetups/contagem no sitemap',
      meetupsContagemInSitemap ? 'PASSOU' : 'FALHOU'));

    // 8. Card do evento nas listagens
    await page.goto(`${BASE}/eventos-marketing-contagem`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const cardInCity = await page.locator(`a[href="/evento/${eventSlug}"]`).count() > 0;
    results.push(log('8) Card do evento em /eventos-marketing-contagem',
      cardInCity ? 'PASSOU' : 'FALHOU',
      cardInCity ? 'card encontrado' : 'card não encontrado'));

    await page.goto(`${BASE}/eventos/growth/contagem`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const cardInGrowthContagem = await page.locator(`a[href="/evento/${eventSlug}"]`).count() > 0;
    results.push(log('8) Card do evento em /eventos/growth/contagem',
      cardInGrowthContagem ? 'PASSOU' : 'AVISO',
      cardInGrowthContagem ? 'card encontrado' : 'card não encontrado na 1ª página'));

    // ── 4. LIMPEZA ────────────────────────────────────────────────────────

    console.log('\n── Limpando dados criados pelo teste ──');

    // Deleta o evento
    if (eventId) {
      const delEvt = await fetch(`${BASE}/api/admin/events/${eventId}`, { method: 'DELETE' });
      console.log(`   Evento deletado: HTTP ${delEvt.status}`);
    }

    // Deleta a CityPage de Contagem (se foi criada pelo teste)
    if (cityPageId && !existingContagem) {
      const delCity = await fetch(`${BASE}/api/admin/cities/${cityPageId}`, { method: 'DELETE' });
      console.log(`   CityPage deletada: HTTP ${delCity.status}`);
    }

    // Verifica que evento foi removido
    await page.waitForTimeout(1000);
    const cleanStatus = await getStatus(page, `${BASE}/evento/${eventSlug}`);
    results.push(log('Limpeza: /evento/[slug] retorna 404',
      cleanStatus === 404 ? 'PASSOU' : 'FALHOU', `HTTP ${cleanStatus}`));

  } catch (err) {
    console.error('\n💥 Erro inesperado:', err.message);
    results.push(log('Erro inesperado no teste', 'FALHOU', err.message));
  }

  // ── 5. RESUMO ─────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' RESUMO DO TESTE 6');
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
    console.log('── Avisos ──');
    results.filter(r => r.status === 'AVISO').forEach(r => {
      console.log(`   ⚠️  ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
    });
    console.log('');
  }

  console.log('════════════════════════════════════════════════════════\n');

  await browser.close();
  process.exit(falhou > 0 ? 1 : 0);
})();
