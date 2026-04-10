const { Pool } = require('pg');

// Pool dibuat sekali dan di-reuse antar request (connection pooling)
// Gunakan mana saja yang tersedia (DATABASE_URL, POSTGRES_URL, atau SUPABASE_DATABASE_URL)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
