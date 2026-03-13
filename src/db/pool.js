import pg from 'pg';
import { logger } from '../logger.js';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  logger.error('Database pool error:', err);
});

export { pool };
