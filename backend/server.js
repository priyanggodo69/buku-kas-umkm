const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
// Set large limit because of base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres.epkwydayacikwvksakfh:Mikaelpraditya1@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database tables
const initDB = async () => {
  try {
    await pool.query(`
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
    `);

    // Add new columns to umkm_users if they don't exist (for existing tables)
    await pool.query(`
      ALTER TABLE umkm_users ADD COLUMN IF NOT EXISTS bidang VARCHAR(100);
      ALTER TABLE umkm_users ADD COLUMN IF NOT EXISTS tanggal_berdiri DATE;
      ALTER TABLE umkm_users ADD COLUMN IF NOT EXISTS izin VARCHAR(100);
    `);

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

initDB();

// --- API ENDPOINTS ---

// 1. Pendaftaran Mitra (Register)
app.post('/api/register', async (req, res) => {
  const { username, password, nama_pemilik, nama_toko, kategori, kota, whatsapp, alamat, bidang, tanggal_berdiri, izin } = req.body;
  try {
    const query = `
      INSERT INTO umkm_users (username, password, nama_pemilik, nama_toko, kategori, kota, whatsapp, alamat, bidang, tanggal_berdiri, izin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [username, password, nama_pemilik || username, nama_toko || username, kategori || null, kota || null, whatsapp || null, alamat || null, bidang || null, tanggal_berdiri || null, izin || null];
    const result = await pool.query(query, values);
    res.status(201).json({ message: "Registrasi berhasil!", user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // unique violation
      res.status(400).json({ error: "Username sudah digunakan!" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Terjadi kesalahan pada server saat registrasi." });
    }
  }
});

// 2. Masuk Akun (Login)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM umkm_users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      res.status(200).json({ message: "Login berhasil!", user: result.rows[0] });
    } else {
      res.status(401).json({ error: "Username atau Password salah!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan pada server saat login." });
  }
});

// 3. Update Profil User
app.put('/api/users/:username', async (req, res) => {
  const { username } = req.params;
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
    const values = [password || null, nama_pemilik || null, nama_toko || null, kategori || null, kota || null, whatsapp || null, alamat || null, bidang || null, tanggal_berdiri || null, izin || null, username];
    const result = await pool.query(query, values);
    if (result.rows.length > 0) {
      res.status(200).json({ message: "Profil berhasil diperbarui!", user: result.rows[0] });
    } else {
      res.status(404).json({ error: "User tidak ditemukan!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui profil." });
  }
});

// 4. Ambil Katalog Produk (Get Products)
app.get('/api/products', async (req, res) => {
  try {
    const query = `
      SELECT p.*, u.whatsapp 
      FROM katalog_produk p
      LEFT JOIN umkm_users u ON p.pemilik = u.nama_toko
      ORDER BY p.id DESC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data produk." });
  }
});

// 5. Tambah Produk (Create Product)
app.post('/api/products', async (req, res) => {
  const { nama, kategori, harga, detail, gambar, pemilik } = req.body;
  try {
    const query = `
      INSERT INTO katalog_produk (nama, kategori, harga, detail, gambar, pemilik)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [nama, kategori, harga, detail, gambar, pemilik];
    const result = await pool.query(query, values);
    res.status(201).json({ message: "Produk berhasil ditambahkan!", product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menambahkan produk." });
  }
});

// 6. Edit Produk (Update Product)
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
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
      res.status(200).json({ message: "Produk berhasil diubah!", product: result.rows[0] });
    } else {
      res.status(404).json({ error: "Produk tidak ditemukan!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui produk." });
  }
});

// 7. Hapus Produk (Delete Product)
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM katalog_produk WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.status(200).json({ message: "Produk berhasil dihapus!" });
    } else {
      res.status(404).json({ error: "Produk tidak ditemukan!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menghapus produk." });
  }
});

// --- TRANSAKSI ENDPOINTS ---

// 8. Ambil Transaksi (Get Transactions by username)
app.get('/api/transaksi/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM transaksi WHERE username = $1 ORDER BY tanggal DESC',
      [username]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data transaksi." });
  }
});

// 9. Tambah Transaksi (Create Transaction)
app.post('/api/transaksi', async (req, res) => {
  const { username, tipe, keterangan, jumlah, kategori } = req.body;
  try {
    const query = `
      INSERT INTO transaksi (username, tipe, keterangan, jumlah, kategori)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [username, tipe, keterangan, jumlah, kategori];
    const result = await pool.query(query, values);
    res.status(201).json({ message: "Transaksi berhasil disimpan!", transaksi: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menyimpan transaksi." });
  }
});

// 10. Edit Transaksi (Update Transaction)
app.put('/api/transaksi/:id', async (req, res) => {
  const { id } = req.params;
  const { tipe, keterangan, jumlah, kategori } = req.body;
  try {
    const query = `
      UPDATE transaksi
      SET tipe = $1, keterangan = $2, jumlah = $3, kategori = $4
      WHERE id = $5
      RETURNING *;
    `;
    const values = [tipe, keterangan, jumlah, kategori, id];
    const result = await pool.query(query, values);
    if (result.rows.length > 0) {
      res.status(200).json({ message: "Transaksi berhasil diubah!", transaksi: result.rows[0] });
    } else {
      res.status(404).json({ error: "Transaksi tidak ditemukan!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui transaksi." });
  }
});

// 11. Hapus Transaksi (Delete Transaction)
app.delete('/api/transaksi/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM transaksi WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.status(200).json({ message: "Transaksi berhasil dihapus!" });
    } else {
      res.status(404).json({ error: "Transaksi tidak ditemukan!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menghapus transaksi." });
  }
});


app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
