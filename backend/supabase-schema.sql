-- Bismi PG Management App - Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ==================== ROOMS TABLE ====================
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  floor INTEGER DEFAULT 1,
  room_type TEXT DEFAULT 'Non-AC',
  sharing_type INTEGER NOT NULL,
  total_beds INTEGER NOT NULL,
  occupied_beds INTEGER DEFAULT 0,
  rent_per_bed NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Available',
  maintenance_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== BEDS TABLE ====================
CREATE TABLE IF NOT EXISTS beds (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL,
  status TEXT DEFAULT 'Vacant',
  customer_id INTEGER
);

-- ==================== CUSTOMERS TABLE ====================
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
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
  room_id INTEGER REFERENCES rooms(id),
  bed_id INTEGER REFERENCES beds(id),
  check_in_date DATE,
  check_out_date DATE,
  security_deposit NUMERIC DEFAULT 0,
  monthly_rent NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for beds.customer_id after customers table exists
ALTER TABLE beds ADD CONSTRAINT fk_beds_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- ==================== PAYMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_type TEXT DEFAULT 'Rent',
  payment_method TEXT DEFAULT 'Cash',
  payment_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  month TEXT,
  year INTEGER,
  status TEXT DEFAULT 'Paid',
  invoice_number TEXT,
  late_fee NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ELECTRICITY TABLE ====================
CREATE TABLE IF NOT EXISTS electricity (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  previous_reading NUMERIC DEFAULT 0,
  current_reading NUMERIC DEFAULT 0,
  units_consumed NUMERIC DEFAULT 0,
  rate_per_unit NUMERIC DEFAULT 8,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== EXPENSES TABLE ====================
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  vendor TEXT,
  payment_method TEXT DEFAULT 'Cash',
  expense_date DATE DEFAULT CURRENT_DATE,
  receipt_photo TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ISSUES TABLE ====================
CREATE TABLE IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'Normal',
  status TEXT DEFAULT 'Open',
  admin_response TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== SETTINGS TABLE ====================
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT
);

-- ==================== DEFAULT SETTINGS ====================
INSERT INTO settings (key, value) VALUES
  ('hostel_name', 'BISMI MEN''S PLAZA'),
  ('owner_phone', ''),
  ('electricity_rate', '8'),
  ('late_fee_per_day', '50'),
  ('app_name', 'Bismi PG Management App'),
  ('developer', 'ASVEN Technology'),
  ('upi_id', '9894092449@jupiteraxis'),
  ('payment_phone', '9894092449')
ON CONFLICT (key) DO NOTHING;

-- ==================== DEFAULT ROOMS FOR BISMI MEN'S PLAZA ====================
-- Only insert if no rooms exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rooms LIMIT 1) THEN
    -- 4 rooms - 2 sharing
    INSERT INTO rooms (room_number, floor, sharing_type, total_beds, rent_per_bed) VALUES
      ('Room 1', 1, 2, 2, 0),
      ('Room 2', 1, 2, 2, 0),
      ('Room 3', 1, 2, 2, 0),
      ('Room 4', 1, 2, 2, 0),
      ('Room 5', 1, 3, 3, 0),
      ('Room 6', 1, 4, 4, 0),
      ('Room 7', 1, 4, 4, 0),
      ('Room 8', 1, 5, 5, 0);

    -- Insert beds for each room
    INSERT INTO beds (room_id, bed_number) 
    SELECT r.id, r.room_number || ' - Bed ' || b.n
    FROM rooms r
    CROSS JOIN generate_series(1, 5) AS b(n)
    WHERE b.n <= r.total_beds;
  END IF;
END $$;

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_room ON customers(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_room ON beds(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_month_year ON payments(month, year);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_issues_customer ON issues(customer_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_electricity_room ON electricity(room_id);

-- ==================== ROW LEVEL SECURITY (RLS) ====================
-- Enable RLS on all tables (but allow service_role full access)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE electricity ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service_role (backend) full access to all tables
CREATE POLICY "Service role full access" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON beds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON electricity FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON settings FOR ALL USING (true) WITH CHECK (true);

-- ==================== STORAGE BUCKET ====================
-- Create a storage bucket for file uploads (ID proofs, receipts)
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to uploads
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

-- Allow service role to upload
CREATE POLICY "Service role upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Service role delete" ON storage.objects FOR DELETE USING (bucket_id = 'uploads');
