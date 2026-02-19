/**
 * TESTE 11 — PROTEÇÃO DO ADMIN
 * Verifica rotas sensíveis:
 * - /admin exibe lembrete de "Sem autenticação"
 * - /api/admin/* são acessíveis (sem auth por enquanto)
 * - Registra pendência de auth para Fase 4
 *
 * Execução: node tests/test11-protecao-admin.js
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
  console.log(' TESTE 11 — PROTEÇÃO DO ADMIN');
  console.log('════════════════════════════════════════════════════════\n');

  // 1. /admin carrega e exibe badge "Sem autenticação"
  const resp = await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  results.push(log('1) /admin carrega (200)',
    resp?.status() === 200 ? 'PASSOU' : 'FALHOU', `HTTP ${resp?.status()}`));

  const bodyText = await page.locator('body').innerText().catch(() => '');
  const hasNoAuthBadge = bodyText.toLowerCase().includes('sem autenticação')
    || bodyText.toLowerCase().includes('sem autenticacao')
    || bodyText.toLowerCase().includes('without auth')
    || bodyText.toLowerCase().includes('no auth');

  results.push(log('1) /admin exibe badge "Sem autenticação"',
    hasNoAuthBadge ? 'PASSOU' : 'AVISO',
    hasNoAuthBadge ? 'badge encontrado' : 'badge não encontrado — verificar texto da página'));

  // Log do texto encontrado relacionado a auth
  const authMentions = bodyText.split('\n').filter(l =>
    l.toLowerCase().includes('auth') || l.toLowerCase().includes('acesso') || l.toLowerCase().includes('fase')
  ).slice(0, 3);
  if (authMentions.length > 0) {
    console.log(`   Textos relacionados a auth na página:`);
    authMentions.forEach(l => console.log(`     "${l.trim().slice(0, 80)}"`));
  }

  // 2. API routes de admin são acessíveis (GET retornam 200)
  const adminApis = [
    '/api/admin/events',
    '/api/admin/submissions',
    '/api/admin/categories',
    '/api/admin/cities',
    '/api/admin/topics',
  ];

  for (const apiPath of adminApis) {
    const r = await fetch(`${BASE}${apiPath}`);
    results.push(log(`2) ${apiPath} acessível (200)`,
      r.status === 200 ? 'PASSOU' : 'FALHOU',
      `HTTP ${r.status}`));
  }

  // 3. Registra pendência de autenticação (Fase 4)
  results.push(log(
    '3) PENDÊNCIA: /admin e /api/admin/* precisam de auth (Fase 4)',
    'AVISO',
    'Implementar autenticação JWT/session antes do deploy em produção'));

  // 4. Verifica que /admin não está exposto sem proteção
  // (isso é um AVISO pois é design atual — sem auth implementada)
  results.push(log(
    '4) /admin acessível sem autenticação (design atual — Fase 4 pendente)',
    'AVISO',
    'Deploy em produção requer autenticação'));

  // ── RESUMO ────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════════');
  console.log(' RESUMO DO TESTE 11');
  console.log('════════════════════════════════════════════════════════');

  const passou = results.filter(r => r.status === 'PASSOU').length;
  const falhou = results.filter(r => r.status === 'FALHOU').length;
  const aviso  = results.filter(r => r.status === 'AVISO').length;

  console.log(`\n   ✅ Passou : ${passou}`);
  console.log(`   ❌ Falhou : ${falhou}`);
  console.log(`   ⚠️  Aviso  : ${aviso}`);
  console.log('');

  if (aviso > 0) {
    console.log('── Avisos (pendências) ──');
    results.filter(r => r.status === 'AVISO').forEach(r => {
      console.log(`   ⚠️  ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
    });
    console.log('');
  }

  console.log('════════════════════════════════════════════════════════\n');

  await browser.close();
  process.exit(falhou > 0 ? 1 : 0);
})();
