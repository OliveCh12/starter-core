import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../drizzle';
import { users, teamMembers } from '../schema';
import { handleDatabaseError } from '../utils';
import { getUser } from './auth';

export async function updateUser(updateData: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const updatedUser = await db
      .update(users)
      .set({
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email
      })
      .where(and(eq(users.id, user.id), isNull(users.deletedAt)))
      .returning();

    if (updatedUser.length === 0) {
      throw new Error('User not found');
    }

    return updatedUser[0];
  } catch (error) {
    handleDatabaseError(error, 'update user data');
  }
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getUserProfile(userId?: number) {
  const user = userId ? { id: userId } : await getUser();
  if (!user) {
    return null;
  }

  try {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.id, user.id), isNull(users.deletedAt)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    handleDatabaseError(error, 'retrieve user profile');
  }
}

export async function updateUserProfile(
  userId: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    bio?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    streetAddress?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    profileImageUrl?: string;
  }
) {
  try {
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    };

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    handleDatabaseError(error, 'update user profile');
  }
}