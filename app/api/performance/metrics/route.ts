import { NextResponse } from 'next/server';
import { 
  getQueryMetrics, 
  getOperationMetrics, 
  getQueryStats,
  getSlowQueries 
} from '@/lib/monitoring/performance';

// Mark as dynamic route
export const dynamic = 'force-dynamic';

/**
 * GET /api/performance/metrics
 * Returns performance metrics for monitoring
 * 
 * This endpoint should be protected in production
 */
export async function GET(request: Request) {
  try {
    // In production, add authentication check here
    // const session = await getSession();
    // if (!session?.user?.is_admin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let data: any = {};

    switch (type) {
      case 'queries':
        data = {
          queries: getQueryMetrics(),
          stats: getQueryStats(),
        };
        break;
      
      case 'operations':
        data = {
          operations: getOperationMetrics(),
        };
        break;
      
      case 'slow':
        data = {
          slowQueries: getSlowQueries(),
        };
        break;
      
      case 'stats':
        data = getQueryStats();
        break;
      
      case 'all':
      default:
        data = {
          queries: getQueryMetrics(),
          operations: getOperationMetrics(),
          stats: getQueryStats(),
          slowQueries: getSlowQueries(),
        };
        break;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
