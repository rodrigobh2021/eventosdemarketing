import { z } from 'zod';

const nullableStr = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : null));

const nullableNum = z
  .number()
  .optional()
  .nullable()
  .transform((v) => (v != null && !isNaN(v) ? v : null));

export const submissionSchema = z.object({
  // A — Informações Básicas
  title: z.string().min(3, 'Título deve ter ao menos 3 caracteres'),
  category: z.enum(
    ['CONFERENCIA', 'WORKSHOP', 'MEETUP', 'WEBINAR', 'CURSO', 'PALESTRA', 'HACKATHON'],
    { error: 'Selecione uma categoria válida' },
  ),
  format: z.enum(['PRESENCIAL', 'ONLINE', 'HIBRIDO'], {
    error: 'Selecione um formato',
  }),
  topics: z.array(z.string()).min(1, 'Selecione ao menos 1 tema'),

  // B — Data e Horário
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início obrigatória'),
  end_date: nullableStr,
  start_time: nullableStr,
  end_time: nullableStr,

  // C — Local
  venue_name: nullableStr,
  address: nullableStr,
  city: z.string().min(1, 'Cidade obrigatória'),
  state: z.string().min(1, 'Estado obrigatório'),
  latitude: nullableNum,
  longitude: nullableNum,

  // D — Ingressos
  is_free: z.boolean(),
  price_type: z.enum(['a_partir_de', 'unico', 'nao_informado']).nullable().optional(),
  price_value: nullableNum,
  ticket_url: nullableStr,

  // E — Detalhes
  description: z.string().min(100, 'Descrição deve ter ao menos 100 caracteres'),
  event_url: nullableStr,
  image_url: nullableStr,

  // F — Organizador
  organizer_name: z.string().min(2, 'Nome do organizador obrigatório'),
  organizer_url: nullableStr,

  // Meta
  source_url: nullableStr,
  source: z.enum(['ORGANIZADOR', 'AGENTE']),

  // Submitter info
  is_organizer: z.boolean().nullable(),
  organizer_email: nullableStr,
  submitter_email: nullableStr,
  is_verified: z.boolean(),
});

export type SubmissionInput = z.input<typeof submissionSchema>;
export type SubmissionData = z.output<typeof submissionSchema>;
