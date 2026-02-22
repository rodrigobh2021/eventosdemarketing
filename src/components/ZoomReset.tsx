'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ZoomReset() {
  const pathname = usePathname();

  useEffect(() => {
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!viewport) return;

    // Only reset if the browser reports an active zoom level (visualViewport API).
    // Falls back to always resetting on browsers that don't support visualViewport.
    const vv = (window as Window & typeof globalThis & { visualViewport?: { scale: number } })
      .visualViewport;
    if (vv && vv.scale <= 1.01) return;

    const original = viewport.content;

    // Force the browser to snap back to 1× zoom.
    // Setting initial-scale=1 alongside minimum/maximum-scale=1 is what
    // actually triggers iOS Safari to reset an existing pinch-zoom level.
    viewport.content =
      'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1';

    // 300 ms gives iOS Safari time to process the viewport change before
    // we restore the original constraints (so the user can zoom again).
    const timer = setTimeout(() => {
      viewport.content = original;
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
