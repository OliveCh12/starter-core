import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../drizzle';
import { userPreferences, users, NewUserPreferences, UserPreferences } from '../schema';
import { handleDatabaseError } from '../utils';
import { getUser } from './auth';

export async function getUserPreferences() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    // If no preferences exist, create default ones
    if (preferences.length === 0) {
      const defaultPreferences: NewUserPreferences = {
        userId: user.id,
        theme: 'system',
        language: 'en',
        emailNotifications: true,
        pushNotifications: true,
        profileVisibility: 'public',
        showOnlineStatus: true,
        contentFilters: {}
      };

      await db.insert(userPreferences).values(defaultPreferences);
      
      // Return the created preferences
      const newPrefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, user.id))
        .limit(1);
      
      return newPrefs[0];
    }

    return preferences[0];
  } catch (error) {
    handleDatabaseError(error, 'retrieve user preferences');
  }
}

export async function updateUserPreferences(
  data: Partial<Pick<UserPreferences, 'theme' | 'language' | 'emailNotifications' | 'pushNotifications' | 'profileVisibility' | 'showOnlineStatus' | 'contentFilters'>>
) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Ensure user preferences record exists
    const existingPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    if (existingPrefs.length === 0) {
      // Create default preferences first
      const defaultPreferences: NewUserPreferences = {
        userId: user.id,
        theme: 'system',
        language: 'en',
        emailNotifications: true,
        pushNotifications: true,
        profileVisibility: 'public',
        showOnlineStatus: true,
        contentFilters: {},
        ...data
      };

      await db.insert(userPreferences).values(defaultPreferences);
    } else {
      // Update existing preferences
      await db
        .update(userPreferences)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(userPreferences.userId, user.id));
    }

    return { success: true };
  } catch (error) {
    handleDatabaseError(error, 'update user preferences');
  }
}

export async function getUserWithPreferences() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  try {
    const result = await db.query.users.findFirst({
      where: and(eq(users.id, user.id), isNull(users.deletedAt)),
      with: {
        preferences: true
      }
    });

    return result || null;
  } catch (error) {
    handleDatabaseError(error, 'retrieve user with preferences');
  }
}