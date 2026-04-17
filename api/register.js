const pool = require('./_db');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password, nama_pemilik, nama_toko, kategori, kota, whatsapp, alamat, bidang, tanggal_berdiri, izin } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi!' });
  }

  try {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.SUPABASE_DATABASE_URL) {
      return res.status(500).json({ error: "Variabel DATABASE_URL tidak ditemukan di Vercel. Pastikan sudah diset di Settings lalu lakukan Redeploy." });
    }

    const query = `
      INSERT INTO umkm_users (username, password, nama_pemilik, nama_toko, kategori, kota, whatsapp, alamat, bidang, tanggal_berdiri, izin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [
      username, password,
      nama_pemilik || username,
      nama_toko || username,
      kategori || null, kota || null,
      whatsapp || null, alamat || null,
      bidang || null, tanggal_berdiri || null, izin || null
    ];
    const result = await pool.query(query, values);
    return res.status(201).json({ message: "Registrasi berhasil!", user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: "Username sudah digunakan!" });
    }
    console.error('[register]', err);
    return res.status(500).json({ 
        error: "Terjadi kesalahan pada server saat registrasi.",
        details: err.message
    });
  }
};
