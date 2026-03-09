const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.db.connectionString,
});

pool.on('error', (err) => {
  // In a real deployment, prefer a structured logger
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};

