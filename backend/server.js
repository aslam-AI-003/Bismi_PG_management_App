// Bismi PG Backend v3.0 - Supabase PostgreSQL + Production Ready
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== MIDDLEWARE ====================

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS - Allow frontend origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://bismi-pg-app.vercel.app',
  'https://bismi-pg-management-app.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o.replace(/\/$/, '')))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development, restrict in production if needed
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // max 10 login attempts per 15 min
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api/', apiLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/tenant/login', authLimiter);

// File upload config (memory storage for Supabase upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, WebP) and PDF files are allowed'));
    }
  }
});

// Database (Supabase client)
const supabase = require('./database');

// ==================== ERROR HANDLER ====================
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum 5MB allowed.' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// ==================== DASHBOARD ====================
app.get('/api/dashboard', asyncHandler(async (req, res) => {
  const { data: rooms } = await supabase.from('rooms').select('id');
  const totalRooms = rooms?.length || 0;

  const { data: beds } = await supabase.from('beds').select('id, status');
  const totalBeds = beds?.length || 0;
  const occupiedBeds = beds?.filter(b => b.status === 'Occupied').length || 0;
  const vacantBeds = totalBeds - occupiedBeds;

  const { data: activeCustomersData } = await supabase.from('customers').select('id').eq('status', 'Active');
  const activeCustomers = activeCustomersData?.length || 0;

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const { data: paidPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .eq('status', 'Paid');
  const monthlyIncome = paidPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // Monthly expenses
  const monthStr = String(new Date().getMonth() + 1).padStart(2, '0');
  const startDate = `${currentYear}-${monthStr}-01`;
  const endDate = `${currentYear}-${monthStr}-31`;
  const { data: monthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);
  const monthlyExpense = monthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  const { data: pendingPaymentsData } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'Pending');
  const pendingPayments = pendingPaymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

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
}));

// ==================== ROOMS ====================
app.get('/api/rooms', asyncHandler(async (req, res) => {
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .order('room_number');
  
  if (error) throw error;

  // Get occupied bed counts
  const { data: beds } = await supabase.from('beds').select('room_id, status');
  const roomsWithOccupancy = rooms.map(room => ({
    ...room,
    occupied_beds: beds?.filter(b => b.room_id === room.id && b.status === 'Occupied').length || 0
  }));

  res.json(roomsWithOccupancy);
}));

app.get('/api/rooms/:id', asyncHandler(async (req, res) => {
  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (error) throw error;

  const { data: beds } = await supabase
    .from('beds')
    .select('*, customers(name, phone)')
    .eq('room_id', req.params.id);

  const bedsFormatted = beds?.map(b => ({
    ...b,
    customer_name: b.customers?.name || null,
    customer_phone: b.customers?.phone || null,
    customers: undefined
  })) || [];

  res.json({ ...room, beds: bedsFormatted });
}));

app.post('/api/rooms', asyncHandler(async (req, res) => {
  const { room_number, floor, room_type, sharing_type, total_beds, rent_per_bed } = req.body;
  
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({
      room_number,
      floor: floor || 1,
      room_type: room_type || 'Non-AC',
      sharing_type,
      total_beds,
      rent_per_bed: rent_per_bed || 0
    })
    .select()
    .single();
  
  if (error) throw error;

  // Create beds
  const bedInserts = [];
  for (let b = 1; b <= total_beds; b++) {
    bedInserts.push({ room_id: room.id, bed_number: `${room_number} - Bed ${b}` });
  }
  await supabase.from('beds').insert(bedInserts);

  res.json({ id: room.id, message: 'Room added successfully' });
}));

app.put('/api/rooms/:id', asyncHandler(async (req, res) => {
  const { room_number, floor, room_type, sharing_type, rent_per_bed, status, maintenance_note } = req.body;
  
  const { error } = await supabase
    .from('rooms')
    .update({ room_number, floor, room_type, sharing_type, rent_per_bed, status, maintenance_note })
    .eq('id', req.params.id);
  
  if (error) throw error;
  res.json({ message: 'Room updated successfully' });
}));

app.delete('/api/rooms/:id', asyncHandler(async (req, res) => {
  await supabase.from('beds').delete().eq('room_id', req.params.id);
  const { error } = await supabase.from('rooms').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Room deleted successfully' });
}));

// ==================== CUSTOMERS ====================
app.get('/api/customers', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*, rooms(room_number), beds(bed_number)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;

  const customers = data.map(c => ({
    ...c,
    room_number: c.rooms?.room_number || null,
    bed_number: c.beds?.bed_number || null,
    rooms: undefined,
    beds: undefined
  }));

  res.json(customers);
}));

app.get('/api/customers/:id', asyncHandler(async (req, res) => {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*, rooms(room_number), beds(bed_number)')
    .eq('id', req.params.id)
    .single();
  
  if (error) throw error;

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('customer_id', req.params.id)
    .order('created_at', { ascending: false });

  res.json({
    ...customer,
    room_number: customer.rooms?.room_number || null,
    bed_number: customer.beds?.bed_number || null,
    rooms: undefined,
    beds: undefined,
    payments: payments || []
  });
}));

app.post('/api/customers', asyncHandler(async (req, res) => {
  const { name, phone, email, emergency_contact, emergency_name, aadhaar_number, address, room_id, bed_id, check_in_date, security_deposit, monthly_rent, notes } = req.body;
  
  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      name, phone, email, emergency_contact, emergency_name, aadhaar_number, address,
      room_id: room_id || null,
      bed_id: bed_id || null,
      check_in_date, security_deposit: security_deposit || 0, monthly_rent: monthly_rent || 0, notes
    })
    .select()
    .single();
  
  if (error) throw error;

  // Update bed status
  if (bed_id) {
    await supabase.from('beds').update({ status: 'Occupied', customer_id: customer.id }).eq('id', bed_id);
    await supabase.rpc('increment_occupied_beds', { room_id_param: room_id });
  }

  res.json({ id: customer.id, message: 'Customer added successfully' });
}));

app.put('/api/customers/:id', asyncHandler(async (req, res) => {
  const { name, phone, email, emergency_contact, emergency_name, aadhaar_number, address, room_id, bed_id, monthly_rent, notes, status } = req.body;
  
  // If checking out
  if (status === 'Vacated') {
    const { data: customer } = await supabase.from('customers').select('*').eq('id', req.params.id).single();
    if (customer && customer.bed_id) {
      await supabase.from('beds').update({ status: 'Vacant', customer_id: null }).eq('id', customer.bed_id);
      await supabase.rpc('decrement_occupied_beds', { room_id_param: customer.room_id });
    }
    await supabase.from('customers')
      .update({ status: 'Vacated', check_out_date: new Date().toISOString().split('T')[0] })
      .eq('id', req.params.id);
  } else {
    await supabase.from('customers')
      .update({ name, phone, email, emergency_contact, emergency_name, aadhaar_number, address, room_id, bed_id, monthly_rent, notes, status: status || 'Active' })
      .eq('id', req.params.id);
  }
  
  res.json({ message: 'Customer updated successfully' });
}));

app.delete('/api/customers/:id', asyncHandler(async (req, res) => {
  const { data: customer } = await supabase.from('customers').select('*').eq('id', req.params.id).single();
  if (customer && customer.bed_id) {
    await supabase.from('beds').update({ status: 'Vacant', customer_id: null }).eq('id', customer.bed_id);
    await supabase.rpc('decrement_occupied_beds', { room_id_param: customer.room_id });
  }
  const { error } = await supabase.from('customers').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Customer deleted successfully' });
}));

// ==================== PAYMENTS ====================
app.get('/api/payments', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*, customers(name, phone, room_id, rooms(room_number))')
    .order('created_at', { ascending: false });
  
  if (error) throw error;

  const payments = data.map(p => ({
    ...p,
    customer_name: p.customers?.name || null,
    customer_phone: p.customers?.phone || null,
    room_number: p.customers?.rooms?.room_number || null,
    customers: undefined
  }));

  res.json(payments);
}));

app.post('/api/payments', asyncHandler(async (req, res) => {
  const { customer_id, amount, payment_type, payment_method, payment_date, due_date, month, year, status, late_fee, notes } = req.body;
  const invoice_number = 'INV-' + Date.now();
  
  const { data, error } = await supabase
    .from('payments')
    .insert({
      customer_id, amount, payment_type: payment_type || 'Rent',
      payment_method: payment_method || 'Cash', payment_date, due_date,
      month, year, status: status || 'Paid', invoice_number,
      late_fee: late_fee || 0, notes
    })
    .select()
    .single();
  
  if (error) throw error;
  res.json({ id: data.id, invoice_number, message: 'Payment recorded successfully' });
}));

app.put('/api/payments/:id', asyncHandler(async (req, res) => {
  const { amount, payment_method, payment_date, status, late_fee, notes } = req.body;
  const { error } = await supabase
    .from('payments')
    .update({ amount, payment_method, payment_date, status, late_fee, notes })
    .eq('id', req.params.id);
  
  if (error) throw error;
  res.json({ message: 'Payment updated successfully' });
}));

app.delete('/api/payments/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase.from('payments').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Payment deleted successfully' });
}));

// Generate monthly rent for all active customers
app.post('/api/payments/generate-rent', asyncHandler(async (req, res) => {
  const { month, year } = req.body;
  
  const { data: activeCustomers } = await supabase
    .from('customers')
    .select('*')
    .eq('status', 'Active')
    .gt('monthly_rent', 0);
  
  let generated = 0;
  for (const customer of (activeCustomers || [])) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('month', month)
      .eq('year', year)
      .eq('payment_type', 'Rent')
      .limit(1);
    
    if (!existing || existing.length === 0) {
      const invoice_number = 'INV-' + Date.now() + '-' + customer.id;
      const monthNum = String(new Date(Date.parse(month + ' 1, 2000')).getMonth() + 1).padStart(2, '0');
      await supabase.from('payments').insert({
        customer_id: customer.id,
        amount: customer.monthly_rent,
        payment_type: 'Rent',
        month, year,
        status: 'Pending',
        invoice_number,
        due_date: `${year}-${monthNum}-05`
      });
      generated++;
    }
  }
  
  res.json({ message: `Rent generated for ${generated} customers`, generated });
}));

// ==================== ELECTRICITY ====================
app.get('/api/electricity', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('electricity')
    .select('*, rooms(room_number)')
    .order('year', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) throw error;

  const readings = data.map(e => ({
    ...e,
    room_number: e.rooms?.room_number || null,
    rooms: undefined
  }));

  res.json(readings);
}));

app.post('/api/electricity', asyncHandler(async (req, res) => {
  const { room_id, month, year, previous_reading, current_reading, rate_per_unit } = req.body;
  const units = current_reading - previous_reading;
  const rate = rate_per_unit || 8;
  const total = units * rate;
  
  const { data, error } = await supabase
    .from('electricity')
    .insert({ room_id, month, year, previous_reading, current_reading, units_consumed: units, rate_per_unit: rate, total_amount: total })
    .select()
    .single();
  
  if (error) throw error;
  res.json({ id: data.id, units_consumed: units, total_amount: total, message: 'Reading added successfully' });
}));

app.delete('/api/electricity/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase.from('electricity').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Reading deleted successfully' });
}));

// ==================== EXPENSES ====================
app.get('/api/expenses', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });
  
  if (error) throw error;
  res.json(data);
}));

app.post('/api/expenses', asyncHandler(async (req, res) => {
  const { category, description, amount, vendor, payment_method, expense_date, notes } = req.body;
  const { data, error } = await supabase
    .from('expenses')
    .insert({ category, description, amount, vendor, payment_method: payment_method || 'Cash', expense_date, notes })
    .select()
    .single();
  
  if (error) throw error;
  res.json({ id: data.id, message: 'Expense added successfully' });
}));

app.put('/api/expenses/:id', asyncHandler(async (req, res) => {
  const { category, description, amount, vendor, payment_method, expense_date, notes } = req.body;
  const { error } = await supabase
    .from('expenses')
    .update({ category, description, amount, vendor, payment_method, expense_date, notes })
    .eq('id', req.params.id);
  
  if (error) throw error;
  res.json({ message: 'Expense updated successfully' });
}));

app.delete('/api/expenses/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase.from('expenses').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Expense deleted successfully' });
}));

// Expense summary
app.get('/api/expenses/summary/:year/:month', asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = `${year}-${month.padStart(2, '0')}-31`;
  
  const { data: expenses } = await supabase
    .from('expenses')
    .select('category, amount')
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);
  
  // Group by category
  const categoryMap = {};
  (expenses || []).forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
  });
  
  const summary = Object.entries(categoryMap).map(([category, total]) => ({ category, total }));
  const total = summary.reduce((acc, item) => acc + item.total, 0);
  
  res.json({ summary, total });
}));

// ==================== SETTINGS ====================
app.get('/api/settings', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) throw error;
  
  const settingsObj = {};
  (data || []).forEach(s => { settingsObj[s.key] = s.value; });
  res.json(settingsObj);
}));

app.put('/api/settings', asyncHandler(async (req, res) => {
  const updates = req.body;
  for (const [key, value] of Object.entries(updates)) {
    await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
  }
  res.json({ message: 'Settings updated successfully' });
}));

// ==================== FILE UPLOAD (Supabase Storage) ====================
app.post('/api/customers/:id/upload-id', upload.single('id_proof'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const fileExt = req.file.originalname.split('.').pop();
  const fileName = `id-proofs/${req.params.id}/${uuidv4()}.${fileExt}`;
  
  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true
    });
  
  if (uploadError) throw uploadError;
  
  // Get public URL
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
  const publicUrl = urlData.publicUrl;
  
  // Update customer record
  await supabase.from('customers').update({ id_proof_photo: publicUrl }).eq('id', req.params.id);
  
  res.json({ message: 'ID proof uploaded successfully', filename: publicUrl, url: publicUrl });
}));

// Serve uploaded files (redirect to Supabase Storage URL)
app.get('/uploads/:filename', (req, res) => {
  const { data } = supabase.storage.from('uploads').getPublicUrl(`id-proofs/${req.params.filename}`);
  res.redirect(data.publicUrl);
});

// ==================== TENANT PROFILE (Public Shareable) ====================
app.get('/api/tenant/:id', asyncHandler(async (req, res) => {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, name, phone, room_id, bed_id, check_in_date, monthly_rent, security_deposit, status, rooms(room_number), beds(bed_number)')
    .eq('id', req.params.id)
    .single();
  
  if (error || !customer) return res.status(404).json({ error: 'Tenant not found' });

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, payment_type, payment_method, payment_date, month, year, status, invoice_number')
    .eq('customer_id', req.params.id)
    .order('created_at', { ascending: false });

  const { data: settingsData } = await supabase.from('settings').select('*');
  const settingsObj = {};
  (settingsData || []).forEach(s => { settingsObj[s.key] = s.value; });

  res.json({
    tenant: {
      ...customer,
      room_number: customer.rooms?.room_number || null,
      bed_number: customer.beds?.bed_number || null,
      rooms: undefined,
      beds: undefined
    },
    payments: payments || [],
    hostel: {
      name: settingsObj.hostel_name || "BISMI MEN'S PLAZA",
      upi_id: settingsObj.upi_id || '9894092449@jupiteraxis',
      payment_phone: settingsObj.payment_phone || '9894092449',
      owner_phone: settingsObj.owner_phone || '9894092449'
    }
  });
}));

// ==================== BEDS ====================
app.get('/api/beds/vacant', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('beds')
    .select('*, rooms(room_number, sharing_type, rent_per_bed)')
    .eq('status', 'Vacant')
    .order('room_id');
  
  if (error) throw error;

  const beds = (data || []).map(b => ({
    ...b,
    room_number: b.rooms?.room_number || null,
    sharing_type: b.rooms?.sharing_type || null,
    rent_per_bed: b.rooms?.rent_per_bed || 0,
    rooms: undefined
  }));

  res.json(beds);
}));

// WhatsApp link generator
app.get('/api/whatsapp/:phone/:message', (req, res) => {
  const { phone, message } = req.params;
  const cleanPhone = phone.replace(/\D/g, '');
  const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
  res.json({ link: waLink });
});

// ==================== AUTH - ADMIN LOGIN ====================
app.post('/api/admin/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  // Check settings for admin credentials, fallback to defaults
  const { data: settingsData } = await supabase.from('settings').select('*');
  const settings = {};
  (settingsData || []).forEach(s => { settings[s.key] = s.value; });
  
  const adminUser = settings.admin_username || 'admin';
  const adminPass = settings.admin_password || 'bismi2024';
  
  if (username === adminUser && password === adminPass) {
    res.json({ success: true, role: 'admin', token: 'admin-' + Date.now() });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}));

// ==================== AUTH - TENANT LOGIN ====================
app.post('/api/tenant/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  // Tenant login: username = name (case-insensitive), password = phone number
  const { data: customers } = await supabase
    .from('customers')
    .select('*, rooms(room_number), beds(bed_number)')
    .ilike('name', username)
    .eq('phone', password)
    .eq('status', 'Active')
    .limit(1);
  
  if (customers && customers.length > 0) {
    const customer = customers[0];
    res.json({
      success: true,
      role: 'tenant',
      tenant: {
        ...customer,
        room_number: customer.rooms?.room_number || null,
        bed_number: customer.beds?.bed_number || null,
        rooms: undefined,
        beds: undefined
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid name or phone number' });
  }
}));

// ==================== ISSUES / COMPLAINTS ====================
app.get('/api/issues', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('issues')
    .select('*, customers(name, phone, room_id, rooms(room_number))')
    .order('created_at', { ascending: false });
  
  if (error) throw error;

  const issues = (data || []).map(i => ({
    ...i,
    customer_name: i.customers?.name || null,
    customer_phone: i.customers?.phone || null,
    room_number: i.customers?.rooms?.room_number || null,
    customers: undefined
  }));

  res.json(issues);
}));

app.get('/api/issues/tenant/:customerId', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('customer_id', req.params.customerId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  res.json(data || []);
}));

app.post('/api/issues', asyncHandler(async (req, res) => {
  const { customer_id, title, description, category, priority } = req.body;
  
  const { data, error } = await supabase
    .from('issues')
    .insert({
      customer_id, title, description,
      category: category || 'General',
      priority: priority || 'Normal',
      status: 'Open'
    })
    .select()
    .single();
  
  if (error) throw error;
  res.json({ id: data.id, message: 'Issue raised successfully' });
}));

app.put('/api/issues/:id', asyncHandler(async (req, res) => {
  const { status, admin_response } = req.body;
  
  const updateData = { status, admin_response };
  if (status === 'Resolved') {
    updateData.resolved_at = new Date().toISOString();
  }
  
  const { error } = await supabase
    .from('issues')
    .update(updateData)
    .eq('id', req.params.id);
  
  if (error) throw error;
  res.json({ message: 'Issue updated successfully' });
}));

app.delete('/api/issues/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase.from('issues').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Issue deleted successfully' });
}));

// ==================== MONTHLY REPORT ====================
app.get('/api/reports/monthly/:year/:month', asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  const monthName = new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'long' });
  const yearNum = parseInt(year);

  // Rent collected
  const { data: paidData } = await supabase
    .from('payments')
    .select('amount')
    .eq('month', monthName)
    .eq('year', yearNum)
    .eq('status', 'Paid');
  const rentCollected = paidData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // Rent pending
  const { data: pendingData } = await supabase
    .from('payments')
    .select('amount')
    .eq('month', monthName)
    .eq('year', yearNum)
    .eq('status', 'Pending');
  const rentPending = pendingData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // Expenses
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = `${year}-${month.padStart(2, '0')}-31`;
  const { data: expensesData } = await supabase
    .from('expenses')
    .select('category, amount')
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);

  const categoryMap = {};
  (expensesData || []).forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
  });
  const expenses = Object.entries(categoryMap).map(([category, total]) => ({ category, total }));
  const totalExpense = expenses.reduce((acc, item) => acc + item.total, 0);

  // Occupancy
  const { data: allBeds } = await supabase.from('beds').select('id, status');
  const totalBeds = allBeds?.length || 0;
  const occupiedBeds = allBeds?.filter(b => b.status === 'Occupied').length || 0;

  // Active tenants
  const { data: activeData } = await supabase.from('customers').select('id').eq('status', 'Active');
  const activeCustomers = activeData?.length || 0;

  // Payment list
  const { data: paymentsList } = await supabase
    .from('payments')
    .select('*, customers(name, room_id, rooms(room_number))')
    .eq('month', monthName)
    .eq('year', yearNum)
    .order('status', { ascending: false });

  const payments = (paymentsList || []).map(p => ({
    ...p,
    customer_name: p.customers?.name || null,
    room_number: p.customers?.rooms?.room_number || null,
    customers: undefined
  }));

  res.json({
    month: monthName,
    year: yearNum,
    rentCollected,
    rentPending,
    totalExpense,
    netIncome: rentCollected - totalExpense,
    expenses,
    occupancy: { total: totalBeds, occupied: occupiedBeds, vacant: totalBeds - occupiedBeds },
    activeCustomers,
    payments
  });
}));

// ==================== HEALTH CHECK ====================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bismi PG Backend API is running!',
    version: '3.0.0',
    database: 'Supabase PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('settings').select('key').limit(1);
    if (error) throw error;
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: err.message });
  }
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// ==================== GLOBAL ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`\n🏠 Bismi PG Management App v3.0`);
  console.log(`📱 Developed by ASVEN Technology`);
  console.log(`🗄️  Database: Supabase PostgreSQL`);
  console.log(`🚀 Server running on http://localhost:${PORT}\n`);
});

module.exports = app;
