"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const pool = new pg_1.Pool({
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
    }
    catch (err) {
        console.error('Error seeding users:', err);
    }
    finally {
        pool.end();
    }
}
run();
