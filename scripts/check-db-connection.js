/**
 * Check PostgreSQL Database Connection
 * This script tests if we can connect to the database
 */

const { Pool } = require('pg');

// Try different credentials
const TEST_CONNECTIONS = [
  {
    name: 'smartlearn/password',
    config: {
      user: 'smartlearn',
      password: 'password',
      database: 'smartlearn',
    }
  },
  {
    name: 'smartlearn/*tr0ng_p@ssw0rd*',
    config: {
      user: 'smartlearn',
      password: '$tr0ng_p@ssw0rd',
      database: 'smartlearn',
    }
  },
  {
    name: 'postgres/*',
    config: {
      user: 'postgres',
      database: 'smartlearn',
    }
  },
];

async function testConnection(name, config) {
  console.log(`\n🔍 Testing: ${name}...`);
  
  const pool = new Pool({
    ...config,
    host: 'localhost',
    port: 5432,
  });

  try {
    const result = await pool.query('SELECT NOW()');
    console.log(`✅ SUCCESS - Connected at: ${result.rows[0].now}`);
    pool.end();
    return true;
  } catch (error) {
    console.log(`❌ FAILED - ${error.message}`);
    pool.end();
    return false;
  }
}

async function checkDatabases() {
  console.log('\n📊 Available databases:');
  console.log('========================');
  
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    port: 5432,
  });

  try {
    const result = await pool.query("SELECT datname FROM pg_database WHERE datname NOT IN ('template0', 'template1');");
    if (result.rows.length === 0) {
      console.log('  No databases found');
    } else {
      result.rows.forEach(row => {
        console.log(`  - ${row.datname}`);
      });
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }

  await pool.end();
}

async function main() {
  console.log('🔧 Smart Learn Database Connection Test');
  console.log('========================================\n');

  // First check available databases
  await checkDatabases();

  // Try different credentials
  console.log('\n🔐 Testing credentials:');
  console.log('=======================');
  
  let success = false;
  
  for (const test of TEST_CONNECTIONS) {
    if (await testConnection(test.name, test.config)) {
      success = true;
      console.log(`\n✅ Found working credentials: ${test.name}`);
      break;
    }
  }

  if (!success) {
    console.log('\n❌ No working credentials found');
    console.log('\n📋 NEXT STEPS FOR YOU:');
    console.log('======================');
    console.log('1. Check if PostgreSQL is running:');
    console.log('   pg_isready -h localhost -p 5432');
    console.log('');
    console.log('2. Create the smartlearn user and database:');
    console.log('   sudo -u postgres psql -c "CREATE USER smartlearn WITH PASSWORD '\''password'\'' SUPERUSER;"');
    console.log('   sudo -u postgres psql -c "CREATE DATABASE smartlearn OWNER smartlearn;"');
    console.log('');
    console.log('3. Update the .env file:');
    console.log('   echo '\''DB_PASSWORD=password'\'' > .env');
    console.log('');
    console.log('4. Run the migration:');
    console.log('   cd backend');
    console.log('   node scripts/run-migrations.js');
  }
}

main();
