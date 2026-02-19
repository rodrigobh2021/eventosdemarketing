'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EVENT_CATEGORIES, EVENT_FORMATS, EVENT_TOPICS, MAIN_CITIES } from '@/lib/constants';
import type { ScrapedEventData } from '@/types';
import RichTextEditor from '@/components/shared/RichTextEditor';

// ─── Constants ───────────────────────────────────────────────────────────────

const BR_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const INPUT_BASE =
  'w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';
const INPUT_NORMAL = `${INPUT_BASE} border-gray-300 bg-white`;
const INPUT_AI = `${INPUT_BASE} border-blue-300 bg-blue-50/40`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  category: string;
  format: string;
  topics: string[];
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  address: string;
  citySelect: string; // slug or 'outra'
  cityInput: string;  // used when citySelect === 'outra'
  state: string;
  latitude: string;
  longitude: string;
  is_free: boolean;
  price_info: string;
  ticket_url: string;
  description: string;
  event_url: string;
  image_url: string;
  organizer_name: string;
  organizer_url: string;
  source_url: string;
  source: 'ORGANIZADOR' | 'AGENTE';
  // new
  is_organizer: boolean | null;
  organizer_email: string;
  submitter_email: string;
}

const EMPTY_FORM: FormState = {
  title: '', category: '', format: '', topics: [],
  start_date: '', end_date: '', start_time: '', end_time: '',
  venue_name: '', address: '', citySelect: '', cityInput: '', state: '',
  latitude: '', longitude: '',
  is_free: false, price_info: '', ticket_url: '',
  description: '', event_url: '', image_url: '',
  organizer_name: '', organizer_url: '',
  source_url: '', source: 'ORGANIZADOR',
  is_organizer: null, organizer_email: '', submitter_email: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveCity(form: FormState): { city: string; state: string } {
  if (form.format === 'ONLINE') {
    return { city: 'Online', state: form.state || 'BR' };
  }
  if (form.citySelect === 'outra') {
    return { city: form.cityInput.trim(), state: form.state };
  }
  const found = MAIN_CITIES.find((c) => c.slug === form.citySelect);
  return { city: found?.name ?? form.cityInput, state: found?.state ?? form.state };
}

function mapScrapedToForm(data: ScrapedEventData, sourceUrl: string): {
  form: FormState;
  aiFields: Set<string>;
} {
  const aiFields = new Set<string>();
  function mark<T>(key: string, val: T): T {
    if (val !== null && val !== undefined && val !== '') aiFields.add(key);
    return val;
  }

  // Resolve city to a select value
  const cityMatch = MAIN_CITIES.find(
    (c) => c.name.toLowerCase() === (data.city ?? '').toLowerCase(),
  );
  const citySelect = cityMatch ? cityMatch.slug : (data.city ? 'outra' : '');
  const cityInput = cityMatch ? '' : (data.city ?? '');
  if (data.city) { aiFields.add('citySelect'); aiFields.add('cityInput'); aiFields.add('state'); }

  return {
    form: {
      title: mark('title', data.title ?? ''),
      category: mark('category', data.category ?? ''),
      format: mark('format', data.format ?? ''),
      topics: mark('topics', data.topics ?? []),
      start_date: mark('start_date', data.start_date ?? ''),
      end_date: mark('end_date', data.end_date ?? ''),
      start_time: mark('start_time', data.start_time ?? ''),
      end_time: mark('end_time', data.end_time ?? ''),
      venue_name: mark('venue_name', data.venue_name ?? ''),
      address: mark('address', data.address ?? ''),
      citySelect,
      cityInput,
      state: mark('state', data.state ?? (cityMatch?.state ?? '')),
      latitude: mark('latitude', data.latitude != null ? String(data.latitude) : ''),
      longitude: mark('longitude', data.longitude != null ? String(data.longitude) : ''),
      is_free: mark('is_free', data.is_free ?? false),
      price_info: mark('price_info', data.price_info ?? ''),
      ticket_url: mark('ticket_url', data.ticket_url ?? ''),
      description: mark('description', data.description ?? ''),
      event_url: mark('event_url', data.event_url ?? ''),
      image_url: mark('image_url', data.image_url ?? ''),
      organizer_name: mark('organizer_name', data.organizer_name ?? ''),
      organizer_url: mark('organizer_url', data.organizer_url ?? ''),
      source_url: sourceUrl,
      source: 'AGENTE',
      is_organizer: null,
      organizer_email: '',
      submitter_email: '',
    },
    aiFields,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getTodayStr(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function validateForm(form: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  const today = getTodayStr();
  if (form.is_organizer === null) e.is_organizer = 'Selecione uma opção para continuar';
  if (!form.title.trim()) e.title = 'Título obrigatório';
  if (!form.category) e.category = 'Selecione uma categoria';
  if (!form.format) e.format = 'Selecione um formato';
  if (form.topics.length === 0) e.topics = 'Selecione ao menos 1 tema';
  if (!form.start_date) {
    e.start_date = 'Data de início obrigatória';
  } else if (form.start_date < today) {
    e.start_date = 'A data de início não pode ser anterior a hoje';
  }
  if (form.end_date && form.start_date && form.end_date < form.start_date) {
    e.end_date = 'A data de término não pode ser anterior à data de início';
  }
  if (form.format !== 'ONLINE') {
    const city = form.citySelect === 'outra' ? form.cityInput.trim() : form.citySelect;
    if (!city) e.citySelect = 'Cidade obrigatória';
    if (!form.state) e.state = 'Estado obrigatório';
  }
  const descText = form.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (descText.length < 100) {
    e.description = `Descrição muito curta (${descText.length}/100 caracteres mínimos)`;
  }
  if (!form.organizer_name.trim()) e.organizer_name = 'Nome do organizador obrigatório';
  if (!form.event_url.trim()) e.event_url = 'URL do site oficial obrigatória';
  if (!form.image_url.trim()) e.image_url = 'URL da imagem/banner obrigatória';
  if (form.is_organizer === true) {
    if (!form.organizer_email.trim()) e.organizer_email = 'Email de contato obrigatório';
    else if (!EMAIL_RE.test(form.organizer_email)) e.organizer_email = 'Email inválido';
  }
  return e;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </div>
  );
}

function FieldLabel({ label, required, aiActive }: { label: string; required?: boolean; aiActive?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {aiActive && (
        <span className="ml-2 inline-flex items-center gap-0.5 text-xs font-normal text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
          ✦ IA
        </span>
      )}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function PreviewModal({
  form,
  onClose,
  onSubmit,
  submitting,
}: {
  form: FormState;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const { city } = resolveCity(form);
  const location =
    form.format === 'ONLINE'
      ? 'Evento Online'
      : [form.venue_name, city].filter(Boolean).join(' · ');

  const PLACEHOLDER_COLORS = [
    'from-blue-500 to-indigo-600', 'from-orange-400 to-rose-500',
    'from-emerald-400 to-teal-600', 'from-violet-500 to-purple-600',
  ];
  const gradientIdx = form.title.charCodeAt(0) % PLACEHOLDER_COLORS.length;

  const FORMAT_COLORS: Record<string, string> = {
    PRESENCIAL: 'bg-blue-100 text-blue-700',
    ONLINE: 'bg-purple-100 text-purple-700',
    HIBRIDO: 'bg-amber-100 text-amber-700',
  };
  const FORMAT_LABELS: Record<string, string> = {
    PRESENCIAL: 'Presencial', ONLINE: 'Online', HIBRIDO: 'Híbrido',
  };

  const dateStr = form.start_date
    ? format(new Date(form.start_date + 'T00:00:00'), "EEE, dd 'de' MMM", { locale: ptBR })
    : '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card preview */}
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {form.image_url ? (
            <img src={form.image_url} alt={form.title} className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${PLACEHOLDER_COLORS[gradientIdx]}`}>
              <span className="text-4xl font-bold text-white/80">{form.title.charAt(0).toUpperCase()}</span>
            </div>
          )}
          {form.format && (
            <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium ${FORMAT_COLORS[form.format] ?? 'bg-gray-100 text-gray-700'}`}>
              {FORMAT_LABELS[form.format] ?? form.format}
            </span>
          )}
        </div>

        <div className="p-5 space-y-1.5">
          <time className="text-sm font-semibold uppercase text-blue-600">{dateStr}</time>
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{form.title || '(sem título)'}</h3>
          {location && <p className="text-sm text-gray-500">{location}</p>}
          <div className="pt-1">
            {form.is_free ? (
              <span className="inline-block rounded-full bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-0.5">Gratuito</span>
            ) : (
              <span className="text-sm text-gray-600">{form.price_info || 'Preço a confirmar'}</span>
            )}
          </div>
          {form.description && (
            <p className="text-sm text-gray-600 line-clamp-3 pt-1" dangerouslySetInnerHTML={{ __html: form.description }} />
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Editar
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Enviando…' : 'Enviar para Revisão'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CadastrarEventoPage() {
  const [phase, setPhase] = useState<'url' | 'form' | 'success'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLatLng, setShowLatLng] = useState(false);

  const set = (key: keyof FormState, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const ai = (field: string) => aiFields.has(field);
  const inputCls = (field: string) => (ai(field) ? INPUT_AI : INPUT_NORMAL);
  const err = (field: string) => errors[field];

  const showLocation = form.format === 'PRESENCIAL' || form.format === 'HIBRIDO';

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleScrape() {
    if (!urlInput.trim()) return;
    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch('/api/agent/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setScrapeError(json.error ?? 'Não foi possível extrair dados. Tente preencher manualmente.');
        return;
      }
      const { form: mapped, aiFields: af } = mapScrapedToForm(json.data as ScrapedEventData, urlInput.trim());
      setForm(mapped);
      setAiFields(af);
      setPhase('form');
    } catch {
      setScrapeError('Erro ao acessar o serviço. Tente novamente.');
    } finally {
      setScraping(false);
    }
  }

  async function handleSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setShowPreview(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const { city, state } = resolveCity(form);
      const payload = {
        title: form.title.trim(),
        category: form.category,
        format: form.format,
        topics: form.topics,
        start_date: form.start_date,
        end_date: form.end_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue_name: form.venue_name || null,
        address: form.address || null,
        city,
        state,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        is_free: form.is_free,
        price_info: form.is_free ? null : (form.price_info || null),
        ticket_url: form.ticket_url || null,
        description: form.description,
        event_url: form.event_url || null,
        image_url: form.image_url || null,
        organizer_name: form.organizer_name.trim(),
        organizer_url: form.organizer_url || null,
        source_url: form.source_url || null,
        source: form.is_organizer ? 'ORGANIZADOR' : 'AGENTE',
        is_organizer: form.is_organizer,
        organizer_email: form.is_organizer ? form.organizer_email.trim() : null,
        submitter_email: !form.is_organizer && form.submitter_email.trim() ? form.submitter_email.trim() : null,
        is_verified: false,
      };
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowPreview(false);
        setPhase('success');
      } else {
        setErrors({ _global: data.error ?? 'Erro ao enviar. Tente novamente.' });
        setShowPreview(false);
      }
    } catch {
      setErrors({ _global: 'Erro ao enviar. Tente novamente.' });
      setShowPreview(false);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Phase: success ─────────────────────────────────────────────────────────

  if (phase === 'success') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Evento enviado com sucesso!</h1>
          <p className="text-gray-600 mb-6">
            Nossa equipe irá revisar e publicar em até 24 horas. Obrigado por divulgar seu evento!
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/eventos" className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Ver eventos
            </a>
            <button
              onClick={() => { setForm(EMPTY_FORM); setAiFields(new Set()); setUrlInput(''); setPhase('url'); }}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Cadastrar outro evento
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Phase: url ─────────────────────────────────────────────────────────────

  if (phase === 'url') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cadastrar Evento</h1>
            <p className="mt-2 text-gray-600">
              Cole o link do evento e preencheremos as informações automaticamente.
              <br />Ou preencha manualmente.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Link do evento
              </label>
              <input
                type="url"
                placeholder="Insira a URL do Evento"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                className={`${INPUT_NORMAL} text-base py-3`}
                disabled={scraping}
              />
            </div>

            {scrapeError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {scrapeError}
              </div>
            )}

            <button
              onClick={handleScrape}
              disabled={scraping || !urlInput.trim()}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {scraping ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analisando a página do evento…
                </span>
              ) : (
                'Extrair Informações'
              )}
            </button>

            <div className="text-center">
              <button
                onClick={() => { setForm(EMPTY_FORM); setAiFields(new Set()); setPhase('form'); }}
                className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
              >
                Prefiro preencher manualmente
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Phase: form ────────────────────────────────────────────────────────────

  const hasAI = form.source === 'AGENTE';
  const startDateIsPast = form.start_date ? form.start_date < getTodayStr() : false;

  return (
    <>
      {showPreview && (
        <PreviewModal
          form={form}
          onClose={() => setShowPreview(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="mx-auto max-w-2xl space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cadastrar Evento</h1>
              <p className="text-sm text-gray-500 mt-0.5">Campos marcados com * são obrigatórios</p>
            </div>
            <button
              onClick={() => setPhase('url')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Voltar
            </button>
          </div>

          {/* AI badge */}
          {hasAI && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 text-sm text-blue-700">
              <span>✦</span>
              <span>Dados extraídos automaticamente — revise antes de publicar</span>
            </div>
          )}

          {/* Global error */}
          {errors._global && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {errors._global}
            </div>
          )}

          {/* ── SEÇÃO 0 — Quem está cadastrando? ──────────────────────── */}
          <SectionCard title="Quem está cadastrando?">
            <p className="text-sm text-gray-600 -mt-1">Você é o organizador deste evento?</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card: Sou o organizador */}
              <button
                type="button"
                onClick={() => set('is_organizer', true)}
                className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-colors ${
                  form.is_organizer === true
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-2xl">✅</span>
                <span className="text-sm font-semibold text-gray-900">Sim, sou o organizador</span>
                <span className="text-xs text-gray-500 leading-snug">
                  O evento será marcado como verificado após confirmação
                </span>
              </button>

              {/* Card: Estou indicando */}
              <button
                type="button"
                onClick={() => set('is_organizer', false)}
                className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-colors ${
                  form.is_organizer === false
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-2xl">📢</span>
                <span className="text-sm font-semibold text-gray-900">Não, estou indicando este evento</span>
                <span className="text-xs text-gray-500 leading-snug">
                  Obrigado por compartilhar! O evento será publicado sem selo de verificado
                </span>
              </button>
            </div>

            <FieldError msg={err('is_organizer')} />

            {/* Email do organizador — aparece quando é o organizador */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: form.is_organizer === true ? '180px' : 0, opacity: form.is_organizer === true ? 1 : 0 }}
            >
              <div className="pt-1 space-y-1">
                <FieldLabel label="Email de contato do organizador" required />
                <input
                  type="email"
                  value={form.organizer_email}
                  onChange={(e) => set('organizer_email', e.target.value)}
                  placeholder="seu@email.com"
                  className={INPUT_NORMAL}
                  autoComplete="email"
                />
                <p className="text-xs text-gray-400">
                  Usaremos este email apenas para confirmar informações do evento. Não será exibido publicamente.
                </p>
                <FieldError msg={err('organizer_email')} />
              </div>
            </div>

            {/* Email do indicador — aparece quando não é o organizador */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: form.is_organizer === false ? '180px' : 0, opacity: form.is_organizer === false ? 1 : 0 }}
            >
              <div className="pt-1 space-y-1">
                <FieldLabel label="Seu email (opcional)" />
                <input
                  type="email"
                  value={form.submitter_email}
                  onChange={(e) => set('submitter_email', e.target.value)}
                  placeholder="seu@email.com"
                  className={INPUT_NORMAL}
                  autoComplete="email"
                />
                <p className="text-xs text-gray-400">
                  Avisaremos quando o evento for publicado.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* ── SEÇÃO A — Informações Básicas ──────────────────────────── */}
          <SectionCard title="A — Informações Básicas">
            {/* Título */}
            <div>
              <FieldLabel label="Título do evento" required aiActive={ai('title')} />
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ex: Marketing Summit 2026 — O maior encontro de marketing do Brasil"
                className={inputCls('title')}
              />
              <FieldError msg={err('title')} />
            </div>

            {/* Categoria */}
            <div>
              <FieldLabel label="Categoria" required aiActive={ai('category')} />
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={inputCls('category')}
              >
                <option value="">Selecione uma categoria</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <FieldError msg={err('category')} />
            </div>

            {/* Formato */}
            <div>
              <FieldLabel label="Formato" required aiActive={ai('format')} />
              <div className="flex gap-3 flex-wrap">
                {EVENT_FORMATS.map((f) => (
                  <label
                    key={f.value}
                    className={`flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      form.format === f.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={f.value}
                      checked={form.format === f.value}
                      onChange={() => set('format', f.value)}
                      className="sr-only"
                    />
                    {f.label}
                  </label>
                ))}
              </div>
              <FieldError msg={err('format')} />
            </div>

            {/* Temas */}
            <div>
              <FieldLabel label="Temas" required aiActive={ai('topics')} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EVENT_TOPICS.map((t) => {
                  const checked = form.topics.includes(t.slug);
                  return (
                    <label
                      key={t.slug}
                      className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        checked
                          ? 'border-blue-400 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          set('topics', checked
                            ? form.topics.filter((s) => s !== t.slug)
                            : [...form.topics, t.slug])
                        }
                        className="sr-only"
                      />
                      <span>{t.emoji}</span>
                      {t.label}
                    </label>
                  );
                })}
              </div>
              <FieldError msg={err('topics')} />
            </div>
          </SectionCard>

          {/* ── SEÇÃO B — Data e Horário ───────────────────────────────── */}
          <SectionCard title="B — Data e Horário">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Data de início" required aiActive={ai('start_date')} />
                <input
                  type="date"
                  value={form.start_date}
                  min={getTodayStr()}
                  onChange={(e) => set('start_date', e.target.value)}
                  className={inputCls('start_date')}
                />
                <FieldError msg={err('start_date')} />
                {!err('start_date') && startDateIsPast && (
                  <p className="mt-1 text-xs text-amber-600">Atenção: esta data já passou. Verifique ou corrija antes de enviar.</p>
                )}
              </div>
              <div>
                <FieldLabel label="Data de término" aiActive={ai('end_date')} />
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date || getTodayStr()}
                  onChange={(e) => set('end_date', e.target.value)}
                  className={inputCls('end_date')}
                />
                <FieldError msg={err('end_date')} />
              </div>
              <div>
                <FieldLabel label="Horário de início" aiActive={ai('start_time')} />
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => set('start_time', e.target.value)}
                  className={inputCls('start_time')}
                />
              </div>
              <div>
                <FieldLabel label="Horário de término" aiActive={ai('end_time')} />
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => set('end_time', e.target.value)}
                  className={inputCls('end_time')}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── SEÇÃO C — Local (animado) ──────────────────────────────── */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: showLocation ? '1200px' : 0, opacity: showLocation ? 1 : 0 }}
          >
            <SectionCard title="C — Local">
              <div>
                <FieldLabel label="Nome do local" aiActive={ai('venue_name')} />
                <input
                  type="text"
                  value={form.venue_name}
                  onChange={(e) => set('venue_name', e.target.value)}
                  placeholder="Ex: Centro de Convenções"
                  className={inputCls('venue_name')}
                />
              </div>
              <div>
                <FieldLabel label="Endereço completo" aiActive={ai('address')} />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Ex: Av. Paulista, 1000, Bela Vista"
                  className={inputCls('address')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel label="Cidade" required aiActive={ai('citySelect')} />
                  <select
                    value={form.citySelect}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const found = MAIN_CITIES.find((c) => c.slug === slug);
                      set('citySelect', slug);
                      if (found) set('state', found.state);
                    }}
                    className={inputCls('citySelect')}
                  >
                    <option value="">Selecione</option>
                    {MAIN_CITIES.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                    <option value="outra">Outra cidade…</option>
                  </select>
                  <FieldError msg={err('citySelect')} />
                </div>
                <div>
                  <FieldLabel label="Estado" required aiActive={ai('state')} />
                  <select
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    className={inputCls('state')}
                    disabled={form.citySelect !== 'outra' && !!form.citySelect && form.citySelect !== ''}
                  >
                    <option value="">UF</option>
                    {BR_STATES.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                  <FieldError msg={err('state')} />
                </div>
              </div>

              {form.citySelect === 'outra' && (
                <div>
                  <FieldLabel label="Nome da cidade" required />
                  <input
                    type="text"
                    value={form.cityInput}
                    onChange={(e) => set('cityInput', e.target.value)}
                    placeholder="Digite o nome da cidade"
                    className={INPUT_NORMAL}
                  />
                </div>
              )}

              {/* Lat/lng avançado */}
              <details onToggle={(e) => setShowLatLng((e.target as HTMLDetailsElement).open)}>
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 select-none">
                  Coordenadas GPS (avançado)
                </summary>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <FieldLabel label="Latitude" aiActive={ai('latitude')} />
                    <input
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={(e) => set('latitude', e.target.value)}
                      placeholder="-23.5505"
                      className={inputCls('latitude')}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Longitude" aiActive={ai('longitude')} />
                    <input
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={(e) => set('longitude', e.target.value)}
                      placeholder="-46.6333"
                      className={inputCls('longitude')}
                    />
                  </div>
                </div>
              </details>
            </SectionCard>
          </div>

          {/* ── SEÇÃO D — Ingressos ────────────────────────────────────── */}
          <SectionCard title="D — Ingressos">
            {/* Toggle gratuito */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Evento gratuito?</span>
              <button
                type="button"
                role="switch"
                aria-checked={form.is_free}
                onClick={() => set('is_free', !form.is_free)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.is_free ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.is_free ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!form.is_free && (
              <div>
                <FieldLabel label="Informação de preço" aiActive={ai('price_info')} />
                <input
                  type="text"
                  value={form.price_info}
                  onChange={(e) => set('price_info', e.target.value)}
                  placeholder="Ex: A partir de R$150"
                  className={inputCls('price_info')}
                />
              </div>
            )}

            <div>
              <FieldLabel label="Link para compra de ingressos" aiActive={ai('ticket_url')} />
              <input
                type="url"
                value={form.ticket_url}
                onChange={(e) => set('ticket_url', e.target.value)}
                placeholder="https://sympla.com.br/evento"
                className={inputCls('ticket_url')}
              />
            </div>
          </SectionCard>

          {/* ── SEÇÃO E — Detalhes ─────────────────────────────────────── */}
          <SectionCard title="E — Detalhes">
            <div>
              {(() => {
                const descText = form.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
                return (
                  <>
                    <div className="flex items-end justify-between mb-1">
                      <FieldLabel label="Descrição do evento" required aiActive={ai('description')} />
                      <span className={`text-xs ${descText.length < 100 ? 'text-red-400' : 'text-gray-400'}`}>
                        {descText.length} / 100 mín.
                      </span>
                    </div>
                    <RichTextEditor
                      value={form.description}
                      onChange={(html) => set('description', html)}
                      placeholder="Descreva o evento: programação, palestrantes, público-alvo…"
                      className={ai('description') ? 'border-blue-300 bg-blue-50/40' : ''}
                    />
                    <FieldError msg={err('description')} />
                  </>
                );
              })()}
            </div>

            <div>
              <FieldLabel label="URL do site oficial do evento" required aiActive={ai('event_url')} />
              <input
                type="url"
                value={form.event_url}
                onChange={(e) => set('event_url', e.target.value)}
                placeholder="https://seuevento.com.br"
                className={inputCls('event_url')}
              />
              <FieldError msg={err('event_url')} />
            </div>

            <div>
              <FieldLabel label="URL da imagem / banner" required aiActive={ai('image_url')} />
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => set('image_url', e.target.value)}
                placeholder="https://..."
                className={inputCls('image_url')}
              />
              <FieldError msg={err('image_url')} />
              {form.image_url && /^https?:\/\//.test(form.image_url) && (
                <div className="mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  <img
                    src={form.image_url}
                    alt="Preview do banner"
                    className="w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── SEÇÃO F — Organizador ──────────────────────────────────── */}
          <SectionCard title="F — Organizador">
            <div>
              <FieldLabel label="Nome do organizador" required aiActive={ai('organizer_name')} />
              <input
                type="text"
                value={form.organizer_name}
                onChange={(e) => set('organizer_name', e.target.value)}
                placeholder="Ex: Nome da empresa organizadora"
                className={inputCls('organizer_name')}
              />
              <FieldError msg={err('organizer_name')} />
            </div>
            <div>
              <FieldLabel label="Site do organizador" aiActive={ai('organizer_url')} />
              <input
                type="url"
                value={form.organizer_url}
                onChange={(e) => set('organizer_url', e.target.value)}
                placeholder="https://seusite.com.br"
                className={inputCls('organizer_url')}
              />
            </div>
          </SectionCard>

          {/* ── Ações ──────────────────────────────────────────────────── */}
          <div className="flex gap-3 pb-8">
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Pré-visualizar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Enviando…' : 'Enviar para Revisão'}
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
