const express = require("express");
const db = require("./db"); // Impor file koneksi database
const cors = require("cors"); // Import middleware CORS
const authRoutes = require('./routes/auth'); // Impor file auth.js
const bcrypt = require('bcrypt'); // Import bcrypt
const authenticateToken = require('./controller/authenticaticateToken')
const jwt = require('jsonwebtoken');
// Import fungsi generateInvestasiID
// const generateInvestasiID = require('./generate_id');  kalua gaya ini mah cuman satu fungsi yang dibuat 
const {  generateInvestasiID, generateAnggotaID } = require('./generate_id')
const PORT = process.env.PORT || 5000;

const app = express();
//  cors yang sudah jalan
// app.use(cors({
//   origin: "http://localhost:3000", // Izinkan akses hanya dari frontend React
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Metode yang diizinkan
//   allowedHeaders: "Content-Type,Authorization", // Header yang diizinkan
// }));

// pake dua origin port localhost udah jalan juga di server local
// untuk http http://localhost:3000 sebaiknya menggunakan database jwt login
const allowedOrigins = ['http://localhost:3000', 'http://localhost:4000'];

// Middleware CORS u
app.use(cors({
  origin: (origin, callback) => {
    // Izinkan permintaan tanpa origin (misalnya dari Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.get('/', (req, res) => {
  res.send('CORS Configuration Successful');
});

app.use(express.json()); // Middleware untuk parsing JSON


app.use('/api/auth', authRoutes);


app.get("/api/dashboard-data", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT 
      COUNT(a.id_anggota) AS jumlah_anggota,
      COALESCE(SUM(i.jumlah_investasi), 0) AS jumlah_investasi,
      COALESCE(SUM(t.jumlah_setoran), 0) AS jumlah_tabungan,
      COALESCE(SUM(kb.harga_barang), 0) AS jumlah_pinjaman,
      COALESCE(SUM(c.jumlah_bayar), 0) AS pinjaman_masuk
    FROM 
      anggota a
    LEFT JOIN 
      investasi i ON a.id_anggota = i.id_anggota
    LEFT JOIN 
      tabungan t ON a.id_anggota = t.id_anggota
    LEFT JOIN 
      kredit_barang kb ON a.id_anggota = kb.id_anggota 
    LEFT JOIN 
      cicilan_barang c ON kb.id_kredit = c.id_kredit;`);
    
    res.json(rows[0]); // Kirim baris pertama
  } catch (error) {
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/anggota-koperasi", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT id_anggota, username, nama_lengkap, tanggal_masuk, alamat FROM users ;`);
    
    res.json(rows); // kirim semua data
  } catch (error) {
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/add-anggota', async (req, res) => {
  try {
      // Data dari request
      const { username, password, tanggal_masuk, alamat } = req.body;
      if (!username || !password || !tanggal_masuk || !alamat) {
          return res.status(400).json({ message: 'Data tidak lengkap' });
      }

      // Hash password sebelum disimpan
      const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

      // Ambil tanggal investasi dari data
      const anggotaDate = new Date(tanggal_masuk);
      const year = anggotaDate.getFullYear();
      const month = anggotaDate.getMonth() + 1;

      // Hitung urutan pendaftaran
      // const [rows] = await db.query('SELECT COUNT(*) AS count FROM users WHERE YEAR(tanggal_masuk) = ? AND MONTH(tanggal_masuk) = ?', [year, month]);
      // const sequence = rows[0]?.count ? rows[0].count + 1 : 1;

      const [rows] = await db.query('SELECT MAX(CAST(SUBSTRING_INDEX(id_anggota, "-", -1) AS UNSIGNED)) AS max_sequence FROM users WHERE id_anggota LIKE ?', [`ANG-${year.toString().slice(-2)}%`]);
      const sequence = rows[0]?.max_sequence ? rows[0].max_sequence + 1 : 1;

      // Generate ID investasi
      const id_anggota = generateAnggotaID(year, month, sequence);
      console.log({ id_anggota, username, password, tanggal_masuk, alamat });

      // Simpan ke database
      await db.query('INSERT INTO users (id_anggota, username, password, tanggal_masuk, alamat) VALUES (?, ?, ?, ?, ?)',
          [id_anggota, username, hashedPassword, tanggal_masuk, alamat]);

      res.status(201).json({ message: 'Data anggota baru berhasil ditambahkan', id_anggota });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan investasi' });
  }
});


app.get("/api/kredit_list", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT anggota.id_anggota, anggota.nama_lengkap AS nama_Anggota, kredit_barang.nama_barang FROM anggota INNER JOIN kredit_barang ON anggota.id_anggota = kredit_barang.id_anggota;;`);
    
    res.json(rows); // kirim semua data
  } catch (error) {
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
});


app.get("/api/investasi", async (req, res) => {
  try {
    const [row_investasi] =  await db.query (`SELECT users.id_anggota, users.username, investasi.id_investasi, investasi.tanggal_investasi, investasi.jumlah_investasi from users INNER JOIN investasi on investasi.id_anggota = users.id_anggota;`);
    res.json(row_investasi);
  } catch (error){
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
})


// end point untuk membuat form ADD investasi
app.post('/api/add-investasi', async (req, res) => {
  try {
      // Data dari request
      const { id_anggota, jumlah_investasi, tanggal_investasi } = req.body;
      if (!id_anggota || !jumlah_investasi || !tanggal_investasi) {
          return res.status(400).json({ message: 'Data tidak lengkap' });
      }

      // Ambil tanggal investasi dari data
      const investasiDate = new Date(tanggal_investasi);
      const year = investasiDate.getFullYear();
      const month = investasiDate.getMonth() + 1;

      // Hitung urutan pendaftaran
      const [rows] = await db.query('SELECT COUNT(*) AS count FROM investasi WHERE YEAR(tanggal_investasi) = ? AND MONTH(tanggal_investasi) = ?', [year, month]);
      const sequence = rows[0]?.count ? rows[0].count + 1 : 1;

      // Generate ID investasi
      const id_investasi = generateInvestasiID(year, month, sequence);
      console.log({ id_investasi, id_anggota, jumlah_investasi, tanggal_investasi });

      // Simpan ke database
      await db.query('INSERT INTO investasi (id_investasi, id_anggota, jumlah_investasi, tanggal_investasi) VALUES (?, ?, ?, ?)',
          [id_investasi, id_anggota, jumlah_investasi, tanggal_investasi]);

      res.status(201).json({ message: 'Investasi berhasil ditambahkan', id_investasi });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan investasi' });
  }
});



app.get("/api/kredit", async (req, res) => {
  try {
    const [row_kredit] = await db.query (`SELECT users.id_anggota, users.username, kredit_barang.id_kredit, kredit_barang.nama_barang, kredit_barang.harga_barang, kredit_barang.tanggal_pengajuan, kredit_barang.status_kredit FROM users INNER JOIN kredit_barang on users.id_anggota = kredit_barang.id_anggota ORDER by id_anggota ASC;`)
    res.json(row_kredit);
  } catch (error) {
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
    
  }
})

app.get("/api/tabungan_pokok", async (req, res) => {
  try {
    const [row_shu] = await db.query (`select users.username, tabungan_pokok.jumlah_setoran, tabungan_pokok.tanggal_setor FROM users INNER join tabungan_pokok on users.id_anggota = tabungan_pokok.id_anggota;`)
    res.json(row_shu);
  } catch (error) {
    console.error("Database query failed: ", error.message);
    res.status(500).json({error : error.message})
  }
})

// endpoint untuk topup saldo
app.post('/api/topup', async (req, res) => {
  try {
      const token = req.headers['authorization']; // Ambil token dari header
      if (!token) {
          return res.status(401).json({ message: 'Access denied, no token provided' });
      }

      // Verifikasi dan decode token
      const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
      console.log("decode", decoded);

      // Data user yang didekode dari token
      const { username } = decoded;
      console.log("username yang sudah didecode", username)
      
      // Ambil data jumlah top-up dari body request
      const { amount } = req.body;

      if (!amount || amount <= 0) {
          return res.status(400).json({ message: 'Invalid top-up amount' });
      }

      // Mulai transaksi: update saldo di tabel users dan simpan transaksi ke tabel topup
      await db.query('START TRANSACTION');
      
      // Update saldo di tabel users
      const [result] = await db.query(
          'UPDATE users SET saldo = saldo + ? WHERE username = ?',
          [amount, username]
      );

      if (result.affectedRows === 0) {
          await db.query('ROLLBACK');
          return res.status(404).json({ message: 'User not found' });
      }

      // Simpan transaksi top-up di tabel topup
      await db.query(
          'INSERT INTO balance (username, amount) VALUES (?, ?)',
          [username, amount]
      );

      // Commit transaksi jika semuanya berhasil
      await db.query('COMMIT');

      res.status(200).json({ message: 'Top-up successful', newBalance: amount });
  } catch (error) {
      console.error(error);
      await db.query('ROLLBACK'); // Jika terjadi error, rollback transaksi
      res.status(500).json({ message: 'Internal server error' });
  }
});



app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});