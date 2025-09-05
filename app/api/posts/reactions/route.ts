import { NextRequest, NextResponse } from 'next/server';
import { reactToPost } from '@/app/(login)/actions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Convert string to number for postId
    const postIdString = formData.get('postId') as string;
    const postId = parseInt(postIdString, 10);
    
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }
    
    // Create new FormData with converted postId
    const processedFormData = new FormData();
    processedFormData.append('postId', postId.toString());
    processedFormData.append('reactionType', formData.get('reactionType') as string);
    
    const result = await reactToPost({}, processedFormData);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to react to post' },
      { status: 500 }
    );
  }
}