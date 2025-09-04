import { getUser } from '@/lib/db/queries';
import { DatabaseError } from '@/lib/db/connection';

export async function GET() {
  try {
    const user = await getUser();
    return Response.json(user);
  } catch (error) {
    console.error('API Error - Get user:', error);
    
    if (error instanceof DatabaseError) {
      return Response.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
