CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS designations (
  name VARCHAR(255) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS batches (
  name VARCHAR(255) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(255) PRIMARY KEY,
  photo TEXT,
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(50) NOT NULL,
  token_no VARCHAR(100) NOT NULL,
  hrms_id VARCHAR(100) NOT NULL,
  batch VARCHAR(255),
  designation VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  blood_group VARCHAR(10),
  emergency_contact VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  aadhaar VARCHAR(50) NOT NULL,
  pan VARCHAR(50) NOT NULL,
  pf_number VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  doa DATE NOT NULL,
  qualification TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  actual_retirement_date DATE,
  early_retirement_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch) REFERENCES batches(name) ON DELETE SET NULL,
  FOREIGN KEY (designation) REFERENCES designations(name) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS employee_documents (
  id VARCHAR(255) PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  data_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS service_events (
  id VARCHAR(255) PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  remarks TEXT NOT NULL,
  recorded_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dar_records (
  id VARCHAR(255) PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference VARCHAR(255) NOT NULL,
  recorded_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reward_records (
  id VARCHAR(255) PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference VARCHAR(255) NOT NULL,
  recorded_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_batch ON employees(batch);
CREATE INDEX IF NOT EXISTS idx_employees_designation ON employees(designation);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_hrms_id ON employees(hrms_id);
CREATE INDEX IF NOT EXISTS idx_employees_token_no ON employees(token_no);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);

CREATE INDEX IF NOT EXISTS idx_service_events_employee_id ON service_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_dar_records_employee_id ON dar_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_reward_records_employee_id ON reward_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
