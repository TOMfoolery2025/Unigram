import { NextResponse } from 'next/server';
import { searchArticles } from '@/lib/hygraph/wiki';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    const results = await searchArticles(query);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error searching articles:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search articles' },
      { status: 500 }
    );
  }
}
