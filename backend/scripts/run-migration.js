/**
 * Run Database Migration Script
 * This script reads and executes migration files in order
 */

const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function runMigration(filePath) {
  try {
    console.log(`📄 Running migration: ${path.basename(filePath)}`);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolons and filter empty statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.startsWith('--')) continue;
      
      try {
        await db.query(statement);
      } catch (err) {
        // Skip errors for IF NOT EXISTS or duplicate operations
        if (err.message.includes('duplicate') || 
            err.message.includes('already exists') ||
            err.message.includes('already a registered view')) {
          console.log(`  ℹ️  Skipped: ${err.message.split('\n')[0]}`);
          continue;
        }
        throw err;
      }
    }
    
    console.log(`✅ Migration completed: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${path.basename(filePath)}`);
    console.error(error.message);
    process.exit(1);
  }
}

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...\n');
    
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📋 Found ${migrationFiles.length} migration(s) to run\n`);
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      await runMigration(filePath);
      console.log('');
    }
    
    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration process failed');
    console.error(error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
