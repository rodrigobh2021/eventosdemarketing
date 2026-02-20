'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useCallback, useEffect, useRef } from 'react';
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
    <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {pills.map((pill) => (
        <button
          key={pill.value}
          type="button"
          onClick={() => handleClick(pill.value)}
          className={`shrink-0 whitespace-nowrap rounded-[var(--radius-pill)] px-3 py-2 text-sm font-medium transition-colors ${
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

// ─── City Search Input ────────────────────────────────────────────────

type CityResult = { slug: string; city: string; state: string };

function CitySearchInput({ onSelect }: { onSelect: (slug: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cities/search?q=${encodeURIComponent(query)}`);
        const data: CityResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative mb-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar cidade..."
        className="w-full rounded-[var(--radius-btn)] border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-[var(--radius-btn)] border border-gray-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-sm text-text-secondary">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-text-secondary">Nenhuma cidade encontrada</p>
          ) : (
            results.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => {
                  onSelect(c.slug);
                  setQuery('');
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-text hover:bg-gray-50"
              >
                {c.city} ({c.state})
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1"
      >
        <span className="text-sm font-semibold text-text">{title}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="pt-2">{children}</div>
        </div>
      </div>
    </div>
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
  const [showAllCities, setShowAllCities] = useState(false);

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

      {/* City — open by default */}
      <FilterSection title="Cidade" defaultOpen={true}>
        <CitySearchInput onSelect={handleCityChange} />
        <div className="space-y-2">
          {(showAllCities ? MAIN_CITIES : MAIN_CITIES.slice(0, 5)).map((c) => (
            <label key={c.slug} className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={cidadeValue === c.slug}
                onChange={(e) => handleCityChange(e.target.checked ? c.slug : '')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
              />
              {c.name} ({c.state})
            </label>
          ))}
        </div>
        {MAIN_CITIES.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllCities(!showAllCities)}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            {showAllCities ? 'Ver menos' : `Ver todas (${MAIN_CITIES.length})`}
          </button>
        )}
      </FilterSection>

      {/* Category — open by default, hidden when locked in URL path */}
      {!hideCategoria && (
        <FilterSection title="Categoria" defaultOpen={true}>
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
        </FilterSection>
      )}

      {/* Format — closed by default */}
      <FilterSection title="Formato" defaultOpen={false}>
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
      </FilterSection>

      {/* Topics — closed by default, hidden when locked in URL path */}
      {!hideTema && (
        <FilterSection title="Tema" defaultOpen={false}>
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
        </FilterSection>
      )}

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
  const pathname = usePathname();
  const router = useRouter();

  const filterCount = [
    searchParams.get('tema'),
    searchParams.get('categoria'),
    searchParams.get('formato'),
    searchParams.get('gratuito'),
    searchParams.get('data_inicio'),
    searchParams.get('data_fim'),
  ].filter(Boolean).length;

  function handleClear() {
    router.push(pathname, { scroll: false });
    setOpen(false);
  }

  return (
    <>
      {/* Fixed bottom button — mobile only, hidden while drawer is open */}
      <div className={`fixed bottom-4 left-0 right-0 z-[9999] flex justify-center transition-opacity duration-200 md:hidden ${open ? 'pointer-events-none opacity-0' : ''}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-7 py-3.5 text-sm font-bold text-white shadow-xl transition-opacity hover:opacity-90"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          {filterCount > 0 ? `Filtrar (${filterCount})` : 'Filtrar'}
        </button>
      </div>

      {/* Bottom-up drawer with smooth animation */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

        {/* Panel — slides up from bottom */}
        <div
          className={`absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-text">
              Filtros{filterCount > 0 ? ` (${filterCount})` : ''}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-text-secondary hover:bg-gray-100"
              aria-label="Fechar filtros"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <EventFilters
              currentTema={currentTema}
              currentCategoria={currentCategoria}
              currentCidade={currentCidade}
            />
          </div>

          {/* Footer */}
          <div className="flex shrink-0 gap-3 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 rounded-[var(--radius-btn)] border border-gray-200 py-3 text-sm font-medium text-text transition-colors hover:bg-gray-50"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-[2] rounded-[var(--radius-btn)] bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
