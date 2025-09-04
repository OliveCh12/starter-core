import { DatabaseError } from './connection';

/**
 * Utility function to handle database errors consistently
 */
export function handleDatabaseError(error: unknown, operation: string): never {
  console.error(`Database error in ${operation}:`, error);
  
  if (
    error instanceof Error && (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('connection') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('timeout')
    )
  ) {
    throw new DatabaseError('Database is not accessible. Please check if the database server is running.');
  }
  
  throw new DatabaseError(`Failed to ${operation.toLowerCase()}`);
}
