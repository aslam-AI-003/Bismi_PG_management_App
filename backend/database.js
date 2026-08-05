const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'bismi_pg.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  -- Rooms table
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT NOT NULL UNIQUE,
    floor INTEGER DEFAULT 1,
    room_type TEXT DEFAULT 'Non-AC',
    sharing_type INTEGER NOT NULL,
    total_beds INTEGER NOT NULL,
    occupied_beds INTEGER DEFAULT 0,
    rent_per_bed REAL DEFAULT 0,
    status TEXT DEFAULT 'Available',
    maintenance_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Beds table
  CREATE TABLE IF NOT EXISTS beds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    bed_number TEXT NOT NULL,
    status TEXT DEFAULT 'Vacant',
    customer_id INTEGER,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );

  -- Customers table
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    emergency_contact TEXT,
    emergency_name TEXT,
    aadhaar_number TEXT,
    aadhaar_photo TEXT,
    id_proof_photo TEXT,
    photo TEXT,
    address TEXT,
    room_id INTEGER,
    bed_id INTEGER,
    check_in_date DATE,
    check_out_date DATE,
    security_deposit REAL DEFAULT 0,
    monthly_rent REAL DEFAULT 0,
    status TEXT DEFAULT 'Active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (bed_id) REFERENCES beds(id)
  );

  -- Payments table
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_type TEXT DEFAULT 'Rent',
    payment_method TEXT DEFAULT 'Cash',
    payment_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    month TEXT,
    year INTEGER,
    status TEXT DEFAULT 'Paid',
    invoice_number TEXT,
    late_fee REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  -- Electricity readings table
  CREATE TABLE IF NOT EXISTS electricity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    previous_reading REAL DEFAULT 0,
    current_reading REAL DEFAULT 0,
    units_consumed REAL DEFAULT 0,
    rate_per_unit REAL DEFAULT 8,
    total_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );

  -- Expenses table
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    vendor TEXT,
    payment_method TEXT DEFAULT 'Cash',
    expense_date DATE DEFAULT CURRENT_DATE,
    receipt_photo TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Settings table
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT
  );
`);

// Insert default settings
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
insertSetting.run('hostel_name', "BISMI MEN'S PLAZA");
insertSetting.run('owner_phone', '');
insertSetting.run('electricity_rate', '8');
insertSetting.run('late_fee_per_day', '50');
insertSetting.run('app_name', 'Bismi PG Management App');
insertSetting.run('developer', 'ASVEN Technology');
insertSetting.run('upi_id', '9894092449@jupiteraxis');
insertSetting.run('payment_phone', '9894092449');

// Insert default rooms for BISMI MEN'S PLAZA
const insertRoom = db.prepare('INSERT OR IGNORE INTO rooms (room_number, floor, sharing_type, total_beds, rent_per_bed) VALUES (?, ?, ?, ?, ?)');
const insertBed = db.prepare('INSERT OR IGNORE INTO beds (room_id, bed_number) VALUES (?, ?)');

const existingRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get();
if (existingRooms.count === 0) {
  // 4 rooms - 2 sharing
  for (let i = 1; i <= 4; i++) {
    const result = insertRoom.run('Room ' + i, 1, 2, 2, 0);
    for (let b = 1; b <= 2; b++) {
      insertBed.run(result.lastInsertRowid, 'Room ' + i + ' - Bed ' + b);
    }
  }
  // 1 room - 3 sharing
  const r5 = insertRoom.run('Room 5', 1, 3, 3, 0);
  for (let b = 1; b <= 3; b++) {
    insertBed.run(r5.lastInsertRowid, 'Room 5 - Bed ' + b);
  }
  // 2 rooms - 4 sharing
  for (let i = 6; i <= 7; i++) {
    const result = insertRoom.run('Room ' + i, 1, 4, 4, 0);
    for (let b = 1; b <= 4; b++) {
      insertBed.run(result.lastInsertRowid, 'Room ' + i + ' - Bed ' + b);
    }
  }
  // 1 room - 5 sharing
  const r8 = insertRoom.run('Room 8', 1, 5, 5, 0);
  for (let b = 1; b <= 5; b++) {
    insertBed.run(r8.lastInsertRowid, 'Room 8 - Bed ' + b);
  }
}

module.exports = db;
