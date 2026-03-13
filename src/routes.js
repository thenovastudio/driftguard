import { Router } from 'express';
import { pool } from './db/pool.js';
import { getSnapshots, getLatestSnapshot, getSnapshotById } from './db/snapshots.js';
import { detectChanges } from './diff.js';
import { pollQueue } from './worker.js';

export const router = Router();

// List services
router.get('/services', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get snapshots for a service
router.get('/services/:service/snapshots', async (req, res) => {
  try {
    const snapshots = await getSnapshots(req.params.service, 20);
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get diff between last two snapshots
router.get('/services/:service/diff', async (req, res) => {
  try {
    const snapshots = await getSnapshots(req.params.service, 2);
    
    if (snapshots.length < 2) {
      return res.json({ message: 'Need at least 2 snapshots to diff', changes: [] });
    }
    
    const [newer, older] = snapshots;
    const olderFull = await getSnapshotById(older.id);
    const newerFull = await getSnapshotById(newer.id);
    
    const changes = detectChanges(olderFull.config, newerFull.config);
    
    res.json({
      service: req.params.service,
      from_snapshot: older.id,
      to_snapshot: newer.id,
      changes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger manual poll
router.post('/services/:service/poll', async (req, res) => {
  try {
    const job = await pollQueue.add(`manual-${req.params.service}`, {
      service: req.params.service,
    }, { priority: 1 });
    
    res.json({ message: 'Poll queued', jobId: job.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent changes
router.get('/changes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const result = await pool.query(
      `SELECT c.*, s.name as service_name
       FROM changes c
       JOIN services s ON c.service = s.id
       ORDER BY c.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Acknowledge a change
router.post('/changes/:id/acknowledge', async (req, res) => {
  try {
    await pool.query(
      'UPDATE changes SET acknowledged = true WHERE id = $1',
      [req.params.id]
    );
    res.json({ message: 'Acknowledged' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
