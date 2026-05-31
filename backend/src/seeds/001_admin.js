require('dotenv').config();

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const client = await pool.connect();
  try {
    const existing = await client.query(
      'SELECT id FROM admin_users WHERE username = $1',
      ['admin']
    );
    if (existing.rows.length) {
      console.log('Admin user already exists, skipping seed.');
      return;
    }

    const password_hash = await bcrypt.hash('admin', 12);
    await client.query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
      ['admin', password_hash]
    );
    console.log('Admin user created: username=admin password=admin');
    console.log('IMPORTANT: Change the admin password after first login!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
