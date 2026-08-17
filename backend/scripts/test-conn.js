const fs = require('fs');
const { Pool } = require('pg');

function readEnv(path) {
  try {
    const txt = fs.readFileSync(path, 'utf8');
    const m = txt.match(/DATABASE_URL=(.*)/);
    return m ? m[1].trim() : null;
  } catch (e) { return null; }
}

(async () => {
  const dbUrl = process.env.DATABASE_URL || readEnv('backend/.env');
  if (!dbUrl) {
    console.error('No DATABASE_URL available');
    process.exit(2);
  }

  const pool = new Pool({ connectionString: dbUrl });
  try {
    const tStart = Date.now();
    const tConnStart = Date.now();
    const client = await pool.connect();
    const connMs = Date.now() - tConnStart;

    const tSqlStart = Date.now();
    const res = await client.query('SELECT pg_backend_pid() as pid, now() as now_ts');
    const sqlMs = Date.now() - tSqlStart;

    client.release();
    const totalMs = Date.now() - tStart;

    console.log(JSON.stringify({ connMs, sqlMs, totalMs, rows: res.rows }));
  } catch (err) {
    console.error('ERR', err);
  } finally {
    await pool.end();
  }
})();