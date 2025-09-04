import { checkDatabaseConnection } from '@/lib/db/connection';

export async function GET() {
  try {
    const isHealthy = await checkDatabaseConnection();
    
    if (isHealthy) {
      return Response.json(
        { status: 'healthy', timestamp: new Date().toISOString() },
        { status: 200 }
      );
    } else {
      return Response.json(
        { 
          status: 'unhealthy', 
          error: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return Response.json(
      { 
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
