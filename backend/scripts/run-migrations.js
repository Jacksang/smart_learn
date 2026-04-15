/**
 * Migration Runner Script
 * Executes database migrations sequentially
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  user: 'smartlearn',
  host: 'localhost',
  database: 'smartlearn',
  password: '$tr0ng_p@ssw0rd',
  port: 5432,
});

async function executeStatement(statement) {
  const client = await pool.connect();
  try {
    await client.query(statement);
  } finally {
    client.release();
  }
}

async function runMigration(filePath, filename) {
  console.log(`📄 Running migration: ${filename}`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt && !stmt.startsWith('--') && stmt.length > 0);
  
  let successCount = 0;
  let skipCount = 0;
  
  for (const statement of statements) {
    try {
      await executeStatement(statement);
      successCount++;
    } catch (error) {
      // Skip expected errors
      if (error.message.includes('duplicate') || 
          error.message.includes('already exists') ||
          error.message.includes('cannot be executed')) {
        console.log(`  ℹ️  Skipped (expected): ${error.message.split('\n')[0]}`);
        skipCount++;
      } else {
        console.error(`  ❌ Error: ${error.message.split('\n')[0]}`);
        throw error;
      }
    }
  }
  
  console.log(`✅ Completed: ${successCount} statements executed, ${skipCount} skipped\n`);
}

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');
  console.log('📍 Database: localhost:5432/smartlearn\n');
  
  const migrationsDir = path.join(__dirname, '../migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log(`📋 Found ${migrationFiles.length} migration(s)\n`);
  
  try {
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      await runMigration(filePath, file);
    }
    
    console.log('✅ All migrations completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration process failed');
    console.error(error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
