'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[Polaris PWA] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[Polaris PWA] Service Worker registration failed:', err);
        });
    }
  }, []);

  return null;
}
