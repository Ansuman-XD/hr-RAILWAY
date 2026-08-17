const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function optimizeDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    console.log('Applying database schema optimizations...');
    await pool.query(schemaSql);
    console.log('Database optimizations applied successfully.');
  } catch (error) {
    console.error('Failed to optimize database:', error);
  } finally {
    await pool.end();
  }
}

optimizeDb();
