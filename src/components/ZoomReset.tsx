'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ZoomReset() {
  const pathname = usePathname();

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return;

    const original = viewport.getAttribute('content') ?? '';
    viewport.setAttribute('content', original + ', maximum-scale=1');

    const timer = setTimeout(() => {
      viewport.setAttribute('content', original);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
