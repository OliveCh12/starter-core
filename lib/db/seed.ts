import { faker } from '@faker-js/faker';
import { db } from './drizzle';
import {
  users,
  teams,
  teamMembers,
  activityLogs,
  invitations,
  roles,
  permissions,
  rolePermissions,
  subscriptionPlans,
  userSubscriptions,
  userPreferences,
  posts,
  comments,
  postReactions,
  commentReactions,
  userFollows,
  userBlocks,
  profileViews,
  ActivityType,
  User,
  Team,
  Role,
  SubscriptionPlan,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { stripe } from '../payments/stripe';
import * as readline from 'readline';

// --- Configuration ---
const NUM_USERS_TO_CREATE = 50;
const NUM_TEAMS_TO_CREATE = 8;
const MAX_MEMBERS_PER_TEAM = 6;
const NUM_POSTS_TO_CREATE = 100;
const NUM_COMMENTS_PER_POST = 5;
const ACTIVITY_LOGS_PER_TEAM = 30;
const INVITATIONS_PER_TEAM = 5;
const PLAIN_TEXT_PASSWORD = 'password123';

// --- Utilitaires de logging coloré ---
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

const logger = {
  info: (message: string) => console.log(`${colors.blue}ℹ ${message}${colors.reset}`),
  warn: (message: string) => console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`),
  success: (message: string) => console.log(`${colors.green}✅ ${message}${colors.reset}`),
  error: (message: string) => console.error(`${colors.red}❌ ${message}${colors.reset}`),
  highlight: (message: string) => `${colors.magenta}${message}${colors.reset}`,
};

/**
 * Asks the user for confirmation before proceeding.
 */
function promptForContinuation(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question(
      `This script will completely wipe all data in your database. Are you sure you want to continue? (yes/no) `,
      (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'yes') {
          resolve();
        } else {
          reject(new Error('Seeding process aborted by user.'));
        }
      },
    );
  });
}

/**
 * Cleans all tables in the correct order to avoid foreign key constraint errors.
 */
async function cleanupDatabase() {
  logger.info('Cleaning up the database...');
  
  // Delete in order of dependencies
  await db.delete(activityLogs);
  await db.delete(profileViews);
  await db.delete(userBlocks);
  await db.delete(userFollows);
  await db.delete(commentReactions);
  await db.delete(postReactions);
  await db.delete(comments);
  await db.delete(posts);
  await db.delete(userPreferences);
  await db.delete(userSubscriptions);
  await db.delete(invitations);
  await db.delete(teamMembers);
  await db.delete(rolePermissions);
  await db.delete(permissions);
  await db.delete(users);
  await db.delete(roles);
  await db.delete(subscriptionPlans);
  await db.delete(teams);
}

/**
 * Seeds roles and permissions.
 */
async function seedRolesAndPermissions(): Promise<Role[]> {
  logger.info('Creating roles and permissions...');
  
  // Create permissions
  const permissionsToCreate = [
    { name: 'create_post', resource: 'post', action: 'create', description: 'Create new posts' },
    { name: 'edit_post', resource: 'post', action: 'update', description: 'Edit posts' },
    { name: 'delete_post', resource: 'post', action: 'delete', description: 'Delete posts' },
    { name: 'view_post', resource: 'post', action: 'read', description: 'View posts' },
    { name: 'comment_on_post', resource: 'comment', action: 'create', description: 'Comment on posts' },
    { name: 'moderate_content', resource: 'post', action: 'moderate', description: 'Moderate content' },
    { name: 'manage_users', resource: 'user', action: 'manage', description: 'Manage users' },
    { name: 'view_analytics', resource: 'analytics', action: 'read', description: 'View analytics' },
  ];
  
  const createdPermissions = await db.insert(permissions).values(permissionsToCreate).returning();
  
  // Create roles
  const rolesToCreate = [
    { name: 'user', description: 'Regular user with basic permissions', isSystemRole: true },
    { name: 'moderator', description: 'Content moderator', isSystemRole: true },
    { name: 'admin', description: 'Administrator with full permissions', isSystemRole: true },
  ];
  
  const createdRoles = await db.insert(roles).values(rolesToCreate).returning();
  
  // Assign permissions to roles
  const rolePermissionsToCreate = [
    // User permissions
    { roleId: createdRoles[0].id, permissionId: createdPermissions[0].id }, // create_post
    { roleId: createdRoles[0].id, permissionId: createdPermissions[1].id }, // edit_post
    { roleId: createdRoles[0].id, permissionId: createdPermissions[2].id }, // delete_post
    { roleId: createdRoles[0].id, permissionId: createdPermissions[3].id }, // view_post
    { roleId: createdRoles[0].id, permissionId: createdPermissions[4].id }, // comment_on_post
    
    // Moderator permissions (includes all user permissions)
    { roleId: createdRoles[1].id, permissionId: createdPermissions[0].id },
    { roleId: createdRoles[1].id, permissionId: createdPermissions[1].id },
    { roleId: createdRoles[1].id, permissionId: createdPermissions[2].id },
    { roleId: createdRoles[1].id, permissionId: createdPermissions[3].id },
    { roleId: createdRoles[1].id, permissionId: createdPermissions[4].id },
    { roleId: createdRoles[1].id, permissionId: createdPermissions[5].id }, // moderate_content
    
    // Admin permissions (includes all)
    { roleId: createdRoles[2].id, permissionId: createdPermissions[0].id },
    { roleId: createdRoles[2].id, permissionId: createdPermissions[1].id },
    { roleId: createdRoles[2].id, permissionId: createdPermissions[2].id },
    { roleId: createdRoles[2].id, permissionId: createdPermissions[3].id },
    { roleId: createdRoles[2].id, permissionId: createdPermissions[4].id },
    { roleId: createdRoles[2].id, permissionId: createdPermissions[5].id },
    { roleId: createdRoles[2].id, permissionId: createdPermissions[6].id }, // manage_users
    { roleId: createdRoles[2].id, permissionId: createdPermissions[7].id }, // view_analytics
  ];
  
  await db.insert(rolePermissions).values(rolePermissionsToCreate);
  
  return createdRoles;
}

/**
 * Seeds subscription plans.
 */
async function seedSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  logger.info('Creating subscription plans...');
  
  const plansToCreate = [
    {
      name: 'Free',
      description: 'Basic features for getting started',
      price: 0,
      currency: 'usd',
      features: ['5 posts per month', 'Basic profile', 'Public posts only'],
      maxPosts: 5,
      maxFollowers: 50,
      canCreatePrivatePosts: false,
    },
    {
      name: 'Pro',
      description: 'Enhanced features for power users',
      stripeProductId: 'prod_pro_plan',
      stripePriceId: 'price_pro_monthly',
      price: 999, // $9.99
      currency: 'usd',
      features: ['Unlimited posts', 'Private posts', 'Advanced analytics', 'Priority support'],
      maxPosts: null, // unlimited
      maxFollowers: 1000,
      canCreatePrivatePosts: true,
    },
    {
      name: 'Premium',
      description: 'Full access with premium features',
      stripeProductId: 'prod_premium_plan',
      stripePriceId: 'price_premium_monthly',
      price: 1999, // $19.99
      currency: 'usd',
      features: ['Everything in Pro', 'Custom themes', 'API access', 'White-label options'],
      maxPosts: null, // unlimited
      maxFollowers: null, // unlimited
      canCreatePrivatePosts: true,
    },
  ];
  
  return db.insert(subscriptionPlans).values(plansToCreate).returning();
}

/**
 * Seeds the users table with a mix of a default user and fake users.
 * @returns {Promise<User[]>} The created user records.
 */
async function seedUsers(roles: Role[], plans: SubscriptionPlan[]): Promise<User[]> {
  logger.info(`Creating ${NUM_USERS_TO_CREATE} users...`);
  const passwordHash = await hashPassword(PLAIN_TEXT_PASSWORD);
  
  const usersToCreate = [
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      passwordHash,
      emailVerified: true,
      roleId: roles.find(r => r.name === 'admin')?.id || roles[0].id,
      dateOfBirth: '1990-01-01',
      bio: 'System administrator account for testing',
    },
    {
      firstName: 'Test',
      lastName: 'User',
      email: 'user@test.com',
      passwordHash,
      emailVerified: true,
      roleId: roles.find(r => r.name === 'user')?.id || roles[0].id,
      dateOfBirth: '1995-05-15',
      bio: 'Regular user account for testing',
    },
    ...Array.from({ length: NUM_USERS_TO_CREATE - 2 }, () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return {
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        passwordHash,
        emailVerified: faker.datatype.boolean(0.8), // 80% verified
        roleId: faker.helpers.arrayElement(roles).id,
        dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
        phoneNumber: faker.helpers.maybe(() => faker.phone.number(), { probability: 0.6 }),
        gender: faker.helpers.maybe(() => faker.helpers.arrayElement(['male', 'female', 'other']), { probability: 0.7 }),
        bio: faker.helpers.maybe(() => faker.lorem.sentences(2), { probability: 0.5 }),
        profileImageUrl: faker.helpers.maybe(() => faker.image.avatar(), { probability: 0.4 }),
        streetAddress: faker.helpers.maybe(() => faker.location.streetAddress(), { probability: 0.3 }),
        city: faker.helpers.maybe(() => faker.location.city(), { probability: 0.3 }),
        region: faker.helpers.maybe(() => faker.location.state(), { probability: 0.3 }),
        postalCode: faker.helpers.maybe(() => faker.location.zipCode(), { probability: 0.3 }),
        country: faker.helpers.maybe(() => faker.location.countryCode(), { probability: 0.3 }),
      };
    }),
  ];

  return db.insert(users).values(usersToCreate).returning();
}

/**
 * Seeds user subscriptions and preferences.
 */
async function seedUserSubscriptionsAndPreferences(users: User[], plans: SubscriptionPlan[]): Promise<void> {
  logger.info('Creating user subscriptions and preferences...');
  
  const subscriptionsToCreate = users.map(user => {
    const plan = faker.helpers.arrayElement(plans);
    const hasActiveSubscription = plan.name !== 'Free' && faker.datatype.boolean(0.7);
    
    return {
      userId: user.id,
      planId: plan.id,
      stripeCustomerId: hasActiveSubscription ? `cus_${faker.string.alphanumeric(14)}` : null,
      stripeSubscriptionId: hasActiveSubscription ? `sub_${faker.string.alphanumeric(14)}` : null,
      status: hasActiveSubscription ? faker.helpers.arrayElement(['active', 'trialing', 'past_due']) : 'inactive',
      currentPeriodStart: hasActiveSubscription ? faker.date.recent() : null,
      currentPeriodEnd: hasActiveSubscription ? faker.date.future() : null,
      cancelAtPeriodEnd: hasActiveSubscription ? faker.datatype.boolean(0.1) : false,
    };
  });
  
  await db.insert(userSubscriptions).values(subscriptionsToCreate);
  
  const preferencesToCreate = users.map(user => ({
    userId: user.id,
    theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
    language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
    emailNotifications: faker.datatype.boolean(0.8),
    pushNotifications: faker.datatype.boolean(0.6),
    profileVisibility: faker.helpers.arrayElement(['public', 'private', 'friends_only']),
    showOnlineStatus: faker.datatype.boolean(0.7),
    contentFilters: {
      hideNSFW: faker.datatype.boolean(0.9),
      hideSpoilers: faker.datatype.boolean(0.8),
      minimumAge: faker.helpers.arrayElement([0, 13, 18]),
    },
  }));
  
  await db.insert(userPreferences).values(preferencesToCreate);
}

/**
 * Seeds the teams table with fake data.
 * @returns {Promise<Team[]>} The created team records.
 */
async function seedTeams(): Promise<Team[]> {
  logger.info(`Creating ${NUM_TEAMS_TO_CREATE} teams...`);
  const planNames = ['Base', 'Plus', null];

  const teamsToCreate = Array.from({ length: NUM_TEAMS_TO_CREATE }, () => {
    const planName = faker.helpers.arrayElement(planNames);
    return {
      name: faker.company.name(),
      description: faker.helpers.maybe(() => faker.company.catchPhrase(), { probability: 0.7 }),
      stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
      stripeSubscriptionId: planName ? `sub_${faker.string.alphanumeric(14)}` : null,
      planName: planName,
      subscriptionStatus: planName ? faker.helpers.arrayElement(['active', 'trialing']) : null,
    };
  });

  return db.insert(teams).values(teamsToCreate).returning();
}

/**
 * Seeds the team_members table, linking users and teams.
 * @param createdUsers - The array of users from the database.
 * @param createdTeams - The array of teams from the database.
 * @returns {Promise<number>} The total number of memberships created.
 */
async function seedTeamMembers(createdUsers: User[], createdTeams: Team[]): Promise<number> {
  logger.info('Creating team memberships...');
  const membershipsToCreate = [];

  for (const team of createdTeams) {
    const memberCount = faker.number.int({ min: 2, max: MAX_MEMBERS_PER_TEAM });
    const shuffledUsers = faker.helpers.shuffle(createdUsers);
    
    // Assign an owner first
    membershipsToCreate.push({
      teamId: team.id,
      userId: shuffledUsers[0].id,
      role: 'owner' as const,
    });

    // Assign other members
    for (let i = 1; i < memberCount; i++) {
      membershipsToCreate.push({
        teamId: team.id,
        userId: shuffledUsers[i].id,
        role: faker.helpers.arrayElement(['admin', 'member'] as const),
      });
    }
  }

  await db.insert(teamMembers).values(membershipsToCreate);
  return membershipsToCreate.length;
}

/**
 * Seeds posts and comments.
 */
async function seedPostsAndComments(users: User[]): Promise<{ postCount: number; commentCount: number }> {
  logger.info('Creating posts and comments...');
  
  const postsToCreate = Array.from({ length: NUM_POSTS_TO_CREATE }, () => {
    const author = faker.helpers.arrayElement(users);
    return {
      authorId: author.id,
      title: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.8 }),
      content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 5 })),
      visibility: faker.helpers.arrayElement(['public', 'private', 'friends_only']),
      isPublished: faker.datatype.boolean(0.9),
      viewCount: faker.number.int({ min: 0, max: 1000 }),
      tags: faker.helpers.maybe(() => faker.helpers.arrayElements(
        ['technology', 'lifestyle', 'travel', 'food', 'sports', 'music', 'art'],
        { min: 1, max: 3 }
      ), { probability: 0.6 }),
    };
  });
  
  const createdPosts = await db.insert(posts).values(postsToCreate).returning();
  
  let commentsToCreate = [];
  for (const post of createdPosts) {
    const numComments = faker.number.int({ min: 0, max: NUM_COMMENTS_PER_POST });
    for (let i = 0; i < numComments; i++) {
      const author = faker.helpers.arrayElement(users);
      commentsToCreate.push({
        postId: post.id,
        authorId: author.id,
        content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
        parentId: faker.helpers.maybe((): number | null => {
          const existingComments = commentsToCreate.filter(c => c.postId === post.id);
          return null; // Simplified for seeding
        }, { probability: 0.3 }),
      });
    }
  }
  
  if (commentsToCreate.length > 0) {
    await db.insert(comments).values(commentsToCreate);
  }
  
  return { postCount: createdPosts.length, commentCount: commentsToCreate.length };
}

/**
 * Seeds user interactions (follows, blocks, reactions).
 */
async function seedUserInteractions(users: User[]): Promise<{ followCount: number; blockCount: number; reactionCount: number }> {
  logger.info('Creating user interactions...');
  
  let followsToCreate = [];
  let blocksToCreate = [];
  let reactionsToCreate = [];
  
  // Create follows
  for (const user of users) {
    const numFollows = faker.number.int({ min: 0, max: 10 });
    const potentialFollows = users.filter(u => u.id !== user.id);
    const toFollow = faker.helpers.arrayElements(potentialFollows, numFollows);
    
    for (const followed of toFollow) {
      followsToCreate.push({
        followerId: user.id,
        followingId: followed.id,
      });
    }
  }
  
  // Create some blocks (fewer than follows)
  const someUsers = faker.helpers.arrayElements(users, Math.floor(users.length * 0.2));
  for (const user of someUsers) {
    const potentialBlocks = users.filter(u => u.id !== user.id);
    const toBlock = faker.helpers.arrayElements(potentialBlocks, faker.number.int({ min: 0, max: 2 }));
    
    for (const blocked of toBlock) {
      blocksToCreate.push({
        blockerId: user.id,
        blockedId: blocked.id,
        reason: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.5 }),
      });
    }
  }
  
  // Add reactions to posts
  const allPosts = await db.select().from(posts);
  for (const post of allPosts) {
    const numReactions = faker.number.int({ min: 0, max: 15 });
    const reactors = faker.helpers.arrayElements(users, numReactions);
    
    for (const reactor of reactors) {
      reactionsToCreate.push({
        postId: post.id,
        userId: reactor.id,
        reactionType: faker.helpers.arrayElement(['like', 'dislike', 'love', 'laugh']),
      });
    }
  }
  
  if (followsToCreate.length > 0) await db.insert(userFollows).values(followsToCreate);
  if (blocksToCreate.length > 0) await db.insert(userBlocks).values(blocksToCreate);
  if (reactionsToCreate.length > 0) await db.insert(postReactions).values(reactionsToCreate);
  
  return {
    followCount: followsToCreate.length,
    blockCount: blocksToCreate.length,
    reactionCount: reactionsToCreate.length,
  };
}

/**
 * Creates activity logs and invitations for all teams.
 * @param createdTeams - The array of teams from the database.
 * @param users - The array of users from the database.
 */
async function seedRelatedData(createdTeams: Team[], users: User[]) {
    logger.info('Creating activity logs and invitations...');
    let activitiesToCreate = [];
    let invitationsToCreate = [];
    const activityTypes = Object.values(ActivityType);

    // Create general user activities
    for (const user of users) {
      const numActivities = faker.number.int({ min: 5, max: 20 });
      for (let i = 0; i < numActivities; i++) {
        activitiesToCreate.push({
          userId: user.id,
          action: faker.helpers.arrayElement(activityTypes),
          resourceType: faker.helpers.arrayElement(['post', 'user', 'comment']),
          resourceId: faker.number.int({ min: 1, max: 100 }),
          metadata: {
            userAgent: faker.internet.userAgent(),
            timestamp: faker.date.recent({ days: 30 }).toISOString(),
          },
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        });
      }
    }

    for (const team of createdTeams) {
        const members = await db.query.teamMembers.findMany({ where: (tm, { eq }) => eq(tm.teamId, team.id) });
        if (members.length === 0) continue;

        // Create team-specific activities
        for (let i = 0; i < ACTIVITY_LOGS_PER_TEAM; i++) {
            const randomMember = faker.helpers.arrayElement(members);
            activitiesToCreate.push({
                teamId: team.id,
                userId: randomMember.userId,
                action: faker.helpers.arrayElement(['CREATE_TEAM', 'JOIN_TEAM', 'INVITE_TEAM_MEMBER']),
                resourceType: 'team',
                resourceId: team.id,
                ipAddress: faker.internet.ip(),
                userAgent: faker.internet.userAgent(),
            });
        }

        // Create invitations for this team
        for (let i = 0; i < INVITATIONS_PER_TEAM; i++) {
            const inviter = faker.helpers.arrayElement(members);
            invitationsToCreate.push({
                teamId: team.id,
                email: faker.internet.email().toLowerCase(),
                role: faker.helpers.arrayElement(['admin', 'member'] as const),
                invitedBy: inviter.userId,
                status: faker.helpers.arrayElement(['pending', 'accepted'] as const),
            });
        }
    }
    
    if (activitiesToCreate.length > 0) await db.insert(activityLogs).values(activitiesToCreate);
    if (invitationsToCreate.length > 0) await db.insert(invitations).values(invitationsToCreate);

    return { activityCount: activitiesToCreate.length, invitationCount: invitationsToCreate.length };
}

/**
 * Seeds the teams table with fake data.
 * @returns {Promise<Team[]>} The created team records.
 */
/**
 * Displays a summary of the created data.
 */
function displaySummary(data: {
  users: User[];
  teams: Team[];
  membershipCount: number;
  postCount: number;
  commentCount: number;
  followCount: number;
  blockCount: number;
  reactionCount: number;
  activityCount: number;
  invitationCount: number;
}) {
    console.log('\n' + '-'.repeat(60));
    logger.success('Seeding process completed!');
    console.log('-'.repeat(60));

    logger.info('Summary of created data:');
    console.log(`  - ${logger.highlight(data.users.length.toString())} Users`);
    console.log(`  - ${logger.highlight(data.teams.length.toString())} Teams`);
    console.log(`  - ${logger.highlight(data.membershipCount.toString())} Team Memberships`);
    console.log(`  - ${logger.highlight(data.postCount.toString())} Posts`);
    console.log(`  - ${logger.highlight(data.commentCount.toString())} Comments`);
    console.log(`  - ${logger.highlight(data.followCount.toString())} User Follows`);
    console.log(`  - ${logger.highlight(data.blockCount.toString())} User Blocks`);
    console.log(`  - ${logger.highlight(data.reactionCount.toString())} Post Reactions`);
    console.log(`  - ${logger.highlight(data.activityCount.toString())} Activity Logs`);
    console.log(`  - ${logger.highlight(data.invitationCount.toString())} Invitations`);
    
    console.log('\n');
    logger.info('You can use these credentials to log in for testing:');
    
    const loginDetails = [
        {
            email: data.users[0].email,
            password: PLAIN_TEXT_PASSWORD,
            name: `${data.users[0].firstName} ${data.users[0].lastName}`,
        },
        {
            email: data.users[1].email,
            password: PLAIN_TEXT_PASSWORD,
            name: `${data.users[1].firstName} ${data.users[1].lastName}`,
        }
    ];

    console.table(loginDetails);
    console.log('-'.repeat(60));
}

/**
 * Main seed function.
 */
async function main() {
  logger.warn('This script is destructive and will erase all data in the database.');
  await promptForContinuation();
  
  await cleanupDatabase();
  
  // Seed in correct order due to dependencies
  const createdRoles = await seedRolesAndPermissions();
  const createdPlans = await seedSubscriptionPlans();
  const createdUsers = await seedUsers(createdRoles, createdPlans);
  await seedUserSubscriptionsAndPreferences(createdUsers, createdPlans);
  
  const createdTeams = await seedTeams();
  const membershipCount = await seedTeamMembers(createdUsers, createdTeams);
  
  const { postCount, commentCount } = await seedPostsAndComments(createdUsers);
  const { followCount, blockCount, reactionCount } = await seedUserInteractions(createdUsers);
  const { activityCount, invitationCount } = await seedRelatedData(createdTeams, createdUsers);

  displaySummary({
    users: createdUsers,
    teams: createdTeams,
    membershipCount,
    postCount,
    commentCount,
    followCount,
    blockCount,
    reactionCount,
    activityCount,
    invitationCount,
  });
}

main()
  .catch((error) => {
    logger.error('Seed process failed:');
    console.error(error.message);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });