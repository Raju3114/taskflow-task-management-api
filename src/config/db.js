const { Pool } = require('pg');
require('dotenv').config();

const isTestEnv = process.env.NODE_ENV === 'test';

// Select database config based on execution environment
const host = isTestEnv ? (process.env.TEST_DB_HOST || 'localhost') : (process.env.DB_HOST || 'localhost');
const port = parseInt(isTestEnv ? (process.env.TEST_DB_PORT || '5432') : (process.env.DB_PORT || '5432'), 10);
const database = isTestEnv ? process.env.TEST_DB_NAME : process.env.DB_NAME;
const user = isTestEnv ? (process.env.TEST_DB_USER || process.env.DB_USER) : process.env.DB_USER;
const password = isTestEnv ? (process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD) : process.env.DB_PASSWORD;

// Validate that required database environment variables are set
if (!database) {
  const missingVar = isTestEnv ? 'TEST_DB_NAME' : 'DB_NAME';
  throw new Error(`Database Configuration Error: Missing required environment variable '${missingVar}'. Please check your .env file.`);
}

// Strict safeguard: ensure test environment never uses development database
if (isTestEnv) {
  if (process.env.DB_NAME && database === process.env.DB_NAME) {
    throw new Error(
      `Database Security Guard Error: TEST_DB_NAME ('${database}') must not be identical to DB_NAME ('${process.env.DB_NAME}'). Aborting test run to prevent accidental development data loss.`
    );
  }
}

// Initialize PostgreSQL connection pool
const pool = new Pool({
  host,
  port,
  database,
  user,
  password,
  max: 10, // Maximum pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Executes a parameterized SQL query using the connection pool.
 * @param {string} text - SQL query string with $1, $2 parameters
 * @param {Array} params - Array of parameter values
 * @returns {Promise<import('pg').QueryResult>} Query result object
 */
const query = (text, params) => pool.query(text, params);

/**
 * Gracefully terminates all active database connections in the pool.
 * @returns {Promise<void>}
 */
const closePool = () => pool.end();

/**
 * Validates that the current execution environment is safe for destructive test cleanup operations.
 */
const validateTestDatabaseGuard = () => {
  if (!isTestEnv) {
    throw new Error('Security Error: Destructive test teardown operations are strictly restricted to NODE_ENV=test.');
  }
  if (!database || (process.env.DB_NAME && database === process.env.DB_NAME)) {
    throw new Error('Security Error: Test runner detected unsafe database configuration pointing to non-test database.');
  }
};

module.exports = {
  pool,
  query,
  closePool,
  validateTestDatabaseGuard,
};
