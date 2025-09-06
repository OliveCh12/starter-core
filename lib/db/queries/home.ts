import { desc, eq, count, and, isNull, gte, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import { users, posts, comments, postReactions, commentReactions, userFollows, profileViews, activityLogs } from '../schema';
import { handleDatabaseError } from '../utils';
import { getUser } from './auth';

export interface DashboardStats {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl: string | null;
    createdAt: Date;
    bio: string | null;
  };
  profileCompletion: {
    percentage: number;
    missingFields: string[];
  };
  stats: {
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    totalProfileViews: number;
    followersCount: number;
    followingCount: number;
  };
  recentActivity: {
    postsThisWeek: number;
    commentsThisWeek: number;
    likesThisWeek: number;
  };
  recentPosts: Array<{
    id: number;
    title: string | null;
    content: string;
    createdAt: Date;
    likeCount: number;
    commentCount: number;
  }>;
}

function calculateProfileCompletion(user: any): { percentage: number; missingFields: string[] } {
  const requiredFields = [
    { field: 'firstName', label: 'First Name' },
    { field: 'lastName', label: 'Last Name' },
    { field: 'email', label: 'Email' },
    { field: 'bio', label: 'Bio' },
    { field: 'profileImageUrl', label: 'Profile Picture' },
    { field: 'phoneNumber', label: 'Phone Number' },
    { field: 'dateOfBirth', label: 'Date of Birth' },
    { field: 'city', label: 'City' },
    { field: 'country', label: 'Country' }
  ];

  const missingFields: string[] = [];
  let completedFields = 0;

  requiredFields.forEach(({ field, label }) => {
    if (user[field] && user[field].toString().trim() !== '') {
      completedFields++;
    } else {
      missingFields.push(label);
    }
  });

  const percentage = Math.round((completedFields / requiredFields.length) * 100);
  
  return { percentage, missingFields };
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const user = await getUser();
  if (!user) {
    return null;
  }

  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get user's posts count
    const [postsCount] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(eq(posts.authorId, user.id), isNull(posts.deletedAt)));

    // Get user's comments count  
    const [commentsCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(and(eq(comments.authorId, user.id), isNull(comments.deletedAt)));

    // Get total likes received on posts
    const [likesCount] = await db
      .select({ count: count() })
      .from(postReactions)
      .innerJoin(posts, eq(postReactions.postId, posts.id))
      .where(and(
        eq(posts.authorId, user.id),
        eq(postReactions.reactionType, 'like'),
        isNull(posts.deletedAt)
      ));

    // Get profile views count
    const [profileViewsCount] = await db
      .select({ count: count() })
      .from(profileViews)
      .where(eq(profileViews.profileOwnerId, user.id));

    // Get followers count
    const [followersCount] = await db
      .select({ count: count() })
      .from(userFollows)
      .where(eq(userFollows.followingId, user.id));

    // Get following count
    const [followingCount] = await db
      .select({ count: count() })
      .from(userFollows)
      .where(eq(userFollows.followerId, user.id));

    // Get recent activity (this week)
    const [postsThisWeek] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(
        eq(posts.authorId, user.id),
        gte(posts.createdAt, oneWeekAgo),
        isNull(posts.deletedAt)
      ));

    const [commentsThisWeek] = await db
      .select({ count: count() })
      .from(comments)
      .where(and(
        eq(comments.authorId, user.id),
        gte(comments.createdAt, oneWeekAgo),
        isNull(comments.deletedAt)
      ));

    const [likesThisWeek] = await db
      .select({ count: count() })
      .from(postReactions)
      .innerJoin(posts, eq(postReactions.postId, posts.id))
      .where(and(
        eq(posts.authorId, user.id),
        eq(postReactions.reactionType, 'like'),
        gte(postReactions.createdAt, oneWeekAgo),
        isNull(posts.deletedAt)
      ));

    // Get recent posts
    const recentPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        createdAt: posts.createdAt,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount
      })
      .from(posts)
      .where(and(eq(posts.authorId, user.id), isNull(posts.deletedAt)))
      .orderBy(desc(posts.createdAt))
      .limit(5);

    // Calculate profile completion
    const profileCompletion = calculateProfileCompletion(user);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        bio: user.bio
      },
      profileCompletion,
      stats: {
        totalPosts: postsCount?.count || 0,
        totalComments: commentsCount?.count || 0,
        totalLikes: likesCount?.count || 0,
        totalProfileViews: profileViewsCount?.count || 0,
        followersCount: followersCount?.count || 0,
        followingCount: followingCount?.count || 0
      },
      recentActivity: {
        postsThisWeek: postsThisWeek?.count || 0,
        commentsThisWeek: commentsThisWeek?.count || 0,
        likesThisWeek: likesThisWeek?.count || 0
      },
      recentPosts
    };
  } catch (error) {
    handleDatabaseError(error, 'retrieve dashboard stats');
    return null;
  }
}