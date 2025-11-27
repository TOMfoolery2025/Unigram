import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health check endpoint for monitoring application status
 * 
 * Returns structured health information including:
 * - Overall status (healthy/degraded/unhealthy)
 * - Database connectivity check
 * - Authentication service check
 * - Timestamp for monitoring
 * 
 * @returns {Promise<NextResponse>} Health status response
 */
export async function GET() {
  const timestamp = new Date();
  const checks: {
    database: boolean;
    authentication: boolean;
  } = {
    database: false,
    authentication: false,
  };

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  try {
    // Check database connectivity
    const supabase = await createClient();
    
    // Simple query to verify database connection
    const { error: dbError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    checks.database = !dbError;

    // Check authentication service
    // This verifies that Supabase auth is accessible
    const { error: authError } = await supabase.auth.getSession();
    checks.authentication = !authError;

    // Determine overall status
    if (!checks.database || !checks.authentication) {
      status = checks.database && checks.authentication ? 'degraded' : 'unhealthy';
    }

  } catch (error) {
    // If any unexpected error occurs, mark as unhealthy
    status = 'unhealthy';
    console.error('Health check error:', error);
  }

  // Return appropriate HTTP status code
  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 503 : 503;

  return NextResponse.json(
    {
      status,
      timestamp,
      checks,
    },
    { status: httpStatus }
  );
}
