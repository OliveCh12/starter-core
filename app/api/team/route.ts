import { getTeamForUser } from '@/lib/db/queries';
import { DatabaseError } from '@/lib/db/connection';

export async function GET() {
  try {
    const team = await getTeamForUser();
    return Response.json(team);
  } catch (error) {
    console.error('API Error - Get team:', error);
    
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
