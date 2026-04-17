const pool = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/products — Ambil semua produk
  if (req.method === 'GET') {
    try {
      if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.SUPABASE_DATABASE_URL) {
        return res.status(500).json({ error: "DATABASE_URL tidak ditemukan. Pastikan sudah diset di Vercel Settings." });
      }
      const query = `
        SELECT p.*, u.whatsapp
        FROM katalog_produk p
        LEFT JOIN umkm_users u ON p.pemilik = u.nama_toko
        ORDER BY p.id DESC;
      `;
      const result = await pool.query(query);
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('[products GET Error]', err);
      return res.status(500).json({ error: "Gagal mengambil data produk.", details: err.message });
    }
  }

  // POST /api/products — Tambah produk baru
  if (req.method === 'POST') {
    const { nama, kategori, harga, detail, gambar, pemilik } = req.body;
    if (!nama || !harga || !pemilik) {
      return res.status(400).json({ error: 'Nama, harga, dan pemilik wajib diisi!' });
    }
    try {
      const query = `
        INSERT INTO katalog_produk (nama, kategori, harga, detail, gambar, pemilik)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [nama, kategori, harga, detail, gambar, pemilik];
      const result = await pool.query(query, values);
      return res.status(201).json({ message: "Produk berhasil ditambahkan!", product: result.rows[0] });
    } catch (err) {
      console.error('[products POST]', err);
      return res.status(500).json({ error: "Gagal menambahkan produk." });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
