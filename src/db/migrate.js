import { pool } from './pool.js';
import { logger } from '../logger.js';

export async function migrate() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id SERIAL PRIMARY KEY,
        service VARCHAR(50) NOT NULL,
        config JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        hash VARCHAR(64) NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_snapshots_service_created 
        ON snapshots(service, created_at DESC);
      
      CREATE TABLE IF NOT EXISTS changes (
        id SERIAL PRIMARY KEY,
        service VARCHAR(50) NOT NULL,
        old_snapshot_id INTEGER REFERENCES snapshots(id),
        new_snapshot_id INTEGER REFERENCES snapshots(id),
        diff JSONB NOT NULL,
        acknowledged BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_changes_service_created
        ON changes(service, created_at DESC);
        
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        config JSONB DEFAULT '{}',
        last_polled_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      INSERT INTO services (id, name) VALUES
        ('stripe', 'Stripe'),
        ('vercel', 'Vercel'),
        ('sendgrid', 'SendGrid')
      ON CONFLICT (id) DO NOTHING;
    `);
    
    logger.info('Database migration complete');
  } finally {
    client.release();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().then(() => process.exit(0));
}
