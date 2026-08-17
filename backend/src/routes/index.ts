import { Router } from 'express';
import employeesRouter from './employees';
import { pool } from '../config/db';
import { randomUUID } from 'crypto';

const router = Router();

function formatDate(d: any): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d.split('T')[0];
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return null;
}

router.use('/employees', employeesRouter);

// Designations
router.get('/designations', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT name FROM designations ORDER BY name');
    res.json(rows.map(r => r.name));
  } catch (error) { next(error); }
});

// Batches
router.get('/batches', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT name FROM batches ORDER BY name');
    res.json(rows.map(r => r.name));
  } catch (error) { next(error); }
});

// Service Events
router.get('/events', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM service_events ORDER BY date DESC');
    res.json(rows.map(r => ({
      id: r.id,
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      type: r.type,
      from: r.from_location,
      to: r.to_location,
      date: formatDate(r.date),
      remarks: r.remarks,
      recordedBy: r.recorded_by
    })));
  } catch (error) { next(error); }
});

// DAR Records
router.get('/dar', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM dar_records ORDER BY date DESC');
    res.json(rows.map(r => ({
      id: r.id,
      employeeId: r.employee_id,
      type: r.type,
      date: formatDate(r.date),
      description: r.description,
      reference: r.reference,
      recordedBy: r.recorded_by
    })));
  } catch (error) { next(error); }
});

// Reward Records
router.get('/rewards', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM reward_records ORDER BY date DESC');
    res.json(rows.map(r => ({
      id: r.id,
      employeeId: r.employee_id,
      type: r.type,
      date: formatDate(r.date),
      description: r.description,
      reference: r.reference,
      recordedBy: r.recorded_by
    })));
  } catch (error) { next(error); }
});



// Designations POST/PUT/DELETE
router.post('/designations', async (req, res, next) => {
  try {
    const { name } = req.body;
    await pool.query('INSERT INTO designations (name) VALUES ($1)', [name]);
    res.status(201).json({ message: 'Created' });
  } catch (error) { next(error); }
});

router.put('/designations/:oldName', async (req, res, next) => {
  try {
    const { oldName } = req.params;
    const { name } = req.body;
    await pool.query('UPDATE designations SET name = $1 WHERE name = $2', [name, oldName]);
    res.json({ message: 'Updated' });
  } catch (error) { next(error); }
});

router.delete('/designations/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    await pool.query('DELETE FROM designations WHERE name = $1', [name]);
    res.json({ message: 'Deleted' });
  } catch (error) { next(error); }
});

// Batches POST/PUT/DELETE
router.post('/batches', async (req, res, next) => {
  try {
    const { name } = req.body;
    await pool.query('INSERT INTO batches (name) VALUES ($1)', [name]);
    res.status(201).json({ message: 'Created' });
  } catch (error) { next(error); }
});

router.put('/batches/:oldName', async (req, res, next) => {
  try {
    const { oldName } = req.params;
    const { name } = req.body;
    await pool.query('UPDATE batches SET name = $1 WHERE name = $2', [name, oldName]);
    res.json({ message: 'Updated' });
  } catch (error) { next(error); }
});

router.delete('/batches/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    await pool.query('DELETE FROM batches WHERE name = $1', [name]);
    res.json({ message: 'Deleted' });
  } catch (error) { next(error); }
});

// Events POST
router.post('/events', async (req, res, next) => {
  try {
    const { id, employeeId, employeeName, type, from, to, date, remarks, recordedBy } = req.body;
    await pool.query(
      'INSERT INTO service_events (id, employee_id, employee_name, type, from_location, to_location, date, remarks, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, employeeId, employeeName, type, from, to, date, remarks, recordedBy]
    );
    res.status(201).json({ message: 'Created' });
  } catch (error) { next(error); }
});

// DAR POST
router.post('/dar', async (req, res, next) => {
  try {
    const { id, employeeId, type, date, description, reference, recordedBy } = req.body;
    await pool.query(
      'INSERT INTO dar_records (id, employee_id, type, date, description, reference, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, employeeId, type, date, description, reference, recordedBy]
    );
    res.status(201).json({ message: 'Created' });
  } catch (error) { next(error); }
});

// Rewards POST
router.post('/rewards', async (req, res, next) => {
  try {
    const { id, employeeId, type, date, description, reference, recordedBy } = req.body;
    await pool.query(
      'INSERT INTO reward_records (id, employee_id, type, date, description, reference, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, employeeId, type, date, description, reference, recordedBy]
    );
    res.status(201).json({ message: 'Created' });
  } catch (error) { next(error); }
});



// GET /api/session
router.get('/session', (req, res) => {
  const sessionCookie = req.cookies?.sbc_session;
  if (!sessionCookie) {
    return res.json({ authenticated: false, user: null });
  }
  
  try {
    const user = JSON.parse(sessionCookie);
    res.json({
      authenticated: true,
      user
    });
  } catch (err) {
    res.json({ authenticated: false, user: null });
  }
});

// POST /api/login
router.post('/login', async (req, res, next) => {
  try {
    const { role, password } = req.body;
    
    const { rows } = await pool.query('SELECT * FROM users WHERE role = $1 AND password = $2', [role, password]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid role or password' });
    }
    
    const userPayload = {
      role: rows[0].role,
      name: rows[0].name,
      username: rows[0].username,
      loginAt: new Date().toISOString()
    };
    
    // Set a cookie (HttpOnly could be true for production, but false is fine for this demo/LAN setup if needed, let's keep it basic)
    res.cookie('sbc_session', JSON.stringify(userPayload), { 
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    res.json({
      authenticated: true,
      user: userPayload
    });
  } catch (error) { next(error); }
});

// POST /api/logout
router.post('/logout', (req, res) => {
  res.clearCookie('sbc_session');
  res.json({ message: 'Logged out' });
});

export default router;
