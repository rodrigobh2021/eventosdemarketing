'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ZoomReset() {
  const pathname = usePathname();

  useEffect(() => {
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!viewport) return;

    const original = viewport.content;

    // Force the browser to snap back to 1× zoom.
    // Setting initial-scale=1 alongside minimum/maximum-scale=1 is what
    // actually triggers iOS Safari to reset an existing pinch-zoom level.
    // Only adding maximum-scale=1 is NOT enough — the scale must be re-anchored.
    viewport.content =
      'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1';

    const timer = setTimeout(() => {
      // Restore original constraints so the user can zoom again freely
      viewport.content = original;
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
