require('dotenv').config();
const { Pool } = require('pg');
const { buildPostgresConfig } = require('./postgres');

const pool = new Pool(buildPostgresConfig());

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
