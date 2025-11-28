'use client';

import { useEffect } from 'react';
import { useWebVitals } from '@/lib/hooks/use-web-vitals';

/**
 * Web Vitals Reporter Component
 * Monitors and reports Core Web Vitals metrics
 */
export function WebVitalsReporter() {
  // Enable Web Vitals monitoring
  useWebVitals(true);

  return null; // This component doesn't render anything
}
