import { createHash } from 'crypto';
import { pool } from './pool.js';

export async function saveSnapshot(service, config) {
  const hash = createHash('sha256')
    .update(JSON.stringify(config))
    .digest('hex');
  
  const result = await pool.query(
    `INSERT INTO snapshots (service, config, hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [service, JSON.stringify(config), hash]
  );
  
  return result.rows[0];
}

export async function getLatestSnapshot(service) {
  const result = await pool.query(
    `SELECT * FROM snapshots
     WHERE service = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [service]
  );
  
  return result.rows[0] || null;
}

export async function getSnapshots(service, limit = 20) {
  const result = await pool.query(
    `SELECT id, service, hash, created_at
     FROM snapshots
     WHERE service = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [service, limit]
  );
  
  return result.rows;
}

export async function getSnapshotById(id) {
  const result = await pool.query(
    `SELECT * FROM snapshots WHERE id = $1`,
    [id]
  );
  
  return result.rows[0] || null;
}
