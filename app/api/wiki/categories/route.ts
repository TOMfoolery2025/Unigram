import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/hygraph/wiki';

// Enable static generation with revalidation
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    const categories = await getAllCategories();
    
    // Add cache headers
    const response = NextResponse.json(categories);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    
    return response;
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
