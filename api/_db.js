const { Pool } = require('pg');

// Pool dibuat sekali dan di-reuse antar request (connection pooling)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
