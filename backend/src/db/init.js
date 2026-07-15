/**
 * Database Initialization Script
 * Connects to Railway MySQL and creates the schema tables
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'hayabusa.proxy.rlwy.net',
    port: parseInt(process.env.DB_PORT) || 13739,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'MKdlinbqvDQFnNJyVVafGDCCkOFXHXiZ',
    database: process.env.DB_NAME || 'railway',
  });

  try {
    console.log('Connected to Railway MySQL database');

    // Read and execute schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await connection.execute(statement);
        console.log('✓ Executed:', statement.substring(0, 50) + '...');
      } catch (err) {
        if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
          console.error('✗ Error executing statement:', err.message);
          console.error('Statement:', statement.substring(0, 100));
        }
      }
    }

    console.log('\n✅ Database schema initialized successfully');

    // Verify tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📋 Tables in database:');
    tables.forEach(row => {
      console.log('  -', Object.values(row)[0]);
    });

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = initDatabase;
