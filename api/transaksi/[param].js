const pool = require('../_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { param } = req.query;

  // GET /api/transaksi/:username — Ambil transaksi berdasarkan username
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT * FROM transaksi WHERE username = $1 ORDER BY tanggal DESC',
        [param]
      );
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('[transaksi/[param] GET]', err);
      return res.status(500).json({ error: "Gagal mengambil data transaksi." });
    }
  }

  // PUT /api/transaksi/:id — Edit transaksi berdasarkan ID
  if (req.method === 'PUT') {
    const { tipe, keterangan, jumlah, kategori } = req.body;
    try {
      const query = `
        UPDATE transaksi
        SET tipe = $1, keterangan = $2, jumlah = $3, kategori = $4
        WHERE id = $5
        RETURNING *;
      `;
      const values = [tipe, keterangan, jumlah, kategori, param];
      const result = await pool.query(query, values);
      if (result.rows.length > 0) {
        return res.status(200).json({ message: "Transaksi berhasil diubah!", transaksi: result.rows[0] });
      } else {
        return res.status(404).json({ error: "Transaksi tidak ditemukan!" });
      }
    } catch (err) {
      console.error('[transaksi/[param] PUT]', err);
      return res.status(500).json({ error: "Gagal memperbarui transaksi." });
    }
  }

  // DELETE /api/transaksi/:id — Hapus transaksi berdasarkan ID
  if (req.method === 'DELETE') {
    try {
      const result = await pool.query(
        'DELETE FROM transaksi WHERE id = $1 RETURNING *',
        [param]
      );
      if (result.rows.length > 0) {
        return res.status(200).json({ message: "Transaksi berhasil dihapus!" });
      } else {
        return res.status(404).json({ error: "Transaksi tidak ditemukan!" });
      }
    } catch (err) {
      console.error('[transaksi/[param] DELETE]', err);
      return res.status(500).json({ error: "Gagal menghapus transaksi." });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
