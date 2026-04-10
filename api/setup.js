const pool = require('./_db');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const query = `
      CREATE TABLE IF NOT EXISTS umkm_users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          nama_pemilik VARCHAR(255) NOT NULL,
          nama_toko VARCHAR(255) NOT NULL,
          kategori TEXT,
          kota VARCHAR(255),
          whatsapp VARCHAR(50),
          alamat TEXT,
          bidang VARCHAR(100),
          tanggal_berdiri DATE,
          izin VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS katalog_produk (
          id SERIAL PRIMARY KEY,
          nama VARCHAR(255) NOT NULL,
          kategori TEXT,
          harga NUMERIC NOT NULL,
          detail TEXT,
          gambar TEXT,
          pemilik VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transaksi (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          tipe VARCHAR(10) NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
          keterangan TEXT NOT NULL,
          jumlah NUMERIC NOT NULL,
          kategori VARCHAR(100) NOT NULL,
          tanggal TIMESTAMPTZ DEFAULT NOW()
      );

      -- Add new columns to umkm_users if they don't exist (for existing tables)
      ALTER TABLE umkm_users ADD COLUMN IF NOT EXISTS bidang VARCHAR(100);
      ALTER TABLE umkm_users ADD COLUMN IF NOT EXISTS tanggal_berdiri DATE;
      ALTER TABLE umkm_users ADD COLUMN IF NOT EXISTS izin VARCHAR(100);
    `;

    await pool.query(query);
    
    return res.status(200).json({ 
      success: true, 
      message: "Database initialized successfully! All tables (umkm_users, katalog_produk, transaksi) are ready." 
    });
  } catch (err) {
    console.error('[setup]', err);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to initialize database.", 
      details: err.message 
    });
  }
};
