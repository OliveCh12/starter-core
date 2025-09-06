import { desc, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { activityLogs, users } from '../schema';
import { handleDatabaseError } from '../utils';
import { getUser } from './auth';

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