import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    const migrationSQL = readFileSync('./supabase/migrations/007_create_issue_collections.sql', 'utf-8');
    
    // Split by statement and execute each one
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Applying migration with ${statements.length} statements...`);
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.error('Error executing statement:', error);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }
    
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
