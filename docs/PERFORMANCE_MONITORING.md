# Performance Monitoring

This document describes the performance monitoring system implemented in the Unigram application.

## Overview

The application uses a comprehensive performance monitoring system that tracks:

1. **Server-side performance** - Database query timing and slow query detection
2. **Client-side performance** - Core Web Vitals and user experience metrics
3. **Performance budgets** - Automated checks against performance targets
4. **Real-time monitoring** - Continuous tracking of application performance

## Server-Side Monitoring

### Query Performance Tracking

Location: `lib/monitoring/performance.ts`

All database queries are automatically tracked with timing information.

**Features:**
- Query execution time measurement
- Slow query detection and logging
- Query success/failure tracking
- Automatic metric collection

**Usage:**
```typescript
import { measureQuery } from '@/lib/monitoring/performance';

const data = await measureQuery(
  'fetch-user-channels',
  async () => {
    return await supabase
      .from('channels')
      .select('*')
      .eq('user_id', userId);
  },
  { userId } // Additional metadata
);
```

**Configuration:**
- `SLOW_QUERY_THRESHOLD`: Threshold for slow query detection (default: 500ms)
- `ENABLE_METRICS`: Enable/disable metrics collection (default: true)

### Performance Metrics API

Endpoint: `/api/performance/metrics`

Returns collected performance metrics for monitoring dashboards.

**Query Parameters:**
- `type=all` - All metrics (default)
- `type=queries` - Query metrics only
- `type=operations` - Operation metrics only
- `type=slow` - Slow queries only
- `type=stats` - Query statistics only

**Response:**
```json
{
  "stats": {
    "total": 150,
    "successful": 148,
    "failed": 2,
    "averageDuration": 125.5,
    "slowQueries": 3
  },
  "slowQueries": [
    {
      "query": "fetch-forum-posts",
      "duration": 650,
      "timestamp": "2024-01-15T10:30:00Z",
      "success": true
    }
  ]
}
```

## Client-Side Monitoring

### Core Web Vitals

Location: `lib/hooks/use-web-vitals.ts`

Tracks Google's Core Web Vitals metrics:

- **LCP (Largest Contentful Paint)**: Loading performance
- **FID (First Input Delay)**: Interactivity
- **CLS (Cumulative Layout Shift)**: Visual stability
- **FCP (First Contentful Paint)**: Initial render
- **TTFB (Time to First Byte)**: Server response time
- **INP (Interaction to Next Paint)**: Responsiveness

**Integration:**
```typescript
import { useWebVitals } from '@/lib/hooks/use-web-vitals';

function MyComponent() {
  useWebVitals(true); // Enable monitoring
  
  return <div>My Component</div>;
}
```

The `WebVitalsReporter` component is automatically included in the root layout.

### Performance Budgets

Performance budgets are defined based on Google's recommendations:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| FID | ≤ 100ms | ≤ 300ms | > 300ms |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| FCP | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| TTFB | ≤ 800ms | ≤ 1.8s | > 1.8s |
| INP | ≤ 200ms | ≤ 500ms | > 500ms |

**Checking Budgets:**
```typescript
import { checkPerformanceBudgets } from '@/lib/hooks/use-web-vitals';

const metrics = {
  LCP: 2300,
  FID: 85,
  CLS: 0.08,
};

const { passed, results } = checkPerformanceBudgets(metrics);

if (!passed) {
  console.warn('Performance budgets not met:', results);
}
```

## Performance Marks and Measures

Use the Performance API to measure specific operations:

```typescript
import { mark, measure } from '@/lib/hooks/use-web-vitals';

// Mark the start of an operation
mark('data-fetch-start');

// ... perform operation ...

// Mark the end
mark('data-fetch-end');

// Measure the duration
const duration = measure('data-fetch', 'data-fetch-start', 'data-fetch-end');
console.log(`Data fetch took ${duration}ms`);
```

## Monitoring Dashboard

### Accessing Metrics

**Development:**
- Metrics are logged to the browser console
- Server metrics available at `/api/performance/metrics`

**Production:**
- Integrate with monitoring service (e.g., Datadog, New Relic)
- Set up alerts for performance degradation
- Create dashboards for real-time monitoring

### Key Metrics to Monitor

1. **Query Performance**
   - Average query duration
   - Slow query count
   - Query failure rate

2. **Page Load Performance**
   - LCP (target: < 2.5s)
   - FCP (target: < 1.8s)
   - TTFB (target: < 800ms)

3. **Interactivity**
   - FID (target: < 100ms)
   - INP (target: < 200ms)

4. **Visual Stability**
   - CLS (target: < 0.1)

## Performance Optimization Tips

### Server-Side

1. **Optimize Queries**
   - Use explicit column selection
   - Implement proper indexes
   - Avoid N+1 patterns
   - Use joins instead of multiple queries

2. **Implement Caching**
   - Cache frequently accessed data
   - Use appropriate TTL values
   - Implement cache invalidation

3. **Connection Pooling**
   - Reuse database connections
   - Configure pool size appropriately

### Client-Side

1. **Code Splitting**
   - Lazy load heavy components
   - Use dynamic imports
   - Implement route-based splitting

2. **Image Optimization**
   - Use Next.js Image component
   - Implement lazy loading
   - Serve appropriate sizes

3. **Reduce Bundle Size**
   - Tree-shake unused code
   - Optimize dependencies
   - Use production builds

4. **Optimize Rendering**
   - Use React.memo for expensive components
   - Implement virtualization for long lists
   - Avoid unnecessary re-renders

## Troubleshooting

### Slow Queries

1. Check the slow query log at `/api/performance/metrics?type=slow`
2. Analyze query patterns
3. Add appropriate indexes
4. Optimize query structure
5. Implement caching

### Poor LCP

1. Optimize server response time (TTFB)
2. Implement code splitting
3. Optimize images
4. Use CDN for static assets
5. Implement caching strategies

### High CLS

1. Set explicit dimensions for images
2. Reserve space for dynamic content
3. Avoid inserting content above existing content
4. Use CSS transforms instead of layout properties

### High FID/INP

1. Reduce JavaScript execution time
2. Break up long tasks
3. Use web workers for heavy computations
4. Optimize event handlers
5. Implement debouncing/throttling

## Integration with Monitoring Services

### Datadog

```typescript
// In lib/hooks/use-web-vitals.ts
function sendToAnalytics(metric: WebVitalsMetric) {
  if (window.DD_RUM) {
    window.DD_RUM.addTiming(metric.name, metric.value);
  }
}
```

### Google Analytics

```typescript
function sendToAnalytics(metric: WebVitalsMetric) {
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }
}
```

### Custom Analytics

```typescript
function sendToAnalytics(metric: WebVitalsMetric) {
  fetch('/api/analytics/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metric),
  });
}
```

## Performance Testing

### Lighthouse CI

Add to your CI/CD pipeline:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://your-app.com
            https://your-app.com/dashboard
          budgetPath: ./lighthouse-budget.json
```

### Performance Budget File

```json
{
  "budget": [
    {
      "path": "/*",
      "timings": [
        { "metric": "interactive", "budget": 3000 },
        { "metric": "first-contentful-paint", "budget": 1800 },
        { "metric": "largest-contentful-paint", "budget": 2500 }
      ],
      "resourceSizes": [
        { "resourceType": "script", "budget": 300 },
        { "resourceType": "total", "budget": 1000 }
      ]
    }
  ]
}
```

## Best Practices

1. **Monitor Continuously**
   - Set up automated monitoring
   - Create alerts for performance degradation
   - Review metrics regularly

2. **Set Realistic Budgets**
   - Based on user expectations
   - Consider target devices and networks
   - Adjust based on actual usage

3. **Optimize Iteratively**
   - Identify bottlenecks
   - Make targeted improvements
   - Measure impact of changes

4. **Test on Real Devices**
   - Use various devices and networks
   - Test on low-end devices
   - Consider different network conditions

5. **Document Performance Changes**
   - Track performance over time
   - Document optimization efforts
   - Share learnings with team

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [React Performance](https://react.dev/learn/render-and-commit)
