import { NextResponse } from 'next/server';
import { getArticlesByCategory } from '@/lib/hygraph/wiki';

export async function GET(
  request: Request,
  { params }: { params: { category: string } }
) {
  try {
    const articles = await getArticlesByCategory(params.category);
    return NextResponse.json(articles);
  } catch (error: any) {
    console.error('Error fetching articles by category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
