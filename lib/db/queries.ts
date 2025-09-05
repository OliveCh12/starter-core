import { desc, and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, posts, comments, userPreferences, NewUserPreferences, UserPreferences } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { DatabaseError } from './connection';
import { handleDatabaseError } from './utils';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    return user[0];
  } catch (error) {
    handleDatabaseError(error, 'retrieve user data');
  }
}

export async function updateUser(updateData: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    throw new Error('No session found');
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    throw new Error('Invalid session');
  }

  if (new Date(sessionData.expires) < new Date()) {
    throw new Error('Session expired');
  }

  try {
    const updatedUser = await db
      .update(users)
      .set({
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email
      })
      .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
      .returning();

    if (updatedUser.length === 0) {
      throw new Error('User not found');
    }

    return updatedUser[0];
  } catch (error) {
    handleDatabaseError(error, 'update user data');
  }
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
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

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    return await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        timestamp: activityLogs.timestamp,
        ipAddress: activityLogs.ipAddress,
        userName: users.firstName,
        userLastName: users.lastName
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.userId, user.id))
      .orderBy(desc(activityLogs.timestamp))
      .limit(10);
  } catch (error) {
    handleDatabaseError(error, 'retrieve activity logs');
  }
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  try {
    const result = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, user.id),
      with: {
        team: {
          with: {
            teamMembers: {
              with: {
                user: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return result?.team || null;
  } catch (error) {
    handleDatabaseError(error, 'retrieve team data');
  }
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

export async function getPosts() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const userWithTeam = await getUserWithTeam(user.id);
    
    // Build the where condition step by step
    let whereCondition = and(
      isNull(posts.deletedAt),
      or(
        eq(posts.visibility, 'public'),
        eq(posts.authorId, user.id)
      )
    );

    // Add team posts if user has a team
    if (userWithTeam?.teamId) {
      const teamMembersData = await db
        .select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, userWithTeam.teamId));
      
      const teamMemberIds = teamMembersData.map(tm => tm.userId);
      
      if (teamMemberIds.length > 0) {
        whereCondition = and(
          isNull(posts.deletedAt),
          or(
            eq(posts.visibility, 'public'),
            eq(posts.authorId, user.id),
            and(
              eq(posts.visibility, 'friends_only'),
              sql`${posts.authorId} IN (${sql.join(teamMemberIds.map(id => sql`${id}`), sql`, `)})`
            )
          )
        );
      }
    }
    
    const result = await db.query.posts.findMany({
      where: whereCondition,
      with: {
        author: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          }
        },
        reactions: true,
        comments: {
          where: isNull(comments.deletedAt),
          with: {
            author: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                profileImageUrl: true,
              }
            }
          }
        }
      },
      orderBy: desc(posts.createdAt),
      limit: 50
    });

    return result.map(post => ({
      ...post,
      _count: {
        comments: post.comments.length,
        reactions: post.reactions.length,
      }
    }));
  } catch (error) {
    handleDatabaseError(error, 'retrieve posts');
  }
}

export async function getPostById(postId: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const post = await db.query.posts.findFirst({
      where: and(
        eq(posts.id, postId),
        isNull(posts.deletedAt)
      ),
      with: {
        author: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          }
        },
        reactions: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        comments: {
          where: isNull(comments.deletedAt),
          with: {
            author: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                profileImageUrl: true,
              }
            },
            reactions: true,
          },
          orderBy: desc(comments.createdAt)
        }
      }
    });

    if (!post) {
      return null;
    }

    const userWithTeam = await getUserWithTeam(user.id);
    const canView = post.visibility === 'public' || 
                   post.authorId === user.id ||
                   (post.visibility === 'friends_only' && userWithTeam?.teamId);

    if (!canView) {
      return null;
    }

    return post;
  } catch (error) {
    handleDatabaseError(error, 'retrieve post');
  }
}

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
