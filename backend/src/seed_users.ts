import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query(`
      INSERT INTO users (username, password, name, role)
      VALUES 
        ('admin', 'hr123', 'HR Manager', 'hr_manager'),
        ('roster', 'roster123', 'Roster Manager', 'roster_manager')
      ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password;
    `);
    console.log('Users seeded successfully.');
  } catch (err) {
    console.error('Error seeding users:', err);
  } finally {
    pool.end();
  }
}

run();
