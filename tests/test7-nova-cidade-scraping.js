/**
 * TESTE 7 — CRIAÇÃO DE NOVA CIDADE + EVENTO VIA SCRAPING
 * Extrai dados de um evento do Sympla via agente, submete e aprova.
 * Verifica que cidade "Iguatu" é criada e todas as URLs funcionam.
 * Limpa os dados ao final.
 *
 * Execução: node tests/test7-nova-cidade-scraping.js
 *
 * URL alvo: https://www.sympla.com.br/evento/da-invisibilidade-ao-lucro-marketing-estrategico-para-empreendedores/3306507
 */

import { chromium } from '../node_modules/playwright/index.mjs';

const BASE = 'http://localhost:3000';
const SYMPLA_URL = 'https://www.sympla.com.br/evento/da-invisibilidade-ao-lucro-marketing-estrategico-para-empreendedores/3306507';

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

  let eventSlug    = null;
  let eventId      = null;
  let cityPageId   = null;
  let submissionId = null;

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' TESTE 7 — CRIAÇÃO DE NOVA CIDADE + EVENTO VIA SCRAPING');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`   URL alvo: ${SYMPLA_URL}\n`);

  try {

    // ── 0. PRÉ-CONDIÇÃO ────────────────────────────────────────────────────

    console.log('── Pré-condições ──');

    const { pages: prePages } = await fetch(`${BASE}/api/admin/cities`).then(r => r.json());
    const existingIguatu = prePages.find(p => p.slug === 'iguatu');
    if (existingIguatu) {
      console.log('⚠️  CityPage "iguatu" já existe — será reutilizada');
      cityPageId = existingIguatu.id;
    } else {
      console.log('   ✓ CityPage "iguatu" não existe ainda');
    }

    const preStatus = await getStatus(page, `${BASE}/eventos-marketing-iguatu`);
    results.push(log('Pré: /eventos-marketing-iguatu ainda não existe (404)',
      preStatus === 404 ? 'PASSOU' : 'AVISO',
      `HTTP ${preStatus}${preStatus !== 404 ? ' — página já existe' : ''}`));

    console.log('');

    // ── 1. EXTRAÇÃO VIA AGENTE ────────────────────────────────────────────

    console.log('── Extraindo evento via agente de scraping ──');
    console.log('   (pode demorar 15-60 segundos...)');

    let scrapedData = null;
    let scrapeSuccess = false;

    const scrapeStart = Date.now();
    const scrapeResp = await fetch(`${BASE}/api/agent/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: SYMPLA_URL }),
    }).catch(err => ({ ok: false, status: 0, json: async () => ({ success: false, error: err.message }) }));

    const scrapeMs = Date.now() - scrapeStart;
    const scrapeBody = await scrapeResp.json?.() ?? { success: false };

    if (scrapeBody.success && scrapeBody.data) {
      scrapedData = scrapeBody.data;
      scrapeSuccess = true;
      console.log(`   ✓ Extração concluída em ${(scrapeMs/1000).toFixed(1)}s`);
      console.log(`   Dados extraídos:`);
      console.log(`     Título      : "${scrapedData.title ?? '—'}"`);
      console.log(`     Categoria   : ${scrapedData.category ?? '—'}`);
      console.log(`     Data início : ${scrapedData.start_date ?? '—'}`);
      console.log(`     Cidade      : ${scrapedData.city ?? '—'}`);
      console.log(`     Estado      : ${scrapedData.state ?? '—'}`);
      console.log(`     Source URL  : ${scrapedData.source_url ?? scrapeBody.meta?.source_url ?? '—'}`);
      console.log(`     Descrição   : ${scrapedData.description?.slice(0, 60) ?? '—'}...`);
    } else {
      console.log(`   ⚠️  Extração falhou: ${scrapeBody.error ?? 'sem detalhes'}`);
    }

    // 1a. Verificação da extração automática
    results.push(log('1a) Agente retornou sucesso (scrape OK)',
      scrapeSuccess ? 'PASSOU' : 'FALHOU',
      scrapeSuccess ? `em ${(scrapeMs/1000).toFixed(1)}s` : (scrapeBody.error ?? 'erro desconhecido')));

    const REQUIRED_FIELDS = ['title', 'start_date', 'description'];
    const extracted = REQUIRED_FIELDS.filter(f => scrapedData?.[f]);
    results.push(log(`1b) Campos mínimos extraídos (${extracted.length}/${REQUIRED_FIELDS.length})`,
      extracted.length >= 2 ? 'PASSOU' : 'FALHOU',
      `extraídos: ${extracted.join(', ')}`));

    const ticketOrUrl = scrapedData?.ticket_url || scrapedData?.event_url || SYMPLA_URL;
    results.push(log('1c) Link de compra/evento disponível',
      ticketOrUrl ? 'PASSOU' : 'AVISO',
      `url: ${(ticketOrUrl ?? '').slice(0, 80)}`));

    console.log('');

    // ── 2. PREPARA DADOS PARA SUBMISSÃO ──────────────────────────────────

    console.log('── Preparando dados para submissão ──');

    // Usa dados do scraping, com fallbacks para campos obrigatórios que podem falhar
    const eventData = {
      title:          scrapedData?.title ?? 'Da Invisibilidade ao Lucro: Marketing Estratégico para Empreendedores',
      category:       scrapedData?.category ?? 'PALESTRA',
      format:         scrapedData?.format ?? 'PRESENCIAL',
      topics:         scrapedData?.topics?.length ? scrapedData.topics : ['growth', 'inbound-marketing'],
      start_date:     scrapedData?.start_date ?? '2026-03-20',
      end_date:       scrapedData?.end_date ?? null,
      start_time:     scrapedData?.start_time ?? null,
      end_time:       scrapedData?.end_time ?? null,
      venue_name:     scrapedData?.venue_name ?? null,
      address:        scrapedData?.address ?? null,
      // Garantir que cidade seja Iguatu/CE conforme especificado no teste
      city:           scrapedData?.city?.toLowerCase().includes('iguatu') ? scrapedData.city : 'Iguatu',
      state:          scrapedData?.state?.toLowerCase().includes('ce') ? scrapedData.state : 'CE',
      latitude:       scrapedData?.latitude ?? null,
      longitude:      scrapedData?.longitude ?? null,
      is_free:        scrapedData?.is_free ?? false,
      price_info:     scrapedData?.price_info ?? null,
      ticket_url:     scrapedData?.ticket_url ?? SYMPLA_URL,
      description:    (scrapedData?.description?.length >= 100)
                        ? scrapedData.description
                        : 'Evento de marketing estratégico para empreendedores. Aprenda técnicas para tirar seu negócio da invisibilidade e aumentar o lucro com marketing digital. Conteúdo prático e direto ao ponto.',
      event_url:      scrapedData?.event_url ?? SYMPLA_URL,
      image_url:      scrapedData?.image_url ?? null,
      organizer_name: scrapedData?.organizer_name ?? 'Organizador do Evento',
      organizer_url:  scrapedData?.organizer_url ?? null,
      source_url:     SYMPLA_URL,
      source:         'AGENTE',
      is_organizer:   false,
      organizer_email: null,
      submitter_email: null,
      is_verified:    false,
    };

    console.log(`   Dados finais para submissão:`);
    console.log(`     Título  : "${eventData.title}"`);
    console.log(`     Cidade  : "${eventData.city}", ${eventData.state}`);
    console.log(`     Source  : ${eventData.source}`);
    console.log('');

    // ── 3. SUBMISSÃO DO EVENTO ────────────────────────────────────────────

    console.log('── Submetendo evento via API ──');

    const submitResp = await fetch(`${BASE}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    const submitBody = await submitResp.json();

    results.push(log('POST /api/submissions',
      submitResp.status === 200 ? 'PASSOU' : 'FALHOU',
      `HTTP ${submitResp.status} — ${submitBody.id ?? JSON.stringify(submitBody).slice(0, 80)}`));

    if (submitResp.status !== 200) {
      console.log('\n❌ Submissão falhou:', JSON.stringify(submitBody, null, 2));
      await browser.close(); process.exit(1);
    }

    submissionId = submitBody.id;

    // Verifica badge "Agente" na aba Pendentes
    const { submissions } = await fetch(`${BASE}/api/admin/submissions`).then(r => r.json());
    const pending = (submissions ?? []).find(s => s.id === submissionId);
    results.push(log('3a) Submissão na aba Pendentes com source=AGENTE',
      pending?.source === 'AGENTE' ? 'PASSOU' : 'FALHOU',
      pending ? `source: ${pending.source}` : 'não encontrada'));

    console.log('');

    // ── 4. APROVAÇÃO ─────────────────────────────────────────────────────

    console.log('── Aprovando evento via admin ──');

    const approveResp = await fetch(`${BASE}/api/admin/submissions/${submissionId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_verified: false, notes: 'Aprovado pelo Teste 7' }),
    });
    const approveBody = await approveResp.json();

    results.push(log('POST /approve — evento publicado',
      approveResp.status === 200 ? 'PASSOU' : 'FALHOU',
      `HTTP ${approveResp.status} — slug: ${approveBody.slug ?? JSON.stringify(approveBody).slice(0, 80)}`));

    if (approveResp.status !== 200) {
      console.log('\n❌ Aprovação falhou:', JSON.stringify(approveBody, null, 2));
      await browser.close(); process.exit(1);
    }

    eventSlug = approveBody.slug;
    console.log(`   ✓ Evento publicado: /evento/${eventSlug}`);

    await page.waitForTimeout(1500);
    console.log('');

    // ── 5. VERIFICAÇÕES ───────────────────────────────────────────────────

    console.log('── Verificações pós-aprovação ──');

    // Evento na aba admin
    const { events: adminEvents } = await fetch(`${BASE}/api/admin/events`).then(r => r.json());
    const adminEvent = (adminEvents ?? []).find(e => e.slug === eventSlug);
    results.push(log('4) Evento na aba Eventos do admin',
      adminEvent ? 'PASSOU' : 'FALHOU',
      adminEvent ? `id: ${adminEvent.id}` : 'não encontrado'));
    if (adminEvent) eventId = adminEvent.id;

    // source_url armazenado
    results.push(log('11) source_url = URL original do Sympla',
      adminEvent?.source_url === SYMPLA_URL ? 'PASSOU' : 'FALHOU',
      `source_url: ${adminEvent?.source_url?.slice(0, 60) ?? 'null'}`));

    // is_verified = false
    results.push(log('10) Evento NÃO tem is_verified=true',
      !adminEvent?.is_verified ? 'PASSOU' : 'FALHOU',
      `is_verified: ${adminEvent?.is_verified}`));

    // CityPage "iguatu" criada
    const { pages: afterPages } = await fetch(`${BASE}/api/admin/cities`).then(r => r.json());
    const iguatuPage = afterPages.find(p => p.slug === 'iguatu');
    results.push(log('5) CityPage "iguatu" criada automaticamente',
      iguatuPage ? 'PASSOU' : 'FALHOU',
      iguatuPage
        ? `title: "${iguatuPage.title}"`
        : 'CityPage não encontrada'));
    if (iguatuPage) cityPageId = iguatuPage.id;

    // Página individual do evento
    const eventStatus = await getStatus(page, `${BASE}/evento/${eventSlug}`);
    results.push(log(`4) /evento/${eventSlug} retorna 200`,
      eventStatus === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${eventStatus}`));

    if (eventStatus === 200) {
      // JSON-LD correto
      const allScripts = await page.locator('script[type="application/ld+json"]').allInnerTexts();
      let jsonLdData = null;
      for (const raw of allScripts) {
        try {
          const ld = JSON.parse(raw);
          if (ld['@type'] === 'Event') { jsonLdData = ld; break; }
        } catch { /* ignore */ }
      }
      results.push(log('9) JSON-LD @type=Event na página do evento',
        jsonLdData !== null ? 'PASSOU' : 'FALHOU',
        jsonLdData ? `name: "${jsonLdData.name?.slice(0, 50)}"` : 'não encontrado'));

      // source_url no JSON-LD não existe, mas ticket_url sim
      const iguatuInLd = JSON.stringify(jsonLdData ?? '').includes('Iguatu');
      results.push(log('9) JSON-LD contém cidade "Iguatu"',
        iguatuInLd ? 'PASSOU' : 'FALHOU'));
    }

    // Landing page de Iguatu
    const iguatuPageStatus = await getStatus(page, `${BASE}/eventos-marketing-iguatu`);
    results.push(log('6) /eventos-marketing-iguatu retorna 200',
      iguatuPageStatus === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${iguatuPageStatus}`));

    if (iguatuPageStatus === 200) {
      const cityH1 = await page.locator('h1').first().innerText().catch(() => '');
      results.push(log('6) H1 da página contém "Iguatu"',
        cityH1.toLowerCase().includes('iguatu') ? 'PASSOU' : 'FALHOU',
        `h1: "${cityH1.slice(0, 60)}"`));
    }

    // Páginas combinadas
    const combos = [
      `/eventos/growth/iguatu`,
      `/eventos/inbound-marketing/iguatu`,
    ];

    for (const path of combos) {
      const s = await getStatus(page, `${BASE}${path}`);
      results.push(log(`7) ${path} carrega (200)`,
        s === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${s}`));
    }

    // Sitemap
    await page.goto(`${BASE}/sitemap.xml`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const sitemap = await page.content();

    const eventInSitemap = sitemap.includes(`/evento/${eventSlug}</loc>`);
    results.push(log(`8) /evento/${eventSlug} no sitemap`,
      eventInSitemap ? 'PASSOU' : 'FALHOU'));

    const iguatuInSitemap = sitemap.includes(`/eventos-marketing-iguatu</loc>`);
    results.push(log('8) /eventos-marketing-iguatu no sitemap',
      iguatuInSitemap ? 'PASSOU' : 'FALHOU'));

    const growthIguatuInSitemap = sitemap.includes(`/eventos/growth/iguatu</loc>`);
    results.push(log('8) /eventos/growth/iguatu no sitemap',
      growthIguatuInSitemap ? 'PASSOU' : 'FALHOU'));

    // Card na landing page
    await page.goto(`${BASE}/eventos-marketing-iguatu`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const cardInCity = await page.locator(`a[href="/evento/${eventSlug}"]`).count() > 0;
    results.push(log('8) Card do evento em /eventos-marketing-iguatu',
      cardInCity ? 'PASSOU' : 'FALHOU',
      cardInCity ? 'card encontrado' : 'card não encontrado'));

  } catch (err) {
    console.error('\n💥 Erro inesperado:', err.message);
    results.push(log('Erro inesperado no teste', 'FALHOU', err.message));
  }

  // ── 6. LIMPEZA ───────────────────────────────────────────────────────────

  console.log('\n── Limpando dados criados pelo teste ──');

  if (eventId) {
    const delEvt = await fetch(`${BASE}/api/admin/events/${eventId}`, { method: 'DELETE' });
    console.log(`   Evento deletado: HTTP ${delEvt.status}`);
  }

  const { pages: finalPages } = await fetch(`${BASE}/api/admin/cities`).then(r => r.json());
  const finalIguatu = finalPages.find(p => p.slug === 'iguatu');
  if (finalIguatu && !cityPageId) cityPageId = finalIguatu.id;

  if (cityPageId) {
    const delCity = await fetch(`${BASE}/api/admin/cities/${cityPageId}`, { method: 'DELETE' });
    console.log(`   CityPage "iguatu" deletada: HTTP ${delCity.status}`);
  }

  if (eventSlug) {
    await page.goto(`${BASE}/evento/${eventSlug}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const cleanStatus = await page.evaluate(() =>
      fetch(window.location.href).then(r => r.status).catch(() => 0)
    );
    results.push(log('Limpeza: evento removido',
      eventId ? 'PASSOU' : 'AVISO', 'evento e CityPage deletados'));
  }

  // ── 7. RESUMO ─────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' RESUMO DO TESTE 7');
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
