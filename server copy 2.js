const express = require("express");
const db = require("./db"); // Impor file koneksi database
const cors = require("cors"); // Import middleware CORS
const authRoutes = require('./routes/auth'); // Impor file auth.js
const bcrypt = require('bcrypt'); // Import bcrypt
const authenticateToken = require('./controller/authenticaticateToken')
const jwt = require('jsonwebtoken');
const swaggerSetup = require ('./swagger'); // Path ke konfigurasi SwvestasiID
// const generateInvestasiID = require('./generate_id');  kalua gaya ini mah cuman satu fungsi yang dibuat 
const {  generateInvestasiID, generateAnggotaID, generateTransaksiIDTopup } = require('./generate_id')
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

// untuk cors tertentu saja
// const allowedOrigins = ['http://localhost:3000', 'http://localhost:4000'];
// Middleware CORS u
// app.use(cors({
//   origin: (origin, callback) => {
//     // Izinkan permintaan tanpa origin (misalnya dari Postman)
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   }
// }));


const corsOptions = {
  origin: '*', // Mengizinkan semua origin. Ubah sesuai kebutuhan.
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Metode HTTP yang diizinkan
  allowedHeaders: ['Content-Type', 'Authorization'], // Header yang diizinkan
};

app.use(cors(corsOptions));
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
    const [rows] = await db.query(`SELECT id_anggota, username, nama_lengkap, tanggal_masuk, alamat, saldo FROM users ;`);
    
    res.json(rows); // kirim semua data
  } catch (error) {
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/add-anggota', async (req, res) => {
  try {
    const { username, password, alamat, nama_lengkap } = req.body;

    if (!username || !password || !alamat || !nama_lengkap) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10
    const anggotaDate = new Date();
    const year = anggotaDate.getFullYear();
    const month = anggotaDate.getMonth() + 1;

    // Hitung jumlah anggota yang sudah ada di bulan dan tahun tertentu
    const [rows] = await db.query(
      'SELECT COUNT(*) AS count FROM users WHERE YEAR(tanggal_masuk) = ? AND MONTH(tanggal_masuk) = ?',
      [year, month]
    );
    const sequence = rows[0].count + 1; // Sequence baru adalah jumlah anggota + 1

    // Generate ID anggota
    const id_anggota = generateAnggotaID(year, month, sequence);

    console.log({ id_anggota, username, hashedPassword, alamat, nama_lengkap });

    // Simpan ke database
    await db.query(
      'INSERT INTO users (id_anggota, username, password, alamat, nama_lengkap, saldo) VALUES (?, ?, ?, ?, ?, 0)',
      [id_anggota, username, hashedPassword, alamat, nama_lengkap]
    );

    res.status(201).json({ message: 'Data anggota baru berhasil ditambahkan', id_anggota });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan anggota baru' });
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


/**
 * @swagger
 * /api/add-investasi:
 *   post:
 *     summary: Tambahkan investasi baru.
 *     tags: [Investasi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_anggota:
 *                 type: string
 *                 description: ID anggota yang berinvestasi.
 *                 example: "11"
 *               jumlah_investasi:
 *                 type: string
 *                 description: Jumlah investasi yang dilakukan.
 *                 example: "50000000"
 *              
 *     responses:
 *       201:
 *         description: Investasi berhasil ditambahkan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Investasi berhasil ditambahkan
 *                 id_investasi:
 *                   type: string
 *                   example: INV-2412-001
 *       500:
 *         description: Terjadi kesalahan saat menambahkan investasi.
 */

// end point untuk membuat form ADD investasi
app.post('/api/add-investasi', async (req, res) => {
  try {
      // Data dari request
      const { id_anggota, jumlah_investasi } = req.body;
      if (!id_anggota || !jumlah_investasi) {
          return res.status(400).json({ message: 'Data tidak lengkap' });
      }

      // Ambil tanggal investasi dari data
      const investasiDate = new Date();
      const year = investasiDate.getFullYear();
      const month = investasiDate.getMonth() + 1;

      // Hitung urutan pendaftaran
      const [rows] = await db.query('SELECT COUNT(*) AS count FROM investasi WHERE YEAR(tanggal_investasi) = ? AND MONTH(tanggal_investasi) = ?', [year, month]);
      const sequence = rows[0]?.count ? rows[0].count + 1 : 1;

      // Generate ID investasi
      const id_investasi = generateInvestasiID(year, month, sequence);
      console.log({ id_investasi, id_anggota, jumlah_investasi });

      // Simpan ke database
      await db.query('INSERT INTO investasi (id_investasi, id_anggota, jumlah_investasi) VALUES ( ?, ?, ?)',
          [id_investasi, id_anggota, jumlah_investasi]);

          res.status(201).json({
            message: 'Investasi berhasil ditambahkan',
            id_investasi,
            jumlah_investasi
          });
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


app.get('/api/topup', async (req, res) => {
  try{
    const [row_topup] = await db.query (`SELECT balance.id_transaksi, balance.id_anggota, users.nama_lengkap, balance.amount, balance.created_at from users
                                        INNER JOIN balance ON
                                        users.id_anggota = balance.id_anggota `)
    res.json(row_topup);
  } catch (error) {
    console.error("Database query failed: ", error.message);
    res.status(500).json({error: error.message})
  }
})
// endpoint untuk topup saldo
app.post('/api/topup', async (req, res) => {
  try {
      const token = req.headers['authorization'];
      if (!token) {
          return res.status(401).json({ message: 'Access denied, no token provided' });
      }

      const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
      const { username } = decoded;

      const { amount } = req.body;
      if (!amount || amount <= 0) {
          return res.status(400).json({ message: 'Invalid top-up amount' });
      }

      const transaksiTopupDate = new Date();
      const year = transaksiTopupDate.getFullYear();
      const month = transaksiTopupDate.getMonth() + 1;

      const [rows] = await db.query(
          'SELECT COUNT(*) AS count FROM balance WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?',
          [year, month]
      );
      const sequence = rows[0]?.count ? rows[0].count + 1 : 1;
      const id_transaksi_topup = generateTransaksiIDTopup(year, month, sequence);

      await db.query('START TRANSACTION');

      const [userResult] = await db.query(
          'SELECT id_anggota, saldo FROM users WHERE username = ?',
          [username]
      );

      if (userResult.length === 0) {
          await db.query('ROLLBACK');
          return res.status(404).json({ message: 'User not found' });
      }

      const idAnggota = userResult[0].id_anggota;
      const oldBalance = parseFloat(userResult[0].saldo); // Konversi ke angka
      const amountNum = parseFloat(amount); // Konversi ke angka
      const newBalance = oldBalance + amountNum; // Penjumlahan angka

      await db.query(
          'UPDATE users SET saldo = ? WHERE id_anggota = ?',
          [newBalance.toFixed(2), idAnggota] // Pastikan hanya menyimpan 2 desimal
      );

      await db.query(
          'INSERT INTO balance (id_transaksi, id_anggota, amount) VALUES (?, ?, ?)',
          [id_transaksi_topup, idAnggota, amountNum.toFixed(2)] // Simpan dengan format 2 desimal
      );

      await db.query('COMMIT');

      res.status(200).json({
          message: 'Top-up successful',
          oldBalance: oldBalance.toFixed(2),
          topupAmount: amountNum.toFixed(2),
          newBalance: newBalance.toFixed(2),
          id_transaksi_topup: id_transaksi_topup,
      });
  } catch (error) {
      console.error(error);
      await db.query('ROLLBACK');
      res.status(500).json({ message: 'Internal server error' });
  }
});



app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});


// Swagger setup
swaggerSetup(app);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});