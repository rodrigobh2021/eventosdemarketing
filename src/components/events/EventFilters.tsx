'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useCallback } from 'react';
import {
  EVENT_CATEGORIES,
  EVENT_FORMATS,
  EVENT_TOPICS,
  MAIN_CITIES,
} from '@/lib/constants';
import { buildEventUrl, categoryEnumToSlug } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────

type FilterProps = {
  /** Topic slug locked by URL path (e.g. on /eventos/seo) */
  currentTema?: string;
  /** Category plural slug locked by URL path (e.g. "cursos") */
  currentCategoria?: string;
  /** City slug locked by URL path (e.g. on /eventos-marketing-sao-paulo) */
  currentCidade?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────

function useFilterUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      if (key !== 'pagina') params.delete('pagina');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );
}

/** Build a query string from current params, removing structural keys (tema/categoria/cidade/pagina). */
function buildSecondaryParams(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete('tema');
  params.delete('categoria');
  params.delete('cidade');
  params.delete('pagina');
  return params.toString();
}

// ─── Date Pills ───────────────────────────────────────────────────────

export function EventDatePills() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const hasDateRange = searchParams.has('data_inicio') || searchParams.has('data_fim');
  const active = hasDateRange ? '---' : (searchParams.get('periodo') ?? '');

  const pills = [
    { value: '', label: 'Todos' },
    { value: 'hoje', label: 'Hoje' },
    { value: 'semana', label: 'Esta semana' },
    { value: 'mes', label: 'Este mês' },
  ];

  const handleClick = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('periodo', value);
      } else {
        params.delete('periodo');
      }
      params.delete('data_inicio');
      params.delete('data_fim');
      params.delete('pagina');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex gap-2">
      {pills.map((pill) => (
        <button
          key={pill.value}
          type="button"
          onClick={() => handleClick(pill.value)}
          className={`rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition-colors ${
            active === pill.value
              ? 'bg-primary text-white'
              : 'border border-gray-200 bg-white text-text hover:border-primary hover:text-primary'
          }`}
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}

// ─── Sort Select ──────────────────────────────────────────────────────

export function SortSelect() {
  const searchParams = useSearchParams();
  const update = useFilterUpdater();
  const active = searchParams.get('ordem') ?? '';

  return (
    <select
      value={active}
      onChange={(e) => update('ordem', e.target.value || null)}
      className="rounded-[var(--radius-btn)] border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
    >
      <option value="">Data (mais próximos)</option>
      <option value="recentes">Adicionados recentemente</option>
      <option value="nome">Nome (A-Z)</option>
    </select>
  );
}

// ─── Sidebar Filters ──────────────────────────────────────────────────

const INITIAL_TOPICS_SHOWN = 6;

export default function EventFilters({
  currentTema,
  currentCategoria,
  currentCidade,
}: FilterProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const update = useFilterUpdater();
  const [showAllTopics, setShowAllTopics] = useState(false);

  // Read secondary filters from query params
  const temas = searchParams.get('tema')?.split(',').filter(Boolean) ?? [];
  const categorias = searchParams.get('categoria')?.split(',').filter(Boolean) ?? [];
  const formato = searchParams.get('formato') ?? '';
  const gratuito = searchParams.get('gratuito') === 'true';
  const dataInicio = searchParams.get('data_inicio') ?? '';
  const dataFim = searchParams.get('data_fim') ?? '';

  const hideTema = Boolean(currentTema);
  const hideCategoria = Boolean(currentCategoria);
  const cidadeValue = currentCidade ?? '';

  const hasFilters =
    temas.length > 0 ||
    categorias.length > 0 ||
    formato ||
    gratuito ||
    dataInicio ||
    dataFim;

  const visibleTopics = showAllTopics
    ? EVENT_TOPICS
    : EVENT_TOPICS.slice(0, INITIAL_TOPICS_SHOWN);

  // ── Smart city navigation ───────────────────────────────────────────
  const handleCityChange = useCallback(
    (newCitySlug: string) => {
      const sp = new URLSearchParams(searchParams.toString());

      // Determine active topic: from URL path, or single QP topic → promote
      let activeTema = currentTema;
      if (!activeTema) {
        const temaQP = sp.get('tema');
        if (temaQP) {
          const topics = temaQP.split(',').filter(Boolean);
          if (topics.length === 1) {
            activeTema = topics[0];
            sp.delete('tema');
          }
        }
      }

      sp.delete('cidade');
      sp.delete('categoria');
      sp.delete('pagina');
      const url = buildEventUrl({
        tema: activeTema,
        categoria: currentCategoria || undefined,
        cidade: newCitySlug || undefined,
      });
      const qs = sp.toString();
      router.push(qs ? `${url}?${qs}` : url, { scroll: false });
    },
    [router, searchParams, currentTema, currentCategoria],
  );

  // ── Smart topic navigation ──────────────────────────────────────────
  const handleTopicChange = useCallback(
    (topicSlug: string, checked: boolean) => {
      if (!checked) return; // Unchecking navigates nowhere specific

      const qs = buildSecondaryParams(new URLSearchParams(searchParams.toString()));
      const url = buildEventUrl({
        tema: topicSlug,
        categoria: currentCategoria || undefined,
        cidade: currentCidade || undefined,
      });
      router.push(qs ? `${url}?${qs}` : url, { scroll: false });
    },
    [router, searchParams, currentCidade, currentCategoria],
  );

  // ── Smart category navigation ────────────────────────────────────────
  const handleCategoryChange = useCallback(
    (catEnum: string, checked: boolean) => {
      if (!checked) return;

      const catSlug = categoryEnumToSlug(catEnum);
      if (!catSlug) return;

      const qs = buildSecondaryParams(new URLSearchParams(searchParams.toString()));
      const url = buildEventUrl({
        tema: currentTema || undefined,
        categoria: catSlug,
        cidade: currentCidade || undefined,
      });
      router.push(qs ? `${url}?${qs}` : url, { scroll: false });
    },
    [router, searchParams, currentTema, currentCidade],
  );

  // ── Date range handler ──────────────────────────────────────────────
  const handleDateChange = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('periodo');
      params.delete('pagina');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="space-y-6">
      {/* Clear all */}
      {hasFilters && (
        <a
          href={pathname}
          className="text-sm font-medium text-primary hover:underline"
        >
          Limpar todos os filtros
        </a>
      )}

      {/* City — always visible */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-text">Cidade</legend>
        <select
          value={cidadeValue}
          onChange={(e) => handleCityChange(e.target.value)}
          className="w-full rounded-[var(--radius-btn)] border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="">Todas as cidades</option>
          {MAIN_CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.state})
            </option>
          ))}
        </select>
      </fieldset>

      {/* Topics — hidden when tema is locked in URL path */}
      {!hideTema && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-text">Tema</legend>
          <div className="space-y-2">
            {visibleTopics.map((topic) => (
              <label key={topic.slug} className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={temas.includes(topic.slug)}
                  onChange={(e) => handleTopicChange(topic.slug, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                />
                <span>{topic.emoji}</span>
                {topic.label}
              </label>
            ))}
          </div>
          {EVENT_TOPICS.length > INITIAL_TOPICS_SHOWN && (
            <button
              type="button"
              onClick={() => setShowAllTopics(!showAllTopics)}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              {showAllTopics ? 'Ver menos' : `Ver todos (${EVENT_TOPICS.length})`}
            </button>
          )}
        </fieldset>
      )}

      {/* Category — hidden when categoria is locked in URL path */}
      {!hideCategoria && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-text">Categoria</legend>
          <div className="space-y-2">
            {EVENT_CATEGORIES.map((cat) => (
              <label key={cat.value} className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={categorias.includes(cat.value)}
                  onChange={(e) => handleCategoryChange(cat.value, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                />
                {cat.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Format */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-text">Formato</legend>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="radio"
              name="formato"
              checked={formato === ''}
              onChange={() => update('formato', null)}
              className="h-4 w-4 border-gray-300 text-primary focus:ring-primary/20"
            />
            Todos
          </label>
          {EVENT_FORMATS.map((fmt) => (
            <label key={fmt.value} className="flex items-center gap-2 text-sm text-text">
              <input
                type="radio"
                name="formato"
                checked={formato === fmt.value}
                onChange={() => update('formato', fmt.value)}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary/20"
              />
              {fmt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Free only */}
      <fieldset>
        <legend className="sr-only">Preco</legend>
        <label className="flex items-center gap-3 text-sm text-text">
          <button
            type="button"
            role="switch"
            aria-checked={gratuito}
            onClick={() => update('gratuito', gratuito ? null : 'true')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              gratuito ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                gratuito ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          Apenas eventos gratuitos
        </label>
      </fieldset>

      {/* Date range */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-text">Periodo especifico</legend>
        <div className="space-y-2">
          <label className="block text-xs text-text-secondary">
            De
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => handleDateChange('data_inicio', e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </label>
          <label className="block text-xs text-text-secondary">
            Ate
            <input
              type="date"
              value={dataFim}
              onChange={(e) => handleDateChange('data_fim', e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </label>
        </div>
      </fieldset>
    </div>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────

export function MobileFilterDrawer({
  currentTema,
  currentCategoria,
  currentCidade,
}: FilterProps) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  const filterCount = [
    searchParams.get('tema'),
    searchParams.get('categoria'),
    searchParams.get('formato'),
    searchParams.get('gratuito'),
    searchParams.get('data_inicio'),
    searchParams.get('data_fim'),
  ].filter(Boolean).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-text lg:hidden"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
          />
        </svg>
        Filtros
        {filterCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
            {filterCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">Filtros</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-btn)] p-1 text-text-secondary hover:bg-gray-100"
                aria-label="Fechar filtros"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <EventFilters currentTema={currentTema} currentCategoria={currentCategoria} currentCidade={currentCidade} />
          </div>
        </div>
      )}
    </>
  );
}
