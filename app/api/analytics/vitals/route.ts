import { NextResponse } from 'next/server';

// Mark as dynamic route
export const dynamic = 'force-dynamic';

/**
 * POST /api/analytics/vitals
 * Receives Web Vitals metrics from the client
 * 
 * In production, this would send metrics to your analytics service
 */
export async function POST(request: Request) {
  try {
    const metric = await request.json();
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
      });
    }
    
    // In production, send to analytics service
    // Example: await sendToDatadog(metric);
    // Example: await sendToGoogleAnalytics(metric);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing Web Vitals metric:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process metric' },
      { status: 500 }
    );
  }
}
