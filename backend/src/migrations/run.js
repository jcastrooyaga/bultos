require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL PRIMARY KEY,
        filename    TEXT UNIQUE NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const applied = await client.query(
        'SELECT id FROM _migrations WHERE filename = $1',
        [file]
      );
      if (applied.rows.length) {
        console.log(`  [skip] ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`  [run]  ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  [ok]   ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  [fail] ${file}:`, err.message);
        throw err;
      }
    }

    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
