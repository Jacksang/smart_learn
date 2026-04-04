require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'smartlearn',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'smartlearn',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

const db = {
  query: (text, params) => pool.query(text, params),
  pool,
};

db.connect = async () => {
  try {
    const result = await db.query('SELECT 1');
    console.log('✅ PostgreSQL connected successfully');
    return result;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    throw error;
  }
};

module.exports = db;
