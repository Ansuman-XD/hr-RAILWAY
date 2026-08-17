"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../config/db");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
function formatDate(d) {
    if (!d)
        return null;
    if (typeof d === 'string')
        return d.split('T')[0];
    if (d instanceof Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    return null;
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const dir = path_1.default.join(process.cwd(), 'uploads', 'photos');
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname) || '.jpg';
        cb(null, `${req.params.id}-${Date.now()}${ext}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
router.get('/', async (req, res, next) => {
    try {
        const { rows } = await db_1.pool.query(`
      SELECT 
        e.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', d.id,
                'name', d.name,
                'fileName', d.file_name
              )
            )
            FROM employee_documents d
            WHERE d.employee_id = e.id
          ),
          '[]'::json
        ) as documents
      FROM employees e
    `);
        // Map snake_case to camelCase
        const employees = rows.map(row => ({
            id: row.id,
            photo: row.photo,
            name: row.name,
            gender: row.gender,
            tokenNo: row.token_no,
            hrmsId: row.hrms_id,
            batch: row.batch,
            designation: row.designation,
            phone: row.phone,
            email: row.email,
            bloodGroup: row.blood_group,
            emergencyContact: row.emergency_contact,
            address: row.address,
            aadhaar: row.aadhaar,
            pan: row.pan,
            pfNumber: row.pf_number,
            dob: formatDate(row.dob),
            doa: formatDate(row.doa),
            qualification: row.qualification,
            status: row.status,
            actualRetirementDate: formatDate(row.actual_retirement_date),
            earlyRetirementReason: row.early_retirement_reason,
            documents: row.documents
        }));
        res.json(employees);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rows } = await db_1.pool.query(`
      SELECT 
        e.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', d.id,
                'name', d.name,
                'fileName', d.file_name,
                'dataUrl', d.data_url
              )
            )
            FROM employee_documents d
            WHERE d.employee_id = e.id
          ),
          '[]'::json
        ) as documents
      FROM employees e
      WHERE e.id = $1
    `, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        const row = rows[0];
        res.json({
            id: row.id,
            photo: row.photo,
            name: row.name,
            gender: row.gender,
            tokenNo: row.token_no,
            hrmsId: row.hrms_id,
            batch: row.batch,
            designation: row.designation,
            phone: row.phone,
            email: row.email,
            bloodGroup: row.blood_group,
            emergencyContact: row.emergency_contact,
            address: row.address,
            aadhaar: row.aadhaar,
            pan: row.pan,
            pfNumber: row.pf_number,
            dob: formatDate(row.dob),
            doa: formatDate(row.doa),
            qualification: row.qualification,
            status: row.status,
            actualRetirementDate: formatDate(row.actual_retirement_date),
            earlyRetirementReason: row.early_retirement_reason,
            documents: row.documents
        });
    }
    catch (error) {
        next(error);
    }
});
const emptyToNull = (val) => (val === '' ? null : val);
router.post('/', async (req, res, next) => {
    const client = await db_1.pool.connect();
    try {
        const data = req.body;
        await client.query('BEGIN');
        await client.query(`
      INSERT INTO employees (
        id, photo, name, gender, token_no, hrms_id, batch, designation, 
        phone, email, blood_group, emergency_contact, address, aadhaar, 
        pan, pf_number, dob, doa, qualification, status, actual_retirement_date, 
        early_retirement_reason
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 
        $9, $10, $11, $12, $13, $14, 
        $15, $16, $17, $18, $19, $20, $21, 
        $22
      )
    `, [
            data.id, data.photo || null, data.name, data.gender, data.tokenNo, data.hrmsId, emptyToNull(data.batch), emptyToNull(data.designation),
            data.phone, data.email || null, data.bloodGroup || null, data.emergencyContact, data.address, data.aadhaar,
            data.pan, data.pfNumber, emptyToNull(data.dob), emptyToNull(data.doa), data.qualification, data.status, emptyToNull(data.actualRetirementDate),
            data.earlyRetirementReason || null
        ]);
        if (data.documents && Array.isArray(data.documents)) {
            for (const doc of data.documents) {
                await client.query(`
          INSERT INTO employee_documents (id, employee_id, name, file_name, data_url)
          VALUES ($1, $2, $3, $4, $5)
        `, [doc.id, data.id, doc.name, doc.fileName, doc.dataUrl]);
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ message: 'Created' });
    }
    catch (error) {
        await client.query('ROLLBACK');
        next(error);
    }
    finally {
        client.release();
    }
});
router.put('/:id', async (req, res, next) => {
    const client = await db_1.pool.connect();
    try {
        const { id } = req.params;
        const data = req.body;
        await client.query('BEGIN');
        await client.query(`
      UPDATE employees SET
        photo = $2, name = $3, gender = $4, token_no = $5, hrms_id = $6, batch = $7, designation = $8, 
        phone = $9, email = $10, blood_group = $11, emergency_contact = $12, address = $13, aadhaar = $14, 
        pan = $15, pf_number = $16, dob = $17, doa = $18, qualification = $19, status = $20, actual_retirement_date = $21, 
        early_retirement_reason = $22, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [
            id, data.photo || null, data.name, data.gender, data.tokenNo, data.hrmsId, emptyToNull(data.batch), emptyToNull(data.designation),
            data.phone, data.email || null, data.bloodGroup || null, data.emergencyContact, data.address, data.aadhaar,
            data.pan, data.pfNumber, emptyToNull(data.dob), emptyToNull(data.doa), data.qualification, data.status, emptyToNull(data.actualRetirementDate),
            data.earlyRetirementReason || null
        ]);
        await client.query('DELETE FROM employee_documents WHERE employee_id = $1', [id]);
        if (data.documents && Array.isArray(data.documents)) {
            for (const doc of data.documents) {
                await client.query(`
          INSERT INTO employee_documents (id, employee_id, name, file_name, data_url)
          VALUES ($1, $2, $3, $4, $5)
        `, [doc.id, id, doc.name, doc.fileName, doc.dataUrl]);
            }
        }
        await client.query('COMMIT');
        res.json({ message: 'Updated' });
    }
    catch (error) {
        await client.query('ROLLBACK');
        next(error);
    }
    finally {
        client.release();
    }
});
router.post('/bulk', async (req, res, next) => {
    const client = await db_1.pool.connect();
    try {
        const { employees, batches, designations } = req.body;
        await client.query('BEGIN');
        // Bulk insert batches
        if (batches && batches.length > 0) {
            for (const b of batches) {
                await client.query('INSERT INTO batches (name) VALUES ($1) ON CONFLICT DO NOTHING', [b]);
            }
        }
        // Bulk insert designations
        if (designations && designations.length > 0) {
            for (const d of designations) {
                await client.query('INSERT INTO designations (name) VALUES ($1) ON CONFLICT DO NOTHING', [d]);
            }
        }
        // Bulk insert employees
        if (employees && employees.length > 0) {
            for (const data of employees) {
                await client.query(`
          INSERT INTO employees (
            id, photo, name, gender, token_no, hrms_id, batch, designation, 
            phone, email, blood_group, emergency_contact, address, aadhaar, 
            pan, pf_number, dob, doa, qualification, status, actual_retirement_date, 
            early_retirement_reason
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, 
            $9, $10, $11, $12, $13, $14, 
            $15, $16, $17, $18, $19, $20, $21, 
            $22
          ) ON CONFLICT (id) DO NOTHING
        `, [
                    data.id, data.photo || null, data.name, data.gender, data.tokenNo, data.hrmsId, emptyToNull(data.batch), emptyToNull(data.designation),
                    data.phone, data.email || null, data.bloodGroup || null, data.emergencyContact, data.address, data.aadhaar,
                    data.pan, data.pfNumber, emptyToNull(data.dob), emptyToNull(data.doa), data.qualification, data.status, emptyToNull(data.actualRetirementDate),
                    data.earlyRetirementReason || null
                ]);
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ message: 'Bulk import successful' });
    }
    catch (error) {
        await client.query('ROLLBACK');
        next(error);
    }
    finally {
        client.release();
    }
});
router.post('/:id/photo', upload.single('photo'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No photo uploaded' });
    }
    const photoUrl = `/uploads/photos/${req.file.filename}`;
    const { id } = req.params;
    try {
        await db_1.pool.query('UPDATE employees SET photo = $1 WHERE id = $2', [photoUrl, id]);
        res.json({ photoUrl });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
