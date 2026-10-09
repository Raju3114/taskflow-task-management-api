require('dotenv').config();
const app = require('./app');
const { closePool } = require('./config/db');

const PORT = process.env.PORT || 3000;

let server;

try {
  server = app.listen(PORT, () => {
    console.log(`TaskFlow API server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
} catch (err) {
  console.error('Failed to start TaskFlow API server:', err.message);
  process.exit(1);
}

/**
 * Handles graceful shutdown signal from process (SIGINT / SIGTERM)
 */
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP listener stopped.');
      try {
        await closePool();
        console.log('PostgreSQL connection pool safely closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error closing database pool during shutdown:', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = server;
