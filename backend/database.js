// Bismi PG Database - Supabase PostgreSQL Connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://dzaprkycqmpiggthvsms.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YXBya3ljcW1waWdndGh2c21zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTk0NDE5NiwiZXhwIjoyMTAxNTIwMTk2fQ.tmIc0HqxGyNZdo4jo0PTev371fu2JZZUWdsEKPsxJHo';

// Use service_role key for full backend access (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
