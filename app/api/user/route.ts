import { getUser, updateUser } from '@/lib/db/queries';
import { DatabaseError } from '@/lib/db/connection';
import { z } from 'zod';

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email()
});

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);
    
    const updatedUser = await updateUser(validatedData);
    return Response.json(updatedUser);
  } catch (error) {
    console.error('API Error - Update user:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    
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
