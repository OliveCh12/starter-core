import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import readline from 'node:readline';
import crypto from 'node:crypto';
// import path from 'node:path';
import os from 'node:os';

const execAsync = promisify(exec);

// --- UI & Logging Helpers ---

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✔ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg: string) => console.error(`${colors.red}✖ ${msg}${colors.reset}`),
  step: (msg: string) => {
    console.log(`\n${colors.magenta}============================================================${colors.reset}`);
    console.log(`${colors.magenta}⚙️ ${msg}${colors.reset}`);
    console.log(`${colors.magenta}============================================================${colors.reset}\n`);
  },
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Asks the user a question and returns their answer.
 * @param query The question to display.
 * @param defaultValue A default value if the user provides no input.
 */
function question(query: string, defaultValue?: string): Promise<string> {
  const formattedQuery = defaultValue ? `${query} (${defaultValue}) ` : `${query} `;
  return new Promise((resolve) =>
    rl.question(formattedQuery, (ans) => {
      resolve(ans || defaultValue || '');
    })
  );
}

/**
 * Displays a spinner while a promise is executing.
 * @param promise The promise to await.
 * @param message The message to display next to the spinner.
 */
async function withSpinner<T>(promise: Promise<T>, message: string): Promise<T> {
  const spinnerChars = ['|', '/', '-', '\\'];
  let i = 0;
  process.stdout.write(`${colors.cyan}⏳ ${message} ${spinnerChars[i]}${colors.reset}`);
  const interval = setInterval(() => {
    i = (i + 1) % spinnerChars.length;
    process.stdout.write(`\r${colors.cyan}⏳ ${message} ${spinnerChars[i]}${colors.reset}`);
  }, 100);

  try {
    const result = await promise;
    clearInterval(interval);
    process.stdout.write(`\r`); // Clear the spinner line
    return result;
  } catch (error) {
    clearInterval(interval);
    process.stdout.write(`\r`); // Clear the spinner line
    throw error;
  }
}

// --- Setup Functions ---

/**
 * Verifies that Docker and Stripe CLI are installed and configured.
 */
async function checkPrerequisites() {
  log.step('Step 1: Checking Prerequisites');

  // 1. Check Docker
  try {
    await execAsync('docker info');
    log.success('Docker is installed and running.');
  } catch (error) {
    log.error('Docker is not installed or the daemon is not running.');
    log.info('Please install Docker and ensure it is running before proceeding.');
    log.info('🔗 https://docs.docker.com/get-docker/');
    process.exit(1);
  }

  // 2. Check Stripe CLI
  try {
    await execAsync('stripe --version');
    log.success('Stripe CLI is installed.');
  } catch (error) {
    log.error('Stripe CLI is not installed.');
    log.info('Please install it by following the instructions here:');
    log.info('🔗 https://docs.stripe.com/stripe-cli');
    process.exit(1);
  }

  // 3. Check Stripe Authentication
  try {
    await execAsync('stripe config --list');
    log.success('Stripe CLI is authenticated.');
  } catch (error) {
    log.warn('Stripe CLI is not authenticated.');
    log.info('Please run the command: stripe login');
    const answer = await question('Have you completed the authentication? (y/n): ', 'y');
    if (answer.toLowerCase() !== 'y') {
      log.error('Please authenticate with Stripe CLI and run this script again.');
      process.exit(1);
    }
  }
}

interface PostgresConfig {
  url: string;
  containerName?: string;
  version?: string;
}

/**
 * Configures the PostgreSQL database, either locally with Docker or remotely.
 */
async function setupPostgres(): Promise<PostgresConfig> {
  log.step('Step 2: Configuring PostgreSQL Database');
  const choice = await question('Use a local Docker instance (L) or a remote instance (R)? (L/R): ', 'L');

  if (choice.toLowerCase() === 'l') {
    return setupLocalPostgres();
  }

  log.info('You can find hosted PostgreSQL databases on platforms like:');
  log.info('🔗 https://vercel.com/integrations#databases');
  const remoteUrl = await question('Enter your POSTGRES_URL: ');
  if (!remoteUrl.startsWith('postgres://') && !remoteUrl.startsWith('postgresql://')) {
    log.error('The PostgreSQL URL must start with "postgres://" or "postgresql://".');
    process.exit(1);
  }
  return { url: remoteUrl };
}

/**
 * Sets up a local PostgreSQL instance via Docker Compose.
 */
async function setupLocalPostgres(): Promise<PostgresConfig> {
  const postgresVersion = await question('Enter the Postgres Alpine version to use:', '17');
  const containerName = await question('Enter a name for the Docker container:', 'sass_starter_core_db');
  
  const dbName = await question('Database name:', 'postgres');
  const dbUser = await question('Database user:', 'postgres');
  const defaultPassword = crypto.randomBytes(16).toString('hex');
  const dbPassword = await question('Database password:', defaultPassword);
  const dbPort = await question('External port for the database:', '5432');

  const dockerComposeContent = `
services:
  postgres:
    image: postgres:${postgresVersion}-alpine
    container_name: ${containerName}
    environment:
      POSTGRES_DB: ${dbName}
      POSTGRES_USER: ${dbUser}
      POSTGRES_PASSWORD: ${dbPassword}
    ports:
      - "${dbPort}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
`;

  await fs.writeFile('docker-compose.yml', dockerComposeContent.trim());
  log.success('docker-compose.yml file created.');

  try {
    await withSpinner(
      execAsync('docker compose up -d'),
      'Starting Docker container...'
    );
    log.success(`Docker container "${containerName}" started successfully.`);
  } catch (error) {
    log.error('Failed to start Docker container.');
    console.error(error);
    process.exit(1);
  }

  const url = `postgresql://${dbUser}:${dbPassword}@localhost:${dbPort}/${dbName}`;
  return { url, containerName, version: postgresVersion };
}

/**
 * Prompts the user for their Stripe Secret Key.
 */
async function getStripeSecretKey(): Promise<string> {
  log.step('Step 3: Configuring Stripe');
  log.info('You can find your secret key on your Stripe Dashboard:');
  log.info('🔗 https://dashboard.stripe.com/test/apikeys');
  const key = await question('Enter your Stripe Secret Key (sk_test_...): ');
  if (!key.startsWith('sk_test_')) {
    log.warn('This key does not look like a test key. Please ensure you are using the correct key for your environment.');
  }
  return key;
}

/**
 * Creates a Stripe webhook and retrieves the secret.
 */
async function createStripeWebhook(): Promise<string> {
  log.info('Creating a Stripe webhook for local events...');
  try {
    const promise = execAsync('stripe listen --print-secret');
    const { stdout } = await withSpinner(promise, 'Waiting for webhook secret...');
    const match = stdout.match(/whsec_[a-zA-Z0-9]+/);
    if (!match) {
      throw new Error('Could not extract the Stripe webhook secret.');
    }
    log.success('Stripe webhook secret retrieved.');
    return match[0];
  } catch (error) {
    log.error('Failed to create Stripe webhook.');
    if (os.platform() === 'win32') {
      log.warn('On Windows, you may need to run this script as an administrator.');
    }
    console.error(error);
    process.exit(1);
  }
}

/**
 * Generates a secure secret for authentication.
 */
function generateAuthSecret(): string {
  log.step('Step 4: Generating Secrets');
  const secret = crypto.randomBytes(32).toString('hex');
  log.success('Authentication secret (AUTH_SECRET) generated.');
  return secret;
}

/**
 * Writes the environment variables to a .env file.
 */
async function writeEnvFile(envVars: Record<string, string>) {
  log.step('Step 5: Creating Environment File');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');

  await fs.writeFile('.env', envContent);
  log.success('The .env file has been created successfully.');
}

// --- Main Execution ---

async function main() {
  console.clear();
  log.info("Welcome to the SaaS Starter project setup script!");
  log.info("This script will guide you through the environment configuration.");

  const summary = new Map<string, string>();

  try {
    await checkPrerequisites();
    
    const postgresConfig = await setupPostgres();
    summary.set('Database Type', postgresConfig.containerName ? 'Local (Docker)' : 'Remote');
    if (postgresConfig.containerName) {
      summary.set('Docker Container Name', postgresConfig.containerName);
    }
    if (postgresConfig.version) {
        summary.set('Postgres Version', `${postgresConfig.version}-alpine`);
    }
    summary.set('PostgreSQL URL', postgresConfig.url);
    
    const STRIPE_SECRET_KEY = await getStripeSecretKey();
    summary.set('Stripe Secret Key', `${STRIPE_SECRET_KEY.substring(0, 12)}... (hidden)`);
    
    const STRIPE_WEBHOOK_SECRET = await createStripeWebhook();
    summary.set('Stripe Webhook Secret', `${STRIPE_WEBHOOK_SECRET.substring(0, 15)}... (hidden)`);

    const AUTH_SECRET = generateAuthSecret();
    summary.set('Auth Secret', 'Generated successfully (hidden)');

    const BASE_URL = 'http://localhost:3000';
    summary.set('Base URL', BASE_URL);

    const envVars = {
      POSTGRES_URL: postgresConfig.url,
      STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET,
      BASE_URL,
      AUTH_SECRET,
    };

    await writeEnvFile(envVars);
    summary.set('.env File', 'Created successfully in project root');
    
    // Final report
    console.log(`\n${colors.green}============================================================${colors.reset}`);
    console.log(`${colors.green}🎉 Setup completed successfully! 🎉${colors.reset}`);
    console.log(`${colors.green}============================================================${colors.reset}\n`);
    
    console.log('--- SETUP SUMMARY ---');
    for (const [key, value] of summary.entries()) {
      console.log(`${colors.yellow}${key.padEnd(25, '.')}:${colors.reset} ${value}`);
    }
    console.log('---------------------\n');

    log.info("Next Steps:");
    log.info("1. In a new terminal, run 'npm run db:push' to sync your database schema.");
    log.info("2. (Optional) Run 'npm run db:seed' to populate the database with initial data.");
    log.info("3. In another terminal, run 'stripe listen --forward-to localhost:3000/api/webhooks/stripe' to handle webhooks.");
    log.info("4. Run 'npm run dev' to start your application.");

  } catch (error) {
    log.error('The setup script encountered an unexpected error.');
    console.error(error);
  } finally {
    rl.close();
  }
}

main();