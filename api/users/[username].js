const pool = require('../_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // PUT /api/users/:username — Update profil user
  if (req.method === 'PUT') {
    const { username } = req.query;
    const { password, nama_pemilik, nama_toko, kategori, kota, whatsapp, alamat, bidang, tanggal_berdiri, izin } = req.body;
    try {
      const query = `
        UPDATE umkm_users
        SET password = COALESCE($1, password),
            nama_pemilik = COALESCE($2, nama_pemilik),
            nama_toko = COALESCE($3, nama_toko),
            kategori = COALESCE($4, kategori),
            kota = COALESCE($5, kota),
            whatsapp = COALESCE($6, whatsapp),
            alamat = COALESCE($7, alamat),
            bidang = COALESCE($8, bidang),
            tanggal_berdiri = COALESCE($9, tanggal_berdiri),
            izin = COALESCE($10, izin)
        WHERE username = $11
        RETURNING *;
      `;
      const values = [
        password || null, nama_pemilik || null, nama_toko || null,
        kategori || null, kota || null, whatsapp || null,
        alamat || null, bidang || null, tanggal_berdiri || null,
        izin || null, username
      ];
      const result = await pool.query(query, values);
      if (result.rows.length > 0) {
        return res.status(200).json({ message: "Profil berhasil diperbarui!", user: result.rows[0] });
      } else {
        return res.status(404).json({ error: "User tidak ditemukan!" });
      }
    } catch (err) {
      console.error('[users/[username] PUT]', err);
      return res.status(500).json({ error: "Gagal memperbarui profil." });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
