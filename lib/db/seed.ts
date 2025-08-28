import { faker } from '@faker-js/faker';
import { db } from './drizzle';
import {
  users,
  teams,
  teamMembers,
  activityLogs,
  invitations,
  ActivityType,
  User,
  Team,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { stripe } from '../payments/stripe';
import * as readline from 'readline';

// --- Configuration ---
const NUM_USERS_TO_CREATE = 20;
const NUM_TEAMS_TO_CREATE = 8;
const MAX_MEMBERS_PER_TEAM = 6;
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
  await db.delete(activityLogs);
  await db.delete(invitations);
  await db.delete(teamMembers);
  await db.delete(users);
  await db.delete(teams);
}

/**
 * Seeds the users table with a mix of a default user and fake users.
 * @returns {Promise<User[]>} The created user records.
 */
async function seedUsers(): Promise<User[]> {
  logger.info(`Creating ${NUM_USERS_TO_CREATE} users...`);
  const passwordHash = await hashPassword(PLAIN_TEXT_PASSWORD);

  const usersToCreate = [
    {
      name: 'Test Owner',
      email: 'owner@test.com',
      passwordHash,
      role: 'owner' as const,
    },
    ...Array.from({ length: NUM_USERS_TO_CREATE - 1 }, () => ({
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      passwordHash,
      role: 'member' as const,
    })),
  ];

  return db.insert(users).values(usersToCreate).returning();
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
 * Creates activity logs and invitations for all teams.
 * @param createdTeams - The array of teams from the database.
 */
async function seedRelatedData(createdTeams: Team[]) {
    logger.info('Creating activity logs and invitations...');
    let activitiesToCreate = [];
    let invitationsToCreate = [];
    const activityTypes = Object.values(ActivityType);

    for (const team of createdTeams) {
        const members = await db.query.teamMembers.findMany({ where: (tm, { eq }) => eq(tm.teamId, team.id) });
        if (members.length === 0) continue;

        // Create activities for this team
        for (let i = 0; i < ACTIVITY_LOGS_PER_TEAM; i++) {
            const randomMember = faker.helpers.arrayElement(members);
            activitiesToCreate.push({
                teamId: team.id,
                userId: randomMember.userId,
                action: faker.helpers.arrayElement(activityTypes),
                ipAddress: faker.internet.ip(),
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
 * Displays a summary of the created data.
 */
function displaySummary(data: {
  users: User[];
  teams: Team[];
  membershipCount: number;
  activityCount: number;
  invitationCount: number;
}) {
    console.log('\n' + '-'.repeat(50));
    logger.success('Seeding process completed!');
    console.log('-'.repeat(50));

    logger.info('Summary of created data:');
    console.log(`  - ${logger.highlight(data.users.length)} Users`);
    console.log(`  - ${logger.highlight(data.teams.length)} Teams`);
    console.log(`  - ${logger.highlight(data.membershipCount)} Team Memberships`);
    console.log(`  - ${logger.highlight(data.activityCount)} Activity Logs`);
    console.log(`  - ${logger.highlight(data.invitationCount)} Invitations`);
    
    console.log('\n');
    logger.info('You can use these credentials to log in for testing:');
    
    const loginDetails = [
        {
            email: data.users[0].email,
            password: PLAIN_TEXT_PASSWORD,
            role: data.users[0].role,
        },
        {
            email: data.users[1].email,
            password: PLAIN_TEXT_PASSWORD,
            role: data.users[1].role,
        }
    ];

    console.table(loginDetails);
    console.log('-'.repeat(50));
}

/**
 * Main seed function.
 */
async function main() {
  logger.warn('This script is destructive and will erase all data in the database.');
  await promptForContinuation();
  
  await cleanupDatabase();
  // Note: Stripe product creation is not included in the seed but can be run separately if needed.

  const createdUsers = await seedUsers();
  const createdTeams = await seedTeams();
  const membershipCount = await seedTeamMembers(createdUsers, createdTeams);
  const { activityCount, invitationCount } = await seedRelatedData(createdTeams);

  displaySummary({
    users: createdUsers,
    teams: createdTeams,
    membershipCount,
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