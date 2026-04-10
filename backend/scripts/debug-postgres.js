#!/usr/bin/env node
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 PostgreSQL Connection Debug Script\n');
console.log('Environment Variables:');
console.log(`  DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  DB_PORT: ${process.env.DB_PORT || '5432'}`);
console.log(`  DB_NAME: ${process.env.DB_NAME || 'smartlearn'}`);
console.log(`  DB_USER: ${process.env.DB_USER || 'smartlearn'}`);
console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : '(not set, using default)'}`);
console.log(`  DB_SSL: ${process.env.DB_SSL || 'disabled'}`);
console.log('');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smartlearn',
  user: process.env.DB_USER || 'smartlearn',
  password: process.env.DB_PASSWORD || 'password',
};

async function debugConnection() {
  console.log(`📍 Trying to connect to: ${config.host}:${config.port}/${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log('');

  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
  });

  try {
    const result = await pool.query('SELECT version()');
    console.log('✅ Connection successful!');
    console.log(`   Database Version: ${result.rows[0].version}`);
    await pool.end();
  } catch (error) {
    console.log('❌ Connection failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Possible causes:');
      console.log('   - PostgreSQL service is not running');
      console.log('   - Wrong port');
      console.log('   - Firewall blocking connection');
      console.log('');
      console.log('🔧 Suggested actions:');
      console.log('   - sudo systemctl status postgresql');
      console.log('   - sudo systemctl start postgresql');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.message.includes('password authentication failed')) {
      console.log('\n💡 Password/Authentication issue!');
      console.log('   - Password in .env is incorrect');
      console.log('   - pg_hba.conf might be configured for md5, scram-sha-256, or peer authentication');
      console.log('   - Password hash on server might not match');
      console.log('');
      console.log('🔧 Suggested actions:');
      console.log('   - Check pg_hba.conf on the database server');
      console.log('   - Run: sudo -u postgres psql');
      console.log('   - Run: ALTER USER smartlearn PASSWORD \'your_password\';');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Could not connect to database server!');
      console.log('   Check network connectivity and firewall settings.');
    }
  }

  await pool.end();
}

debugConnection().catch(console.error);
