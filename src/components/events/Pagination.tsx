'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';

export default function Pagination({ totalPages, currentPage }: { totalPages: number; currentPage: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildPageUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('pagina');
    } else {
      params.set('pagina', String(page));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (totalPages <= 1) return null;

  // Build page numbers to show
  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const prevUrl = buildPageUrl(currentPage - 1);
  const nextUrl = buildPageUrl(currentPage + 1);

  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-1">
      {currentPage <= 1 ? (
        <span className="cursor-not-allowed rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-text-secondary opacity-40">
          Anterior
        </span>
      ) : (
        <Link
          href={prevUrl}
          className="rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-100"
        >
          Anterior
        </Link>
      )}

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-text-secondary">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={buildPageUrl(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`min-w-[36px] rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-gray-100'
            }`}
          >
            {page}
          </Link>
        ),
      )}

      {currentPage >= totalPages ? (
        <span className="cursor-not-allowed rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-text-secondary opacity-40">
          Próximo
        </span>
      ) : (
        <Link
          href={nextUrl}
          className="rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-100"
        >
          Próximo
        </Link>
      )}
    </nav>
  );
}
