const pool = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi!' });
  }

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "Variabel DATABASE_URL tidak ditemukan di Vercel. Pastikan sudah diset di Settings." });
    }

    const result = await pool.query(
      'SELECT * FROM umkm_users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (result.rows.length > 0) {
      return res.status(200).json({ message: "Login berhasil!", user: result.rows[0] });
    } else {
      return res.status(401).json({ error: "Username atau Password salah!" });
    }
  } catch (err) {
    console.error('[login Error]', err);
    return res.status(500).json({ 
        error: "Terjadi kesalahan pada server saat login.",
        details: err.message
    });
  }
};
