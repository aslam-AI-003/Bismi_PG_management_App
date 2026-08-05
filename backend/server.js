const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../frontend/build')));

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Database
const db = require('./database');

// ==================== DASHBOARD ====================
app.get('/api/dashboard', (req, res) => {
  try {
    const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
    const totalBeds = db.prepare('SELECT COUNT(*) as count FROM beds').get().count;
    const occupiedBeds = db.prepare("SELECT COUNT(*) as count FROM beds WHERE status = 'Occupied'").get().count;
    const vacantBeds = totalBeds - occupiedBeds;
    const activeCustomers = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'Active'").get().count;
    
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    
    const monthlyIncome = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE month = ? AND year = ? AND status = 'Paid'"
    ).get(currentMonth, currentYear).total;
    
    const monthlyExpense = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE strftime('%m', expense_date) = ? AND strftime('%Y', expense_date) = ?"
    ).get(String(new Date().getMonth() + 1).padStart(2, '0'), String(currentYear)).total;
    
    const pendingPayments = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Pending'"
    ).get().total;

    res.json({
      totalRooms,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      activeCustomers,
      monthlyIncome,
      monthlyExpense,
      pendingPayments,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ROOMS ====================
app.get('/api/rooms', (req, res) => {
  try {
    const rooms = db.prepare(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM beds WHERE room_id = r.id AND status = 'Occupied') as occupied_beds
      FROM rooms r ORDER BY r.room_number
    `).all();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/:id', (req, res) => {
  try {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
    const beds = db.prepare(`
      SELECT b.*, c.name as customer_name, c.phone as customer_phone 
      FROM beds b LEFT JOIN customers c ON b.customer_id = c.id 
      WHERE b.room_id = ?
    `).all(req.params.id);
    res.json({ ...room, beds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms', (req, res) => {
  try {
    const { room_number, floor, room_type, sharing_type, total_beds, rent_per_bed } = req.body;
    const result = db.prepare(
      'INSERT INTO rooms (room_number, floor, room_type, sharing_type, total_beds, rent_per_bed) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(room_number, floor || 1, room_type || 'Non-AC', sharing_type, total_beds, rent_per_bed || 0);
    
    // Create beds
    for (let b = 1; b <= total_beds; b++) {
      db.prepare('INSERT INTO beds (room_id, bed_number) VALUES (?, ?)').run(result.lastInsertRowid, `${room_number} - Bed ${b}`);
    }
    
    res.json({ id: result.lastInsertRowid, message: 'Room added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rooms/:id', (req, res) => {
  try {
    const { room_number, floor, room_type, sharing_type, rent_per_bed, status, maintenance_note } = req.body;
    db.prepare(
      'UPDATE rooms SET room_number=?, floor=?, room_type=?, sharing_type=?, rent_per_bed=?, status=?, maintenance_note=? WHERE id=?'
    ).run(room_number, floor, room_type, sharing_type, rent_per_bed, status, maintenance_note, req.params.id);
    res.json({ message: 'Room updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rooms/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM beds WHERE room_id = ?').run(req.params.id);
    db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CUSTOMERS ====================
app.get('/api/customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT c.*, r.room_number, b.bed_number 
      FROM customers c 
      LEFT JOIN rooms r ON c.room_id = r.id 
      LEFT JOIN beds b ON c.bed_id = b.id
      ORDER BY c.created_at DESC
    `).all();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/:id', (req, res) => {
  try {
    const customer = db.prepare(`
      SELECT c.*, r.room_number, b.bed_number 
      FROM customers c 
      LEFT JOIN rooms r ON c.room_id = r.id 
      LEFT JOIN beds b ON c.bed_id = b.id
      WHERE c.id = ?
    `).get(req.params.id);
    const payments = db.prepare('SELECT * FROM payments WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ ...customer, payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, phone, email, emergency_contact, emergency_name, aadhaar_number, address, room_id, bed_id, check_in_date, security_deposit, monthly_rent, notes } = req.body;
    
    const result = db.prepare(`
      INSERT INTO customers (name, phone, email, emergency_contact, emergency_name, aadhaar_number, address, room_id, bed_id, check_in_date, security_deposit, monthly_rent, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, phone, email, emergency_contact, emergency_name, aadhaar_number, address, room_id, bed_id, check_in_date, security_deposit || 0, monthly_rent || 0, notes);
    
    // Update bed status
    if (bed_id) {
      db.prepare("UPDATE beds SET status = 'Occupied', customer_id = ? WHERE id = ?").run(result.lastInsertRowid, bed_id);
      db.prepare("UPDATE rooms SET occupied_beds = occupied_beds + 1 WHERE id = ?").run(room_id);
    }
    
    res.json({ id: result.lastInsertRowid, message: 'Customer added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', (req, res) => {
  try {
    const { name, phone, email, emergency_contact, emergency_name, aadhaar_number, address, room_id, bed_id, monthly_rent, notes, status } = req.body;
    
    // If checking out
    if (status === 'Vacated') {
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
      if (customer.bed_id) {
        db.prepare("UPDATE beds SET status = 'Vacant', customer_id = NULL WHERE id = ?").run(customer.bed_id);
        db.prepare("UPDATE rooms SET occupied_beds = MAX(0, occupied_beds - 1) WHERE id = ?").run(customer.room_id);
      }
      db.prepare("UPDATE customers SET status = 'Vacated', check_out_date = CURRENT_DATE WHERE id = ?").run(req.params.id);
    } else {
      db.prepare(`
        UPDATE customers SET name=?, phone=?, email=?, emergency_contact=?, emergency_name=?, aadhaar_number=?, address=?, room_id=?, bed_id=?, monthly_rent=?, notes=?, status=? WHERE id=?
      `).run(name, phone, email, emergency_contact, emergency_name, aadhaar_number, address, room_id, bed_id, monthly_rent, notes, status || 'Active', req.params.id);
    }
    
    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (customer && customer.bed_id) {
      db.prepare("UPDATE beds SET status = 'Vacant', customer_id = NULL WHERE id = ?").run(customer.bed_id);
      db.prepare("UPDATE rooms SET occupied_beds = MAX(0, occupied_beds - 1) WHERE id = ?").run(customer.room_id);
    }
    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PAYMENTS ====================
app.get('/api/payments', (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT p.*, c.name as customer_name, c.phone as customer_phone, r.room_number
      FROM payments p 
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN rooms r ON c.room_id = r.id
      ORDER BY p.created_at DESC
    `).all();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', (req, res) => {
  try {
    const { customer_id, amount, payment_type, payment_method, payment_date, due_date, month, year, status, late_fee, notes } = req.body;
    const invoice_number = 'INV-' + Date.now();
    
    const result = db.prepare(`
      INSERT INTO payments (customer_id, amount, payment_type, payment_method, payment_date, due_date, month, year, status, invoice_number, late_fee, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customer_id, amount, payment_type || 'Rent', payment_method || 'Cash', payment_date, due_date, month, year, status || 'Paid', invoice_number, late_fee || 0, notes);
    
    res.json({ id: result.lastInsertRowid, invoice_number, message: 'Payment recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/payments/:id', (req, res) => {
  try {
    const { amount, payment_method, payment_date, status, late_fee, notes } = req.body;
    db.prepare(
      'UPDATE payments SET amount=?, payment_method=?, payment_date=?, status=?, late_fee=?, notes=? WHERE id=?'
    ).run(amount, payment_method, payment_date, status, late_fee, notes, req.params.id);
    res.json({ message: 'Payment updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/payments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate monthly rent for all active customers
app.post('/api/payments/generate-rent', (req, res) => {
  try {
    const { month, year } = req.body;
    const activeCustomers = db.prepare("SELECT * FROM customers WHERE status = 'Active' AND monthly_rent > 0").all();
    
    let generated = 0;
    for (const customer of activeCustomers) {
      const existing = db.prepare(
        "SELECT * FROM payments WHERE customer_id = ? AND month = ? AND year = ? AND payment_type = 'Rent'"
      ).get(customer.id, month, year);
      
      if (!existing) {
        const invoice_number = 'INV-' + Date.now() + '-' + customer.id;
        db.prepare(`
          INSERT INTO payments (customer_id, amount, payment_type, month, year, status, invoice_number, due_date)
          VALUES (?, ?, 'Rent', ?, ?, 'Pending', ?, ?)
        `).run(customer.id, customer.monthly_rent, month, year, invoice_number, `${year}-${String(new Date(Date.parse(month + ' 1, 2000')).getMonth() + 1).padStart(2, '0')}-05`);
        generated++;
      }
    }
    
    res.json({ message: `Rent generated for ${generated} customers`, generated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ELECTRICITY ====================
app.get('/api/electricity', (req, res) => {
  try {
    const readings = db.prepare(`
      SELECT e.*, r.room_number 
      FROM electricity e 
      JOIN rooms r ON e.room_id = r.id
      ORDER BY e.year DESC, e.created_at DESC
    `).all();
    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/electricity', (req, res) => {
  try {
    const { room_id, month, year, previous_reading, current_reading, rate_per_unit } = req.body;
    const units = current_reading - previous_reading;
    const rate = rate_per_unit || 8;
    const total = units * rate;
    
    const result = db.prepare(`
      INSERT INTO electricity (room_id, month, year, previous_reading, current_reading, units_consumed, rate_per_unit, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(room_id, month, year, previous_reading, current_reading, units, rate, total);
    
    res.json({ id: result.lastInsertRowid, units_consumed: units, total_amount: total, message: 'Reading added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/electricity/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM electricity WHERE id = ?').run(req.params.id);
    res.json({ message: 'Reading deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== EXPENSES ====================
app.get('/api/expenses', (req, res) => {
  try {
    const expenses = db.prepare('SELECT * FROM expenses ORDER BY expense_date DESC').all();
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const { category, description, amount, vendor, payment_method, expense_date, notes } = req.body;
    const result = db.prepare(`
      INSERT INTO expenses (category, description, amount, vendor, payment_method, expense_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(category, description, amount, vendor, payment_method || 'Cash', expense_date, notes);
    
    res.json({ id: result.lastInsertRowid, message: 'Expense added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', (req, res) => {
  try {
    const { category, description, amount, vendor, payment_method, expense_date, notes } = req.body;
    db.prepare(
      'UPDATE expenses SET category=?, description=?, amount=?, vendor=?, payment_method=?, expense_date=?, notes=? WHERE id=?'
    ).run(category, description, amount, vendor, payment_method, expense_date, notes, req.params.id);
    res.json({ message: 'Expense updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Expense summary
app.get('/api/expenses/summary/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const summary = db.prepare(`
      SELECT category, SUM(amount) as total 
      FROM expenses 
      WHERE strftime('%Y', expense_date) = ? AND strftime('%m', expense_date) = ?
      GROUP BY category
    `).all(year, month.padStart(2, '0'));
    
    const total = summary.reduce((acc, item) => acc + item.total, 0);
    res.json({ summary, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SETTINGS ====================
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const updates = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(updates)) {
      stmt.run(key, value);
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ID PROOF UPLOAD ====================
app.post('/api/customers/:id/upload-id', upload.single('id_proof'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    db.prepare('UPDATE customers SET id_proof_photo = ? WHERE id = ?').run(req.file.filename, req.params.id);
    res.json({ message: 'ID proof uploaded successfully', filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TENANT PROFILE (Public Shareable) ====================
app.get('/api/tenant/:id', (req, res) => {
  try {
    const customer = db.prepare(`
      SELECT c.id, c.name, c.phone, c.room_id, c.bed_id, c.check_in_date, c.monthly_rent, c.security_deposit, c.status,
        r.room_number, b.bed_number
      FROM customers c
      LEFT JOIN rooms r ON c.room_id = r.id
      LEFT JOIN beds b ON c.bed_id = b.id
      WHERE c.id = ?
    `).get(req.params.id);
    
    if (!customer) return res.status(404).json({ error: 'Tenant not found' });

    const payments = db.prepare(`
      SELECT id, amount, payment_type, payment_method, payment_date, month, year, status, invoice_number
      FROM payments WHERE customer_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });

    res.json({
      tenant: customer,
      payments,
      hostel: {
        name: settingsObj.hostel_name || "BISMI MEN'S PLAZA",
        upi_id: settingsObj.upi_id || '9894092449@jupiteraxis',
        payment_phone: settingsObj.payment_phone || '9894092449',
        owner_phone: settingsObj.owner_phone || '9894092449'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== BEDS ====================
app.get('/api/beds/vacant', (req, res) => {
  try {
    const beds = db.prepare(`
      SELECT b.*, r.room_number, r.sharing_type, r.rent_per_bed
      FROM beds b 
      JOIN rooms r ON b.room_id = r.id 
      WHERE b.status = 'Vacant'
      ORDER BY r.room_number
    `).all();
    res.json(beds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WhatsApp link generator
app.get('/api/whatsapp/:phone/:message', (req, res) => {
  const { phone, message } = req.params;
  const cleanPhone = phone.replace(/\D/g, '');
  const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
  res.json({ link: waLink });
});

// Catch-all for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Create uploads directory
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

app.listen(PORT, () => {
  console.log(`\n🏠 Bismi PG Management App`);
  console.log(`📱 Developed by ASVEN Technology`);
  console.log(`🚀 Server running on http://localhost:${PORT}\n`);
});
