import { NextResponse } from 'next/server';
import { getUserPreferences, updateUserPreferences } from '@/lib/db/queries';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko']).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  profileVisibility: z.string().optional(),
  showOnlineStatus: z.boolean().optional(),
  contentFilters: z.object({}).optional(),
});

export async function GET() {
  try {
    const preferences = await getUserPreferences();
    return NextResponse.json(preferences);
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // Validate the data
    const validatedData = updatePreferencesSchema.parse(data);
    
    const result = await updateUserPreferences(validatedData);
    
    if (result?.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}