import { NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/hygraph/wiki';

// Enable static generation with revalidation for individual articles
export const revalidate = 1800; // Revalidate every 30 minutes

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await getArticleBySlug(params.slug);
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    // Add cache headers for CDN and browser caching
    const response = NextResponse.json(article);
    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    
    return response;
  } catch (error: any) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
