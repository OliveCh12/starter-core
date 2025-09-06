import { NextRequest, NextResponse } from 'next/server';
import { getPostById } from '@/lib/db/queries/posts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);
    
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const post = await getPostById(postId);
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Add _count for compatibility with the PostCard component
    const postWithCount = {
      ...post,
      _count: {
        comments: post.comments?.length || 0,
        reactions: post.reactions?.length || 0,
      }
    };

    return NextResponse.json(postWithCount);
  } catch (error: any) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}