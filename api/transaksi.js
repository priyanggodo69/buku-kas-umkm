const pool = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST /api/transaksi — Tambah transaksi baru
  if (req.method === 'POST') {
    const { username, tipe, keterangan, jumlah, kategori } = req.body;
    if (!username || !tipe || !keterangan || !jumlah || !kategori) {
      return res.status(400).json({ error: 'Semua field wajib diisi!' });
    }
    try {
      const query = `
        INSERT INTO transaksi (username, tipe, keterangan, jumlah, kategori)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const values = [username, tipe, keterangan, jumlah, kategori];
      const result = await pool.query(query, values);
      return res.status(201).json({ message: "Transaksi berhasil disimpan!", transaksi: result.rows[0] });
    } catch (err) {
      console.error('[transaksi POST]', err);
      return res.status(500).json({ error: "Gagal menyimpan transaksi." });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
