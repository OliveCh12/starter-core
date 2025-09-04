import { NextRequest, NextResponse } from 'next/server';
import { getPosts } from '@/lib/db/queries';

export async function GET() {
  try {
    const posts = await getPosts();
    return NextResponse.json(posts || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}