/**
 * Web Vitals monitoring hook
 * Tracks Core Web Vitals metrics for performance monitoring
 */

import { useEffect } from 'react';

export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

/**
 * Performance budgets for Core Web Vitals
 * Based on Google's recommendations
 */
export const PERFORMANCE_BUDGETS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // First Input Delay (FID)
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  // Interaction to Next Paint (INP)
  INP: {
    good: 200,
    needsImprovement: 500,
  },
};

/**
 * Get rating for a metric value
 */
function getRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const budget = PERFORMANCE_BUDGETS[name as keyof typeof PERFORMANCE_BUDGETS];
  
  if (!budget) return 'good';
  
  if (value <= budget.good) return 'good';
  if (value <= budget.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: WebVitalsMetric) {
  // In production, send to your analytics service
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric);
  }
  
  // Example: Send to custom analytics endpoint
  if (typeof window !== 'undefined' && navigator.sendBeacon) {
    const body = JSON.stringify(metric);
    navigator.sendBeacon('/api/analytics/vitals', body);
  }
}

/**
 * Hook to monitor Web Vitals
 */
export function useWebVitals(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Dynamically import web-vitals to avoid SSR issues
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const handleMetric = (metric: any) => {
        const webVitalsMetric: WebVitalsMetric = {
          id: metric.id,
          name: metric.name,
          value: metric.value,
          rating: getRating(metric.name, metric.value),
          delta: metric.delta,
          navigationType: metric.navigationType || 'navigate',
        };
        
        sendToAnalytics(webVitalsMetric);
      };

      // Monitor all Core Web Vitals
      // Note: FID has been deprecated in favor of INP
      onCLS(handleMetric);
      onFCP(handleMetric);
      onLCP(handleMetric);
      onTTFB(handleMetric);
      onINP(handleMetric);
    });
  }, [enabled]);
}

/**
 * Check if performance budgets are met
 */
export function checkPerformanceBudgets(metrics: Record<string, number>): {
  passed: boolean;
  results: Record<string, { value: number; budget: number; passed: boolean; rating: string }>;
} {
  const results: Record<string, any> = {};
  let allPassed = true;

  for (const [name, value] of Object.entries(metrics)) {
    const budget = PERFORMANCE_BUDGETS[name as keyof typeof PERFORMANCE_BUDGETS];
    
    if (budget) {
      const rating = getRating(name, value);
      const passed = rating === 'good';
      
      results[name] = {
        value,
        budget: budget.good,
        passed,
        rating,
      };
      
      if (!passed) {
        allPassed = false;
      }
    }
  }

  return {
    passed: allPassed,
    results,
  };
}

/**
 * Get performance marks and measures
 */
export function getPerformanceMarks(): PerformanceMark[] {
  if (typeof window === 'undefined') return [];
  
  return performance.getEntriesByType('mark') as PerformanceMark[];
}

/**
 * Get performance measures
 */
export function getPerformanceMeasures(): PerformanceMeasure[] {
  if (typeof window === 'undefined') return [];
  
  return performance.getEntriesByType('measure') as PerformanceMeasure[];
}

/**
 * Create a performance mark
 */
export function mark(name: string): void {
  if (typeof window === 'undefined') return;
  
  performance.mark(name);
}

/**
 * Measure time between two marks
 */
export function measure(name: string, startMark: string, endMark?: string): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    if (endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name, startMark);
    }
    
    const measures = performance.getEntriesByName(name, 'measure');
    return measures.length > 0 ? measures[measures.length - 1].duration : 0;
  } catch (error) {
    console.error('Error measuring performance:', error);
    return 0;
  }
}

/**
 * Clear performance marks and measures
 */
export function clearPerformance(): void {
  if (typeof window === 'undefined') return;
  
  performance.clearMarks();
  performance.clearMeasures();
}
