'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function ZoomReset() {
  const pathname = usePathname();
  // Skip the very first mount — no navigation happened yet
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const vv = (window as Window & typeof globalThis & { visualViewport?: { scale: number } })
      .visualViewport;

    // Only reload if the user is actually zoomed in (scale > 1)
    if (vv && vv.scale > 1.01) {
      window.location.reload();
    }
  }, [pathname]);

  return null;
}
