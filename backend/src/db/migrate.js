/**
 * Database migration runner
 * Reads schema.sql and applies it against the configured MySQL database.
 * Run: node src/db/migrate.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    console.log('[Migrate] Connected to MySQL');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(schema);
    console.log('[Migrate] ✓ Schema applied successfully');
    console.log('[Migrate] ✓ Database "jobpulse_db" is ready');
    console.log('\nNext steps:');
    console.log('  1. Copy .env.example to .env and fill in your values');
    console.log('  2. node src/db/seed.js   ← seeds demo jobs');
    console.log('  3. npm run dev           ← starts server on :3001\n');
  } finally {
    await conn.end();
    process.exit(0);
  }
}

migrate().catch(err => {
  console.error('[Migrate] Fatal:', err.message);
  console.error('[Migrate] Make sure MySQL is running and DB_* vars are set in .env');
  process.exit(1);
});
