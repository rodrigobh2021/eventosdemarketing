/**
 * Seed desativado — o catálogo é populado via agente de scraping e formulário de cadastro.
 *
 * Para popular o banco em desenvolvimento, use:
 *   - /cadastrar-evento  → formulário de submissão manual
 *   - /admin            → agente de scraping (aba "Importar via URL")
 *
 * Histórico: os dados fictícios de seed foram removidos em 2026-02-18
 * após a conclusão dos testes do painel admin (testes 1-11).
 */

import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seed desativado — nenhuma ação executada.');
  console.log('Popule o banco via /cadastrar-evento ou pelo agente de scraping no /admin.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
