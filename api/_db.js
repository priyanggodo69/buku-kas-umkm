const { Pool } = require('pg');

// Pool dibuat sekali dan di-reuse antar request (connection pooling)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  // Jika tidak ada env var, jangan biarkan pg default ke localhost
  console.error("DATABASE_URL tidak ditemukan di environment variables!");
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
