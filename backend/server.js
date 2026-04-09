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
  connectionString: 'postgresql://postgres:Mikaelpraditya1@db.epkwydayacikwvksakfh.supabase.co:5432/postgres',
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
          alamat TEXT
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
  const { username, password, nama_pemilik, nama_toko, kategori, kota, whatsapp, alamat } = req.body;
  try {
    const query = `
      INSERT INTO umkm_users (username, password, nama_pemilik, nama_toko, kategori, kota, whatsapp, alamat)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [username, password, nama_pemilik, nama_toko, kategori, kota, whatsapp, alamat];
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

// 3. Ambil Katalog Produk (Get Products)
// Endpoint will fetch all products and the owner's whatsapp info
app.get('/api/products', async (req, res) => {
  try {
    // Join with umkm_users to get the whatsapp number of the owner if needed
    // Assuming 'pemilik' in katalog_produk matches 'nama_toko' in umkm_users
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

// 4. Tambah Produk (Create Product)
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

// 5. Edit Produk (Update Product)
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

// 6. Hapus Produk (Delete Product)
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


app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
