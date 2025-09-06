import { desc, and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import { posts, teamMembers, comments } from '../schema';
import { handleDatabaseError } from '../utils';
import { getUser } from './auth';
import { getUserWithTeam } from './users';

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