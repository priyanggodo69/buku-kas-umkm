const pool = require('../_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  // PUT /api/products/:id — Edit produk
  if (req.method === 'PUT') {
    const { nama, kategori, harga, detail, gambar } = req.body;
    try {
      const query = `
        UPDATE katalog_produk
        SET nama = $1, kategori = $2, harga = $3, detail = $4, gambar = COALESCE($5, gambar)
        WHERE id = $6
        RETURNING *;
      `;
      const values = [nama, kategori, harga, detail, gambar || null, id];
      const result = await pool.query(query, values);
      if (result.rows.length > 0) {
        return res.status(200).json({ message: "Produk berhasil diubah!", product: result.rows[0] });
      } else {
        return res.status(404).json({ error: "Produk tidak ditemukan!" });
      }
    } catch (err) {
      console.error('[products/[id] PUT]', err);
      return res.status(500).json({ error: "Gagal memperbarui produk." });
    }
  }

  // DELETE /api/products/:id — Hapus produk
  if (req.method === 'DELETE') {
    try {
      const result = await pool.query(
        'DELETE FROM katalog_produk WHERE id = $1 RETURNING *',
        [id]
      );
      if (result.rows.length > 0) {
        return res.status(200).json({ message: "Produk berhasil dihapus!" });
      } else {
        return res.status(404).json({ error: "Produk tidak ditemukan!" });
      }
    } catch (err) {
      console.error('[products/[id] DELETE]', err);
      return res.status(500).json({ error: "Gagal menghapus produk." });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
