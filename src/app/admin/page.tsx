'use client';

import { useState, useEffect, useCallback } from 'react';
import { EVENT_CATEGORIES, EVENT_FORMATS, EVENT_TOPICS } from '@/lib/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventData {
  title: string;
  category: string;
  format: string;
  topics: string[];
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  address: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  is_free: boolean;
  price_info: string | null;
  ticket_url: string | null;
  description: string;
  event_url: string | null;
  image_url: string | null;
  organizer_name: string;
  organizer_url: string | null;
  source_url: string | null;
  is_organizer: boolean | null;
  organizer_email: string | null;
  submitter_email: string | null;
  is_verified: boolean;
}

interface Submission {
  id: string;
  source: 'ORGANIZADOR' | 'AGENTE' | 'ADMIN';
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  event_data: EventData;
}

type TabStatus = 'PENDENTE' | 'REJEITADO';
type ActiveTab = TabStatus | 'EVENTOS' | 'CATEGORIAS' | 'CIDADES' | 'TEMAS';

interface EventRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  city: string;
  state: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  venue_name: string | null;
  category: string;
  topics: string[];
  is_free: boolean;
  price_info: string | null;
  ticket_url: string | null;
  event_url: string | null;
  image_url: string | null;
  organizer_name: string;
  organizer_url: string | null;
  format: string;
  status: string;
  is_verified: boolean;
  source_url: string | null;
  interest_count: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoryPageRecord {
  id: string;
  category: string;
  slug: string;
  title: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  event_count?: number;
}

interface CityPageRecord {
  id: string;
  city: string;
  state: string;
  slug: string;
  title: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  event_count?: number;
}

interface TopicPageRecord {
  id: string;
  topic: string;
  slug: string;
  title: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  event_count?: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
  link?: { href: string; label: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return 'agora mesmo';
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

function formatDate(s: string | null): string {
  if (!s) return '—';
  const d = s.length === 10 ? new Date(s + 'T00:00:00') : new Date(s);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function categoryLabel(v: string) {
  return EVENT_CATEGORIES.find(c => c.value === v)?.label ?? v;
}
function formatLabel(v: string) {
  return EVENT_FORMATS.find(f => f.value === v)?.label ?? v;
}
function topicLabel(slug: string) {
  const t = EVENT_TOPICS.find(t => t.slug === slug);
  return t ? `${t.emoji} ${t.label}` : slug;
}

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
];

// ─── Fields audit ─────────────────────────────────────────────────────────────

interface FieldCheck {
  label: string;
  ok: boolean;
  severity: 'error' | 'warn' | 'info';
}

function auditFields(d: EventData, source: string): FieldCheck[] {
  const presencial = d.format !== 'ONLINE';
  const isOrg = source === 'ORGANIZADOR' || d.is_organizer === true;

  return [
    { label: 'Imagem / banner',      ok: Boolean(d.image_url),                    severity: 'error' },
    { label: 'URL do evento',         ok: Boolean(d.event_url),                    severity: 'error' },
    { label: 'Descrição (≥100 car.)', ok: (d.description?.length ?? 0) >= 100,    severity: 'error' },
    { label: 'Link de ingressos',     ok: d.is_free || Boolean(d.ticket_url),      severity: 'warn'  },
    { label: 'Preço',                 ok: d.is_free || Boolean(d.price_info),      severity: 'warn'  },
    { label: 'Horário de início',     ok: Boolean(d.start_time),                   severity: 'warn'  },
    { label: 'Horário de término',    ok: Boolean(d.end_time),                     severity: 'info'  },
    { label: 'Nome do local',         ok: !presencial || Boolean(d.venue_name),    severity: 'warn'  },
    { label: 'Endereço',              ok: !presencial || Boolean(d.address),       severity: 'info'  },
    { label: 'Site do organizador',   ok: Boolean(d.organizer_url),               severity: 'info'  },
    { label: 'Email do organizador',  ok: !isOrg || Boolean(d.organizer_email),   severity: 'warn'  },
  ];
}

function FieldsAudit({ d, source }: { d: EventData; source: string }) {
  const checks = auditFields(d, source);
  const missing = checks.filter(c => !c.ok);

  if (missing.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
        <span>✅</span>
        <span className="font-medium">Todos os campos preenchidos</span>
      </div>
    );
  }

  const errors = missing.filter(c => c.severity === 'error');
  const warns  = missing.filter(c => c.severity === 'warn');
  const infos  = missing.filter(c => c.severity === 'info');

  const bgColor = errors.length > 0 ? 'bg-red-50 border-red-200' : warns.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200';
  const headerColor = errors.length > 0 ? 'text-red-700' : warns.length > 0 ? 'text-yellow-700' : 'text-blue-700';
  const icon = errors.length > 0 ? '🔴' : warns.length > 0 ? '🟡' : 'ℹ️';

  return (
    <div className={`rounded-lg border px-4 py-3 space-y-2 ${bgColor}`}>
      <p className={`text-sm font-medium ${headerColor}`}>
        {icon} {missing.length} campo{missing.length !== 1 ? 's' : ''} faltando ou incompleto{missing.length !== 1 ? 's' : ''}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {errors.map(c => (
          <span key={c.label} className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
            <span>✕</span> {c.label}
          </span>
        ))}
        {warns.map(c => (
          <span key={c.label} className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
            <span>!</span> {c.label}
          </span>
        ))}
        {infos.map(c => (
          <span key={c.label} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
            <span>·</span> {c.label}
          </span>
        ))}
      </div>
      {errors.length > 0 && (
        <p className="text-xs text-red-600">
          Campos críticos em vermelho devem ser corrigidos antes de publicar.
        </p>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SourceBadge({ source, isOrganizer }: { source: string; isOrganizer: boolean | null }) {
  if (source === 'ORGANIZADOR' || isOrganizer === true) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        ✅ Organizador
      </span>
    );
  }
  if (isOrganizer === false) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        📢 Indicação
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      🤖 Agente
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0 && value !== false) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 min-w-32 shrink-0">{label}</span>
      <span className="text-gray-900 break-all">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h4>
      {children}
    </div>
  );
}

// ─── Submission Card ──────────────────────────────────────────────────────────

function SubmissionCard({
  submission,
  expanded,
  onToggle,
  onApprove,
  onReject,
  onEdit,
}: {
  submission: Submission;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  const d = submission.event_data;
  const [imgError, setImgError] = useState(false);

  const borderColor = {
    PENDENTE: 'border-l-yellow-400',
    APROVADO: 'border-l-green-500',
    REJEITADO: 'border-l-red-500',
  }[submission.status];

  const mapsUrl = d.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.address + ', ' + d.city)}`
    : null;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderColor} shadow-sm overflow-hidden`}>
      {/* Collapsed header */}
      <div className="px-5 py-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <SourceBadge source={submission.source} isOrganizer={d.is_organizer ?? null} />
            {(d.is_organizer === true || submission.source === 'ORGANIZADOR') && d.organizer_email && (
              <span className="text-xs text-gray-500">
                📧 <a href={`mailto:${d.organizer_email}`} className="underline">{d.organizer_email}</a>
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-900 truncate">{d.title}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            <span>📅 {formatDate(d.start_date)}</span>
            {d.city && <span>📍 {d.city}{d.state ? ` — ${d.state}` : ''}</span>}
            <span>🕐 {timeAgo(submission.created_at)}</span>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium shrink-0 mt-0.5"
        >
          {expanded ? 'Recolher ▲' : 'Expandir ▼'}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-6">
          {/* Banner preview */}
          {d.image_url && !imgError && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.image_url}
                alt="Banner"
                className="w-full max-h-48 object-cover rounded-lg"
                onError={() => setImgError(true)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              <Section title="Informações Básicas">
                <InfoRow label="Título" value={d.title} />
                <InfoRow label="Categoria" value={categoryLabel(d.category)} />
                <InfoRow label="Formato" value={formatLabel(d.format)} />
                <InfoRow
                  label="Temas"
                  value={
                    d.topics?.length > 0 ? (
                      <span className="flex flex-wrap gap-1">
                        {d.topics.map(t => (
                          <span key={t} className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded">
                            {topicLabel(t)}
                          </span>
                        ))}
                      </span>
                    ) : null
                  }
                />
              </Section>

              <Section title="Data e Horário">
                <InfoRow label="Início" value={formatDate(d.start_date)} />
                <InfoRow label="Término" value={formatDate(d.end_date)} />
                <InfoRow label="Horário" value={
                  d.start_time
                    ? `${d.start_time}${d.end_time ? ` – ${d.end_time}` : ''}`
                    : null
                } />
              </Section>

              <Section title="Local">
                <InfoRow label="Espaço" value={d.venue_name} />
                <InfoRow
                  label="Endereço"
                  value={
                    d.address ? (
                      mapsUrl
                        ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{d.address}</a>
                        : d.address
                    ) : null
                  }
                />
                <InfoRow label="Cidade / UF" value={d.city ? `${d.city}${d.state ? ` — ${d.state}` : ''}` : null} />
              </Section>

              <Section title="Ingressos">
                <InfoRow label="Gratuito?" value={d.is_free ? 'Sim' : 'Não'} />
                {!d.is_free && <InfoRow label="Preço" value={d.price_info} />}
                <InfoRow
                  label="Compra"
                  value={
                    d.ticket_url
                      ? <a href={d.ticket_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate">{d.ticket_url}</a>
                      : null
                  }
                />
              </Section>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <Section title="Descrição">
                <div
                  className="text-sm text-gray-700 prose prose-sm max-w-none max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50"
                  dangerouslySetInnerHTML={{ __html: d.description || '<em>Sem descrição</em>' }}
                />
              </Section>

              <Section title="Links">
                <InfoRow
                  label="Site do evento"
                  value={
                    d.event_url
                      ? <a href={d.event_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate">{d.event_url}</a>
                      : null
                  }
                />
                <InfoRow
                  label="Imagem"
                  value={
                    d.image_url
                      ? <a href={d.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate">{d.image_url}</a>
                      : null
                  }
                />
                <InfoRow
                  label="Organizador"
                  value={
                    d.organizer_url
                      ? <a href={d.organizer_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate">{d.organizer_url}</a>
                      : null
                  }
                />
                <InfoRow
                  label="Fonte"
                  value={
                    d.source_url
                      ? <a href={d.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate">{d.source_url}</a>
                      : null
                  }
                />
              </Section>

              <Section title="Organizador">
                <InfoRow label="Nome" value={d.organizer_name} />
                {d.organizer_email && (
                  <InfoRow
                    label="Email"
                    value={
                      <a href={`mailto:${d.organizer_email}`} className="text-blue-600 underline">
                        {d.organizer_email}
                      </a>
                    }
                  />
                )}
                {d.submitter_email && (
                  <InfoRow
                    label="Indicado por"
                    value={
                      <a href={`mailto:${d.submitter_email}`} className="text-blue-600 underline">
                        {d.submitter_email}
                      </a>
                    }
                  />
                )}
              </Section>

              {/* Rejection notes */}
              {submission.status === 'REJEITADO' && submission.reviewer_notes && (
                <Section title="Motivo da rejeição">
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    {submission.reviewer_notes}
                  </p>
                </Section>
              )}

              {/* Link to published event */}
              {submission.status === 'APROVADO' && (
                <Section title="Publicado">
                  <p className="text-sm text-green-700">
                    Evento aprovado em {submission.reviewed_at ? new Date(submission.reviewed_at).toLocaleDateString('pt-BR') : '—'}.
                  </p>
                </Section>
              )}
            </div>
          </div>

          {/* Fields audit */}
          {submission.status === 'PENDENTE' && (
            <FieldsAudit d={d} source={submission.source} />
          )}

          {/* Action buttons */}
          {submission.status === 'PENDENTE' && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={onApprove}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                ✅ Aprovar e Publicar
              </button>
              <button
                onClick={onEdit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                ✏️ Editar antes de Aprovar
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
              >
                ❌ Rejeitar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Edit Form (submission) ───────────────────────────────────────────────────

function EditForm({
  data,
  onChange,
  cities = [],
}: {
  data: EventData;
  onChange: (d: EventData) => void;
  cities?: CityPageRecord[];
}) {
  function set(key: keyof EventData, value: unknown) {
    onChange({ ...data, [key]: value });
  }

  const INPUT = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="space-y-5">
      {/* Básico */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Informações Básicas</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input className={INPUT} value={data.title} onChange={e => set('title', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select className={INPUT} value={data.category} onChange={e => set('category', e.target.value)}>
              {EVENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
            <select className={INPUT} value={data.format} onChange={e => set('format', e.target.value)}>
              {EVENT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Datas */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Data e Horário</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data início</label>
            <input type="date" className={INPUT} value={data.start_date} onChange={e => set('start_date', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data término</label>
            <input type="date" className={INPUT} value={data.end_date ?? ''} onChange={e => set('end_date', e.target.value || null)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário início</label>
            <input type="time" className={INPUT} value={data.start_time ?? ''} onChange={e => set('start_time', e.target.value || null)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário término</label>
            <input type="time" className={INPUT} value={data.end_time ?? ''} onChange={e => set('end_time', e.target.value || null)} />
          </div>
        </div>
      </div>

      {/* Local */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Local</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do espaço</label>
          <input className={INPUT} value={data.venue_name ?? ''} onChange={e => set('venue_name', e.target.value || null)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
          <input className={INPUT} value={data.address ?? ''} onChange={e => set('address', e.target.value || null)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            {cities.length > 0 ? (
              <>
                <select
                  className={INPUT}
                  value={data.city}
                  onChange={e => {
                    const cityName = e.target.value;
                    if (cityName === 'Online') {
                      onChange({ ...data, city: 'Online', state: 'BR' });
                    } else {
                      const found = cities.find(c => c.city === cityName);
                      if (found) onChange({ ...data, city: found.city, state: found.state });
                    }
                  }}
                >
                  <option value="Online">🌐 Online</option>
                  {!cities.some(c => c.city === data.city) && data.city !== 'Online' && (
                    <option value={data.city} disabled>{data.city} (não cadastrada)</option>
                  )}
                  {cities.map(c => (
                    <option key={c.id} value={c.city}>{c.city} — {c.state}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Para usar cidade não listada, crie-a na aba Cidades.</p>
              </>
            ) : (
              <input className={INPUT} value={data.city} onChange={e => set('city', e.target.value)} />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
            {cities.length > 0 ? (
              <input
                className={`${INPUT} bg-gray-100 cursor-not-allowed text-gray-500`}
                value={data.state}
                readOnly
                tabIndex={-1}
                title="Preenchido automaticamente pela cidade"
              />
            ) : (
              <select className={INPUT} value={data.state} onChange={e => set('state', e.target.value)}>
                <option value="">UF</option>
                {BR_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Ingressos */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ingressos</h4>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="edit-is-free"
            checked={data.is_free}
            onChange={e => set('is_free', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="edit-is-free" className="text-sm text-gray-700">Evento gratuito</label>
        </div>
        {!data.is_free && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Informação de preço</label>
            <input className={INPUT} value={data.price_info ?? ''} onChange={e => set('price_info', e.target.value || null)} placeholder="Ex: A partir de R$150" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link de ingressos</label>
          <input className={INPUT} value={data.ticket_url ?? ''} onChange={e => set('ticket_url', e.target.value || null)} />
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Descrição</h4>
        <textarea
          className={`${INPUT} min-h-32 resize-y`}
          value={data.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      {/* Links */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Links</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL do evento</label>
          <input className={INPUT} value={data.event_url ?? ''} onChange={e => set('event_url', e.target.value || null)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL da imagem</label>
          <input className={INPUT} value={data.image_url ?? ''} onChange={e => set('image_url', e.target.value || null)} />
        </div>
      </div>

      {/* Organizador */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Organizador</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input className={INPUT} value={data.organizer_name} onChange={e => set('organizer_name', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
          <input className={INPUT} value={data.organizer_url ?? ''} onChange={e => set('organizer_url', e.target.value || null)} />
        </div>
      </div>

      {/* Temas */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Temas</h4>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {EVENT_TOPICS.map(t => (
            <label key={t.slug} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.topics.includes(t.slug)}
                onChange={e => {
                  const next = e.target.checked
                    ? [...data.topics, t.slug]
                    : data.topics.filter(s => s !== t.slug);
                  set('topics', next);
                }}
                className="h-4 w-4 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-sm text-gray-700">{t.emoji} {t.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

const EVENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PUBLICADO: { label: 'Publicado', color: 'bg-green-100 text-green-700'    },
  RASCUNHO:  { label: 'Rascunho',  color: 'bg-gray-100 text-gray-600'     },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-700'       },
  ENCERRADO: { label: 'Encerrado', color: 'bg-purple-100 text-purple-700' },
};

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: EventRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusInfo = EVENT_STATUS_LABELS[event.status] ?? { label: event.status, color: 'bg-gray-100 text-gray-600' };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4">
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt=""
            className="w-16 h-16 object-cover rounded-lg shrink-0"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl shrink-0">
            📅
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {event.is_verified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                ✅ Verificado
              </span>
            )}
            <span className="text-xs text-gray-500">{categoryLabel(event.category)} · {formatLabel(event.format)}</span>
          </div>
          <p className="font-semibold text-gray-900 truncate">{event.title}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            <span>📅 {formatDate(event.start_date)}</span>
            {event.city && <span>📍 {event.city}{event.state ? ` — ${event.state}` : ''}</span>}
            <span className="font-mono text-gray-400">/evento/{event.slug}</span>
            <a
              href={`/evento/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              🔗 ver no site
            </a>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 mt-0.5">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ✏️ Editar
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            🗑️ Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Topic Page Card ──────────────────────────────────────────────────────────

function TopicCard({
  page,
  onEdit,
  onDelete,
}: {
  page: TopicPageRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const topicData = EVENT_TOPICS.find(t => t.slug === page.topic);
  const count = page.event_count ?? 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-xl shrink-0">
          {topicData?.emoji ?? '🏷️'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{page.title}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
              {topicData?.label ?? page.topic}
            </span>
            <span className="font-mono text-gray-400">/eventos/{page.slug}</span>
            <span className={count === 0 ? 'text-gray-300' : 'text-gray-500'}>
              {count} evento{count !== 1 ? 's' : ''} publicado{count !== 1 ? 's' : ''}
            </span>
          </div>
          {page.meta_title && (
            <p className="mt-1 text-xs text-gray-400 truncate">Meta: {page.meta_title}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0 mt-0.5">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ✏️ Editar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Category Page Card ───────────────────────────────────────────────────────

function CategoryCard({
  page,
  onEdit,
  onDelete,
}: {
  page: CategoryPageRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const count = page.event_count ?? 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-xl shrink-0">
          🏷️
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{page.title}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
              {categoryLabel(page.category)}
            </span>
            <span className="font-mono text-gray-400">/{page.slug}</span>
            <span className={count === 0 ? 'text-gray-300' : 'text-gray-500'}>
              {count} evento{count !== 1 ? 's' : ''} publicado{count !== 1 ? 's' : ''}
            </span>
          </div>
          {page.meta_title && (
            <p className="mt-1 text-xs text-gray-400 truncate">Meta: {page.meta_title}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0 mt-0.5">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ✏️ Editar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── City Page Card ───────────────────────────────────────────────────────────

function CityCard({
  page,
  onEdit,
  onDelete, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
  page: CityPageRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const count = page.event_count ?? 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center text-xl shrink-0">
          🏙️
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{page.title}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
              {page.city} — {page.state}
            </span>
            <span className="font-mono text-gray-400">/{page.slug}</span>
            <span className={count === 0 ? 'text-gray-300' : 'text-gray-500'}>
              {count} evento{count !== 1 ? 's' : ''} publicado{count !== 1 ? 's' : ''}
            </span>
          </div>
          {page.meta_title && (
            <p className="mt-1 text-xs text-gray-400 truncate">Meta: {page.meta_title}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0 mt-0.5">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ✏️ Editar
          </button>
          {/* Delete button removed — cities cannot be deleted (MELHORIA 6) */}
        </div>
      </div>
    </div>
  );
}

// ─── SEO Form (shared for category and city pages) ────────────────────────────

interface SeoFields {
  slug: string;
  title: string;
  description: string;
  meta_title: string;
  meta_description: string;
}

function SeoForm({
  data,
  onChange,
  slugPrefix,
  slugReadonly,
}: {
  data: SeoFields;
  onChange: (d: SeoFields) => void;
  slugPrefix?: string;
  slugReadonly?: boolean;
}) {
  const INPUT = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  function set(key: keyof SeoFields, value: string) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título da Página</label>
        <input className={INPUT} value={data.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Workshops de Marketing em São Paulo" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
        <div className="flex items-center gap-1">
          {slugPrefix && <span className="text-sm text-gray-400 shrink-0">{slugPrefix}/</span>}
          <input
            className={`${INPUT}${slugReadonly ? ' bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
            value={data.slug}
            onChange={e => !slugReadonly && set('slug', e.target.value)}
            readOnly={slugReadonly}
            placeholder="ex: workshop-marketing-sao-paulo"
          />
        </div>
        {slugReadonly && (
          <p className="text-xs text-gray-400 mt-1">
            O slug não pode ser alterado pois afeta todas as URLs do site.
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da Página</label>
        <textarea
          className={`${INPUT} min-h-20 resize-none`}
          value={data.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Texto introdutório exibido na página..."
        />
      </div>
      <div className="pt-2 border-t border-gray-100 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">SEO</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Title <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            className={INPUT}
            value={data.meta_title}
            onChange={e => set('meta_title', e.target.value)}
            placeholder="Se diferente do título da página"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            className={`${INPUT} min-h-20 resize-none`}
            value={data.meta_description}
            onChange={e => set('meta_description', e.target.value)}
            placeholder="Descrição exibida nos resultados de busca (≤160 caracteres)"
          />
          {data.meta_description.length > 0 && (
            <p className={`text-xs mt-1 ${data.meta_description.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
              {data.meta_description.length}/160 caracteres
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { label: string; value: TabStatus }[] = [
  { label: 'Pendentes', value: 'PENDENTE' },
  { label: 'Rejeitados', value: 'REJEITADO' },
];

const EMPTY_SEO: SeoFields = { slug: '', title: '', description: '', meta_title: '', meta_description: '' };

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [counts, setCounts] = useState({ PENDENTE: 0, APROVADO: 0, REJEITADO: 0 }); // APROVADO kept for API compat
  const [activeTab, setActiveTab] = useState<ActiveTab>('PENDENTE');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [approveModal, setApproveModal] = useState<{
    id: string; isVerified: boolean; notes: string;
  } | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    id: string; reason: string;
  } | null>(null);
  const [editModal, setEditModal] = useState<{
    id: string; data: EventData;
  } | null>(null);

  // Events tab state
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [evFilters, setEvFilters] = useState({
    search: '', status: '', city: '', state: '',
    topic: '', category: '', format: '',
    dateFrom: '', dateTo: '',
  });

  // Cities tab filters
  const [cityFilters, setCityFilters] = useState({ search: '', state: '' });
  const [eventEditModal, setEventEditModal] = useState<{
    id: string;
    data: EventData;
    status: string;
    slug: string;
    is_verified: boolean;
    meta_title: string;
    meta_description: string;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    id: string; title: string;
  } | null>(null);

  // Categories tab state
  const [categories, setCategories] = useState<CategoryPageRecord[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryModal, setCategoryModal] = useState<{
    id: string | null; // null = create
    category: string;
    seo: SeoFields;
  } | null>(null);
  const [deleteCategoryModal, setDeleteCategoryModal] = useState<{
    id: string; title: string;
  } | null>(null);

  // Cities tab state
  const [cities, setCities] = useState<CityPageRecord[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [cityModal, setCityModal] = useState<{
    id: string | null; // null = create
    city: string;
    state: string;
    seo: SeoFields;
  } | null>(null);
  // deleteCityModal removed (MELHORIA 6: cities cannot be deleted)

  // Topics tab state
  const [topicPages, setTopicPages] = useState<TopicPageRecord[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicModal, setTopicModal] = useState<{
    id: string | null;
    topic: string;
    seo: SeoFields;
  } | null>(null);
  const [deleteTopicModal, setDeleteTopicModal] = useState<{
    id: string; title: string;
  } | null>(null);

  // ── Load submissions ───────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/submissions');
      const json = await res.json();
      setSubmissions(json.submissions ?? []);
      setCounts(json.counts ?? { PENDENTE: 0, APROVADO: 0, REJEITADO: 0 });
    } catch {
      addToast('Erro ao carregar submissões', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Load events ───────────────────────────────────────────────────────────

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await fetch('/api/admin/events');
      const json = await res.json();
      setEvents(json.events ?? []);
    } catch {
      addToast('Erro ao carregar eventos', 'error');
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'EVENTOS') loadEvents();
  }, [activeTab, loadEvents]);

  // ── Load categories ────────────────────────────────────────────────────────

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const json = await res.json();
      setCategories(json.pages ?? []);
    } catch {
      addToast('Erro ao carregar categorias', 'error');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'CATEGORIAS') loadCategories();
  }, [activeTab, loadCategories]);

  // ── Load cities ────────────────────────────────────────────────────────────

  const loadCities = useCallback(async () => {
    setCitiesLoading(true);
    try {
      const res = await fetch('/api/admin/cities');
      const json = await res.json();
      setCities(json.pages ?? []);
    } catch {
      addToast('Erro ao carregar cidades', 'error');
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'CIDADES') loadCities();
  }, [activeTab, loadCities]);

  // Carrega cidades no mount para o select de cidade no EditForm
  useEffect(() => { loadCities(); }, [loadCities]);

  // ── Load topics ────────────────────────────────────────────────────────────

  const loadTopics = useCallback(async () => {
    setTopicsLoading(true);
    try {
      const res = await fetch('/api/admin/topics');
      const json = await res.json();
      setTopicPages(json.pages ?? []);
    } catch {
      addToast('Erro ao carregar temas', 'error');
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'TEMAS') loadTopics();
  }, [activeTab, loadTopics]);

  // ── Toasts ────────────────────────────────────────────────────────────────

  function addToast(message: string, type: 'success' | 'error', link?: Toast['link']) {
    const id = crypto.randomUUID();
    setToasts(t => [...t, { id, message, type, link }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 6000);
  }

  // ── Expand ────────────────────────────────────────────────────────────────

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── Approve ───────────────────────────────────────────────────────────────

  async function handleApprove() {
    if (!approveModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${approveModal.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: approveModal.isVerified, notes: approveModal.notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setApproveModal(null);
      await load();
      addToast('Evento publicado com sucesso!', 'success', {
        href: `/evento/${json.slug}`,
        label: 'Ver no site →',
      });
    } catch (err) {
      addToast(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Reject ────────────────────────────────────────────────────────────────

  async function handleReject() {
    if (!rejectModal) return;
    if (!rejectModal.reason.trim()) {
      addToast('Informe o motivo da rejeição', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${rejectModal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectModal.reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRejectModal(null);
      await load();
      addToast('Submissão rejeitada.', 'success');
    } catch (err) {
      addToast(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Save submission edit ───────────────────────────────────────────────────

  async function handleSaveEdit() {
    if (!editModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_data: editModal.data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEditModal(null);
      await load();
      addToast('Submissão atualizada com sucesso.', 'success');
    } catch (err) {
      addToast(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveAndApprove() {
    if (!editModal) return;
    setSubmitting(true);
    try {
      const putRes = await fetch(`/api/admin/submissions/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_data: editModal.data }),
      });
      if (!putRes.ok) throw new Error((await putRes.json()).error);
      await load();
      const savedId = editModal.id;
      const savedIsOrganizer = editModal.data.is_organizer === true;
      setEditModal(null);
      setApproveModal({ id: savedId, isVerified: savedIsOrganizer, notes: '' });
    } catch (err) {
      addToast(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Save event edit ───────────────────────────────────────────────────────

  async function handleSaveEventEdit() {
    if (!eventEditModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${eventEditModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventEditModal.data,
          slug: eventEditModal.slug,
          status: eventEditModal.status,
          is_verified: eventEditModal.is_verified,
          meta_title: eventEditModal.meta_title || null,
          meta_description: eventEditModal.meta_description || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEventEditModal(null);
      await loadEvents();
      addToast('Evento atualizado com sucesso.', 'success');
    } catch (err) {
      addToast(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete event ──────────────────────────────────────────────────────────

  async function handleDeleteEvent() {
    if (!deleteModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${deleteModal.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDeleteModal(null);
      await loadEvents();
      addToast('Evento excluído com sucesso.', 'success');
    } catch (err) {
      addToast(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Save category ─────────────────────────────────────────────────────────

  async function handleSaveCategory() {
    if (!categoryModal) return;
    if (!categoryModal.category || !categoryModal.seo.slug || !categoryModal.seo.title) {
      addToast('Preencha: categoria, slug e título', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const isEdit = Boolean(categoryModal.id);
      const url = isEdit ? `/api/admin/categories/${categoryModal.id}` : '/api/admin/categories';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryModal.category,
          slug: categoryModal.seo.slug,
          title: categoryModal.seo.title,
          description: categoryModal.seo.description || null,
          meta_title: categoryModal.seo.meta_title || null,
          meta_description: categoryModal.seo.meta_description || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCategoryModal(null);
      await loadCategories();
      addToast(isEdit ? 'Categoria atualizada.' : 'Categoria criada.', 'success');
    } catch (err) {
      addToast(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCategoryModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteCategoryModal.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDeleteCategoryModal(null);
      await loadCategories();
      addToast('Categoria excluída.', 'success');
    } catch (err) {
      addToast(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Save city ─────────────────────────────────────────────────────────────

  async function handleSaveCity() {
    if (!cityModal) return;
    if (!cityModal.city || !cityModal.state || !cityModal.seo.slug || !cityModal.seo.title) {
      addToast('Preencha: cidade, estado, slug e título', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const isEdit = Boolean(cityModal.id);
      const url = isEdit ? `/api/admin/cities/${cityModal.id}` : '/api/admin/cities';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: cityModal.city,
          state: cityModal.state,
          slug: cityModal.seo.slug,
          title: cityModal.seo.title,
          description: cityModal.seo.description || null,
          meta_title: cityModal.seo.meta_title || null,
          meta_description: cityModal.seo.meta_description || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCityModal(null);
      await loadCities();
      addToast(isEdit ? 'Cidade atualizada.' : 'Cidade criada.', 'success');
    } catch (err) {
      addToast(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Save topic ─────────────────────────────────────────────────────────────

  async function handleSaveTopic() {
    if (!topicModal) return;
    if (!topicModal.topic || !topicModal.seo.slug || !topicModal.seo.title) {
      addToast('Preencha: tema, slug e título', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const isEdit = Boolean(topicModal.id);
      const url = isEdit ? `/api/admin/topics/${topicModal.id}` : '/api/admin/topics';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicModal.topic,
          slug: topicModal.seo.slug,
          title: topicModal.seo.title,
          description: topicModal.seo.description || null,
          meta_title: topicModal.seo.meta_title || null,
          meta_description: topicModal.seo.meta_description || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTopicModal(null);
      await loadTopics();
      addToast(isEdit ? 'Tema atualizado.' : 'Tema criado.', 'success');
    } catch (err) {
      addToast(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTopic() {
    if (!deleteTopicModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/topics/${deleteTopicModal.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDeleteTopicModal(null);
      await loadTopics();
      addToast('Tema excluído.', 'success');
    } catch (err) {
      addToast(`Erro: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // handleDeleteCity removed (MELHORIA 6: cities cannot be deleted)

  // ── Render ────────────────────────────────────────────────────────────────

  const filtered = activeTab !== 'EVENTOS' && activeTab !== 'CATEGORIAS' && activeTab !== 'CIDADES' && activeTab !== 'TEMAS'
    ? submissions.filter(s => s.status === (activeTab as TabStatus))
    : [];

  // ── Event tab client-side filtering ───────────────────────────────────────
  const filteredEvents = events.filter(ev => {
    if (evFilters.search && !ev.title.toLowerCase().includes(evFilters.search.toLowerCase())) return false;
    if (evFilters.status && ev.status !== evFilters.status) return false;
    if (evFilters.city && ev.city !== evFilters.city) return false;
    if (evFilters.state && ev.state !== evFilters.state) return false;
    if (evFilters.topic && !ev.topics.includes(evFilters.topic)) return false;
    if (evFilters.category && ev.category !== evFilters.category) return false;
    if (evFilters.format && ev.format !== evFilters.format) return false;
    if (evFilters.dateFrom && new Date(ev.start_date) < new Date(evFilters.dateFrom)) return false;
    if (evFilters.dateTo && new Date(ev.start_date) > new Date(evFilters.dateTo)) return false;
    return true;
  });

  // ── City tab client-side filtering ────────────────────────────────────────
  const filteredCities = cities.filter(c => {
    if (cityFilters.search && !c.city.toLowerCase().includes(cityFilters.search.toLowerCase())) return false;
    if (cityFilters.state && c.state !== cityFilters.state) return false;
    return true;
  });

  // ── Unique values for event filter selects ────────────────────────────────
  const evCities = [...new Set(events.map(ev => ev.city))].sort();
  const evStates = [...new Set(events.map(ev => ev.state))].filter(Boolean).sort();

  const INPUT = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm text-white ${
              t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <span className="flex-1">{t.message}</span>
            {t.link && (
              <a
                href={t.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline whitespace-nowrap font-medium"
              >
                {t.link.label}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-xl font-semibold text-gray-900">Painel Administrativo</h1>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
              Sem autenticação
            </span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  activeTab === tab.value
                    ? tab.value === 'PENDENTE'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-red-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({counts[tab.value]})
              </button>
            ))}
            <button
              onClick={() => setActiveTab('EVENTOS')}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                activeTab === 'EVENTOS' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Eventos ({events.length || (activeTab === 'EVENTOS' ? events.length : '…')})
            </button>
            <button
              onClick={() => setActiveTab('CATEGORIAS')}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                activeTab === 'CATEGORIAS' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Categorias ({activeTab === 'CATEGORIAS' ? categories.length : '…'})
            </button>
            <button
              onClick={() => setActiveTab('CIDADES')}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                activeTab === 'CIDADES' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cidades ({activeTab === 'CIDADES' ? cities.length : '…'})
            </button>
            <button
              onClick={() => setActiveTab('TEMAS')}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                activeTab === 'TEMAS' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Temas ({activeTab === 'TEMAS' ? topicPages.length : '…'})
            </button>
            <button
              onClick={() => {
                if (activeTab === 'EVENTOS') loadEvents();
                else if (activeTab === 'CATEGORIAS') loadCategories();
                else if (activeTab === 'CIDADES') loadCities();
                else if (activeTab === 'TEMAS') loadTopics();
                else load();
              }}
              className="ml-auto text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              ↻ Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Events Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'EVENTOS' && (
          <>
            {/* Filter bar */}
            <div className="mb-4 bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  className={INPUT}
                  placeholder="Buscar por título..."
                  value={evFilters.search}
                  onChange={e => setEvFilters(f => ({ ...f, search: e.target.value }))}
                />
                <select className={INPUT} value={evFilters.status} onChange={e => setEvFilters(f => ({ ...f, status: e.target.value }))}>
                  <option value="">Todos os status</option>
                  <option value="PUBLICADO">Publicado</option>
                  <option value="RASCUNHO">Rascunho</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="ENCERRADO">Encerrado</option>
                </select>
                <select className={INPUT} value={evFilters.category} onChange={e => setEvFilters(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Todas as categorias</option>
                  {EVENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <select className={INPUT} value={evFilters.format} onChange={e => setEvFilters(f => ({ ...f, format: e.target.value }))}>
                  <option value="">Todos os formatos</option>
                  {EVENT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select className={INPUT} value={evFilters.city} onChange={e => setEvFilters(f => ({ ...f, city: e.target.value }))}>
                  <option value="">Todas as cidades</option>
                  {evCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className={INPUT} value={evFilters.state} onChange={e => setEvFilters(f => ({ ...f, state: e.target.value }))}>
                  <option value="">Todos os estados</option>
                  {evStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className={INPUT} value={evFilters.topic} onChange={e => setEvFilters(f => ({ ...f, topic: e.target.value }))}>
                  <option value="">Todos os temas</option>
                  {EVENT_TOPICS.map(t => <option key={t.slug} value={t.slug}>{t.emoji} {t.label}</option>)}
                </select>
                <button
                  onClick={() => setEvFilters({ search: '', status: '', city: '', state: '', topic: '', category: '', format: '', dateFrom: '', dateTo: '' })}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ✕ Limpar filtros
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">De</label>
                  <input type="date" className={INPUT} value={evFilters.dateFrom} onChange={e => setEvFilters(f => ({ ...f, dateFrom: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Até</label>
                  <input type="date" className={INPUT} value={evFilters.dateTo} onChange={e => setEvFilters(f => ({ ...f, dateTo: e.target.value }))} />
                </div>
              </div>
              <p className="text-xs text-gray-400">{filteredEvents.length} de {events.length} evento(s)</p>
            </div>

            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-24 animate-pulse" />)}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-lg font-medium">Nenhum evento encontrado</p>
                {events.length > 0 && <p className="text-sm mt-1">Tente ajustar os filtros.</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map(ev => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                  onEdit={() => setEventEditModal({
                    id: ev.id,
                    slug: ev.slug,
                    status: ev.status,
                    is_verified: ev.is_verified,
                    meta_title: ev.meta_title ?? ev.title,
                    meta_description: ev.meta_description ?? stripHtml(ev.description).slice(0, 160),
                    data: {
                      title: ev.title,
                      category: ev.category,
                      format: ev.format,
                      topics: ev.topics,
                      start_date: ev.start_date.slice(0, 10),
                      end_date: ev.end_date ? ev.end_date.slice(0, 10) : null,
                      start_time: ev.start_time,
                      end_time: ev.end_time,
                      venue_name: ev.venue_name,
                      address: ev.address,
                      city: ev.city,
                      state: ev.state,
                      latitude: ev.latitude,
                      longitude: ev.longitude,
                      is_free: ev.is_free,
                      price_info: ev.price_info,
                      ticket_url: ev.ticket_url,
                      description: ev.description,
                      event_url: ev.event_url,
                      image_url: ev.image_url,
                      organizer_name: ev.organizer_name,
                      organizer_url: ev.organizer_url,
                      source_url: ev.source_url,
                      is_organizer: null,
                      organizer_email: null,
                      submitter_email: null,
                      is_verified: ev.is_verified,
                    },
                  })}
                  onDelete={() => setDeleteModal({ id: ev.id, title: ev.title })}
                />
              ))}
            </div>
          )}
          </>
        )}

        {/* ── Categories Tab ─────────────────────────────────────────────── */}
        {activeTab === 'CATEGORIAS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Páginas de landing por categoria de evento (usadas para SEO programático).
              </p>
            </div>
            {categoriesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />)}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🏷️</p>
                <p className="text-lg font-medium">Nenhuma página de categoria</p>
                <p className="text-sm mt-1">Crie páginas para melhorar o SEO por categoria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map(cat => (
                  <CategoryCard
                    key={cat.id}
                    page={cat}
                    onEdit={() => setCategoryModal({
                      id: cat.id,
                      category: cat.category,
                      seo: {
                        slug: cat.slug,
                        title: cat.title,
                        description: cat.description ?? '',
                        meta_title: cat.meta_title ?? `${categoryLabel(cat.category)} de Marketing 2026`,
                        meta_description: cat.meta_description ?? `Encontre ${categoryLabel(cat.category).toLowerCase()} de marketing no Brasil. Veja a agenda completa e inscreva-se.`,
                      },
                    })}
                    onDelete={() => setDeleteCategoryModal({ id: cat.id, title: cat.title })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Cities Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'CIDADES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Páginas de landing por cidade (usadas para SEO programático).
              </p>
              <button
                onClick={() => setCityModal({ id: null, city: '', state: 'SP', seo: { ...EMPTY_SEO } })}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                + Nova Cidade
              </button>
            </div>
            {/* Filter bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    className={INPUT}
                    placeholder="Buscar por cidade..."
                    value={cityFilters.search}
                    onChange={e => setCityFilters(f => ({ ...f, search: e.target.value }))}
                  />
                </div>
                <select className={INPUT} value={cityFilters.state} onChange={e => setCityFilters(f => ({ ...f, state: e.target.value }))}>
                  <option value="">Todos os estados</option>
                  {BR_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">{filteredCities.length} de {cities.length} cidade(s)</p>
                <button
                  onClick={() => setCityFilters({ search: '', state: '' })}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ✕ Limpar
                </button>
              </div>
            </div>
            {citiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />)}
              </div>
            ) : filteredCities.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🏙️</p>
                <p className="text-lg font-medium">Nenhuma página de cidade</p>
                {cities.length > 0 ? <p className="text-sm mt-1">Tente ajustar os filtros.</p> : <p className="text-sm mt-1">Crie páginas para melhorar o SEO por cidade.</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCities.map(city => (
                  <CityCard
                    key={city.id}
                    page={city}
                    onEdit={() => setCityModal({
                      id: city.id,
                      city: city.city,
                      state: city.state,
                      seo: {
                        slug: city.slug,
                        title: city.title,
                        description: city.description ?? '',
                        meta_title: city.meta_title ?? `Eventos de Marketing em ${city.city} 2026`,
                        meta_description: city.meta_description ?? `Encontre eventos de marketing em ${city.city}, ${city.state}. Conferencias, workshops, meetups e webinars. Veja a agenda completa e inscreva-se.`,
                      },
                    })}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Topics Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'TEMAS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Páginas de landing por tema de marketing (ex: /eventos/seo, /eventos/growth).
              </p>
            </div>
            {topicsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />)}
              </div>
            ) : topicPages.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-lg font-medium">Nenhuma página de tema</p>
                <p className="text-sm mt-1">Crie páginas para melhorar o SEO por tema.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topicPages.map(tp => (
                  <TopicCard
                    key={tp.id}
                    page={tp}
                    onEdit={() => setTopicModal({
                      id: tp.id,
                      topic: tp.topic,
                      seo: {
                        slug: tp.slug,
                        title: tp.title,
                        description: tp.description ?? '',
                        meta_title: tp.meta_title ?? `${tp.title} 2026 - Conferencias, Workshops e Meetups`,
                        meta_description: tp.meta_description ?? `Encontre eventos de ${tp.title.replace(/^Eventos de /, '')} no Brasil. Conferencias, workshops e meetups. Veja a agenda completa e inscreva-se.`,
                      },
                    })}
                    onDelete={() => setDeleteTopicModal({ id: tp.id, title: tp.title })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Submissions Tab ───────────────────────────────────────────── */}
        {activeTab !== 'EVENTOS' && activeTab !== 'CATEGORIAS' && activeTab !== 'CIDADES' && activeTab !== 'TEMAS' && (
          loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-24 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">
                {activeTab === 'PENDENTE' ? '📭' : '❌'}
              </p>
              <p className="text-lg font-medium">
                Nenhuma submissão {activeTab === 'PENDENTE' ? 'pendente' : 'rejeitada'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(sub => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  expanded={expandedIds.has(sub.id)}
                  onToggle={() => toggleExpand(sub.id)}
                  onApprove={() => setApproveModal({
                    id: sub.id,
                    isVerified: sub.event_data.is_organizer === true,
                    notes: '',
                  })}
                  onReject={() => setRejectModal({ id: sub.id, reason: '' })}
                  onEdit={() => setEditModal({ id: sub.id, data: { ...sub.event_data } })}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Approve Modal ─────────────────────────────────────────────────────── */}
      {approveModal && (
        <Modal title="✅ Aprovar e Publicar" onClose={() => !submitting && setApproveModal(null)}>
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 text-lg">✅</span>
              <p className="text-sm text-green-800">O evento será criado e publicado imediatamente no site.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={approveModal.isVerified}
                onChange={e => setApproveModal(prev => prev ? { ...prev, isVerified: e.target.checked } : prev)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-green-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Marcar como verificado ✅</p>
                <p className="text-xs text-gray-500 mt-0.5">Exibe o selo de verificado no evento.</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas internas <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                className={`${INPUT} min-h-20 resize-none`}
                placeholder="Observações sobre a aprovação..."
                value={approveModal.notes}
                onChange={e => setApproveModal(prev => prev ? { ...prev, notes: e.target.value } : prev)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleApprove} disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Publicando…' : 'Confirmar e Publicar'}
              </button>
              <button onClick={() => !submitting && setApproveModal(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Reject Modal ──────────────────────────────────────────────────────── */}
      {rejectModal && (
        <Modal title="❌ Rejeitar Submissão" onClose={() => !submitting && setRejectModal(null)}>
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-600 text-lg">⚠️</span>
              <p className="text-sm text-red-800">A submissão será marcada como rejeitada e o motivo ficará registrado.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo da rejeição <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`${INPUT} min-h-24 resize-none`}
                placeholder="Ex: Informações incompletas, evento duplicado, data incorreta..."
                value={rejectModal.reason}
                onChange={e => setRejectModal(prev => prev ? { ...prev, reason: e.target.value } : prev)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleReject} disabled={submitting || !rejectModal.reason.trim()}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Rejeitando…' : 'Confirmar Rejeição'}
              </button>
              <button onClick={() => !submitting && setRejectModal(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal (submission) ────────────────────────────────────────────── */}
      {editModal && (
        <Modal title="✏️ Editar Submissão" onClose={() => !submitting && setEditModal(null)}>
          <div className="space-y-5">
            <EditForm
              data={editModal.data}
              onChange={data => setEditModal(prev => prev ? { ...prev, data } : prev)}
              cities={cities}
            />

            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <button onClick={handleSaveAndApprove} disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Salvando…' : '✅ Salvar e ir para Aprovação'}
              </button>
              <button onClick={handleSaveEdit} disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Salvando…' : '💾 Salvar apenas'}
              </button>
              <button onClick={() => !submitting && setEditModal(null)}
                className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Event Edit Modal ───────────────────────────────────────────────────── */}
      {eventEditModal && (
        <Modal title="✏️ Editar Evento" onClose={() => !submitting && setEventEditModal(null)} wide>
          <div className="space-y-5">
            {/* Status + Verified */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className={INPUT}
                  value={eventEditModal.status}
                  onChange={e => setEventEditModal(prev => prev ? { ...prev, status: e.target.value } : prev)}
                >
                  <option value="PUBLICADO">Publicado</option>
                  <option value="RASCUNHO">Rascunho</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="ENCERRADO">Encerrado</option>
                </select>
              </div>
              <div className="flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventEditModal.is_verified}
                    onChange={e => setEventEditModal(prev => prev ? { ...prev, is_verified: e.target.checked } : prev)}
                    className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Verificado ✅</span>
                </label>
              </div>
            </div>

            {/* SEO & Slug */}
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-indigo-500">SEO & URL</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">/evento/</span>
                  <input
                    className="w-full rounded-lg border border-gray-300 pl-16 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    value={eventEditModal.slug}
                    onChange={e => setEventEditModal(prev => prev ? { ...prev, slug: e.target.value } : prev)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  className={INPUT}
                  value={eventEditModal.meta_title}
                  onChange={e => setEventEditModal(prev => prev ? { ...prev, meta_title: e.target.value } : prev)}
                  placeholder="Título para mecanismos de busca"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  className={`${INPUT} min-h-16 resize-none`}
                  value={eventEditModal.meta_description}
                  onChange={e => setEventEditModal(prev => prev ? { ...prev, meta_description: e.target.value } : prev)}
                  placeholder="Descrição para mecanismos de busca (≤160 caracteres)"
                />
                {eventEditModal.meta_description.length > 0 && (
                  <p className={`text-xs mt-1 ${eventEditModal.meta_description.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                    {eventEditModal.meta_description.length}/160 caracteres
                  </p>
                )}
              </div>
            </div>

            <EditForm
              data={eventEditModal.data}
              onChange={data => setEventEditModal(prev => prev ? { ...prev, data } : prev)}
              cities={cities}
            />

            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <button onClick={handleSaveEventEdit} disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Salvando…' : '💾 Salvar alterações'}
              </button>
              <button onClick={() => !submitting && setEventEditModal(null)}
                className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Event Modal ─────────────────────────────────────────────────── */}
      {deleteModal && (
        <Modal title="🗑️ Excluir Evento" onClose={() => !submitting && setDeleteModal(null)}>
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-600 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-800">Esta ação é irreversível.</p>
                <p className="text-sm text-red-700 mt-1">
                  O evento <strong>&quot;{deleteModal.title}&quot;</strong> será permanentemente removido.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleDeleteEvent} disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Excluindo…' : 'Confirmar Exclusão'}
              </button>
              <button onClick={() => !submitting && setDeleteModal(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Category Create/Edit Modal ─────────────────────────────────────────── */}
      {categoryModal && (
        <Modal
          title={categoryModal.id ? '✏️ Editar Categoria' : '➕ Nova Página de Categoria'}
          onClose={() => !submitting && setCategoryModal(null)}
        >
          <div className="space-y-5">
            {!categoryModal.id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  className={INPUT}
                  value={categoryModal.category}
                  onChange={e => {
                    const cat = e.target.value;
                    const autoSlug = slugify(EVENT_CATEGORIES.find(c => c.value === cat)?.label ?? cat);
                    setCategoryModal(prev => prev
                      ? { ...prev, category: cat, seo: { ...prev.seo, slug: autoSlug } }
                      : prev
                    );
                  }}
                >
                  {EVENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            )}
            {categoryModal.id && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                Categoria: <strong>{categoryLabel(categoryModal.category)}</strong>
              </div>
            )}

            <SeoForm
              data={categoryModal.seo}
              onChange={seo => setCategoryModal(prev => prev ? { ...prev, seo } : prev)}
              slugReadonly={Boolean(categoryModal.id)}
            />

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button onClick={handleSaveCategory} disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Salvando…' : categoryModal.id ? '💾 Salvar' : '➕ Criar'}
              </button>
              <button onClick={() => !submitting && setCategoryModal(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Category Modal ──────────────────────────────────────────────── */}
      {deleteCategoryModal && (
        <Modal title="🗑️ Excluir Categoria" onClose={() => !submitting && setDeleteCategoryModal(null)}>
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-600 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-800">Esta ação é irreversível.</p>
                <p className="text-sm text-red-700 mt-1">
                  A página <strong>&quot;{deleteCategoryModal.title}&quot;</strong> será removida.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleDeleteCategory} disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Excluindo…' : 'Confirmar Exclusão'}
              </button>
              <button onClick={() => !submitting && setDeleteCategoryModal(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── City Create/Edit Modal ─────────────────────────────────────────────── */}
      {cityModal && (
        <Modal
          title={cityModal.id ? '✏️ Editar Cidade' : '➕ Nova Página de Cidade'}
          onClose={() => !submitting && setCityModal(null)}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  className={INPUT}
                  value={cityModal.city}
                  readOnly={Boolean(cityModal.id)}
                  onChange={e => {
                    const city = e.target.value;
                    const autoSlug = slugify(`${city} ${cityModal.state}`);
                    setCityModal(prev => prev
                      ? { ...prev, city, seo: { ...prev.seo, slug: autoSlug } }
                      : prev
                    );
                  }}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                <select
                  className={INPUT}
                  value={cityModal.state}
                  disabled={Boolean(cityModal.id)}
                  onChange={e => {
                    const state = e.target.value;
                    const autoSlug = slugify(`${cityModal.city} ${state}`);
                    setCityModal(prev => prev
                      ? { ...prev, state, seo: { ...prev.seo, slug: autoSlug } }
                      : prev
                    );
                  }}
                >
                  {BR_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <SeoForm
              data={cityModal.seo}
              onChange={seo => setCityModal(prev => prev ? { ...prev, seo } : prev)}
              slugReadonly={Boolean(cityModal.id)}
            />

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button onClick={handleSaveCity} disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Salvando…' : cityModal.id ? '💾 Salvar' : '➕ Criar'}
              </button>
              <button onClick={() => !submitting && setCityModal(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Topic Create/Edit Modal ───────────────────────────────────────────── */}
      {topicModal && (
        <Modal
          title={topicModal.id ? '✏️ Editar Tema' : '➕ Novo Tema'}
          onClose={() => !submitting && setTopicModal(null)}
        >
          <div className="space-y-5">
            {!topicModal.id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
                <select
                  className={INPUT}
                  value={topicModal.topic}
                  onChange={e => {
                    const topic = e.target.value;
                    const topicData = EVENT_TOPICS.find(t => t.slug === topic);
                    setCityModal(null);
                    setTopicModal(prev => prev
                      ? { ...prev, topic, seo: { ...prev.seo, slug: topic, title: topicData ? `Eventos de ${topicData.label} - Marketing` : prev.seo.title } }
                      : prev
                    );
                  }}
                >
                  {EVENT_TOPICS.map(t => (
                    <option key={t.slug} value={t.slug}>{t.emoji} {t.label}</option>
                  ))}
                </select>
              </div>
            )}
            {topicModal.id && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                Tema: <strong>{EVENT_TOPICS.find(t => t.slug === topicModal.topic)?.emoji} {EVENT_TOPICS.find(t => t.slug === topicModal.topic)?.label ?? topicModal.topic}</strong>
              </div>
            )}

            <SeoForm
              data={topicModal.seo}
              onChange={seo => setTopicModal(prev => prev ? { ...prev, seo } : prev)}
              slugReadonly={Boolean(topicModal.id)}
            />

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button onClick={handleSaveTopic} disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-60 transition-colors">
                {submitting ? 'Salvando…' : topicModal.id ? '💾 Salvar' : '➕ Criar'}
              </button>
              <button onClick={() => !submitting && setTopicModal(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Topic Modal ─────────────────────────────────────────────────── */}
      {deleteTopicModal && (
        <Modal title="🗑️ Excluir Tema" onClose={() => !submitting && setDeleteTopicModal(null)}>
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-600 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-800">Esta ação é irreversível.</p>
                <p className="text-sm text-red-700 mt-1">
                  A página <strong>&quot;{deleteTopicModal.title}&quot;</strong> será removida.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleDeleteTopic} disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Excluindo…' : 'Confirmar Exclusão'}
              </button>
              <button onClick={() => !submitting && setDeleteTopicModal(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete City Modal removed — cities cannot be deleted (MELHORIA 6) */}
    </div>
  );
}
