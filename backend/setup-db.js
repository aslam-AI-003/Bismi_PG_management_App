// Bismi PG - Database Setup Script
// This script sets up the Supabase database tables using the REST API
// Run: node setup-db.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://dzaprkycqmpiggthvsms.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YXBya3ljcW1waWdndGh2c21zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTk0NDE5NiwiZXhwIjoyMTAxNTIwMTk2fQ.tmIc0HqxGyNZdo4jo0PTev371fu2JZZUWdsEKPsxJHo';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupDatabase() {
  console.log('🔧 Setting up Bismi PG Database...\n');

  // Test connection
  console.log('1️⃣ Testing Supabase connection...');
  const { data: testData, error: testError } = await supabase.from('settings').select('*').limit(1);
  
  if (testError && testError.code === '42P01') {
    console.log('   ⚠️ Tables not found. You need to run the SQL schema first!');
    console.log('\n📋 INSTRUCTIONS:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/dzaprkycqmpiggthvsms/sql');
    console.log('   2. Click "New Query"');
    console.log('   3. Copy & paste contents of: backend/supabase-schema.sql');
    console.log('   4. Click "Run"');
    console.log('   5. Create another query, paste: backend/supabase-functions.sql');
    console.log('   6. Click "Run"');
    console.log('   7. Run this script again to verify\n');
    return;
  }
  
  if (testError) {
    console.log('   ❌ Connection error:', testError.message);
    return;
  }
  
  console.log('   ✅ Connected to Supabase!\n');

  // Check tables
  console.log('2️⃣ Checking tables...');
  
  const tables = ['rooms', 'beds', 'customers', 'payments', 'electricity', 'expenses', 'issues', 'settings'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`   ❌ ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: OK`);
    }
  }

  // Check settings
  console.log('\n3️⃣ Checking settings...');
  const { data: settings } = await supabase.from('settings').select('*');
  if (settings && settings.length > 0) {
    console.log(`   ✅ Settings: ${settings.length} entries found`);
  } else {
    console.log('   ⚠️ No settings found. They should be auto-inserted by schema.');
  }

  // Check rooms
  console.log('\n4️⃣ Checking rooms...');
  const { data: rooms } = await supabase.from('rooms').select('*');
  if (rooms && rooms.length > 0) {
    console.log(`   ✅ Rooms: ${rooms.length} rooms found`);
  } else {
    console.log('   ⚠️ No rooms found. They should be auto-inserted by schema.');
  }

  // Check beds
  const { data: beds } = await supabase.from('beds').select('*');
  if (beds && beds.length > 0) {
    console.log(`   ✅ Beds: ${beds.length} beds found`);
  } else {
    console.log('   ⚠️ No beds found.');
  }

  // Check storage bucket
  console.log('\n5️⃣ Checking storage...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.log('   ❌ Storage error:', bucketError.message);
  } else {
    const uploadsBucket = buckets.find(b => b.name === 'uploads');
    if (uploadsBucket) {
      console.log('   ✅ Storage bucket "uploads" exists');
    } else {
      console.log('   ⚠️ Storage bucket "uploads" not found. Creating...');
      const { error: createError } = await supabase.storage.createBucket('uploads', { public: true });
      if (createError) {
        console.log('   ❌ Could not create bucket:', createError.message);
      } else {
        console.log('   ✅ Created "uploads" bucket');
      }
    }
  }

  // Test RPC functions
  console.log('\n6️⃣ Testing RPC functions...');
  const { error: rpcError } = await supabase.rpc('increment_occupied_beds', { room_id_param: 0 });
  if (rpcError && rpcError.message.includes('not found')) {
    console.log('   ⚠️ RPC functions not found. Run supabase-functions.sql in SQL Editor.');
  } else {
    console.log('   ✅ RPC functions available');
  }

  console.log('\n🎉 Database setup check complete!');
  console.log('\n📱 You can now start the server: npm start');
}

setupDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
