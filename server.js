const express = require("express");
const db = require("./db"); // Impor file koneksi database
const cors = require("cors"); // Import middleware CORS
const bcrypt = require('bcrypt'); // Import bcrypt
const authenticateToken = require('./controller/authenticaticateToken')
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth'); // Impor file auth.js
const register = require('../backend/page/register')
const addTabungan = require('../backend/page/addTabungan')
const ambilTabungan = require('../backend/page/ambilTabungan')
const addInvestasi = require('../backend/page/addInvestasi')
const ambilInvestasi = require('../backend/page/ambilInvestasi')
const topup = require('../backend/page/topup')
const pembelian = require('../backend/page/pembelian')



const swaggerSetup = require ('./swagger'); // Path ke konfigurasi SwvestasiID
// const generateInvestasiID = require('./generate_id');  kalua gaya ini mah cuman satu fungsi yang dibuat 
const {  
  generateInvestasiID, 
  generateAnggotaID, 
  generateTransaksiIDTopup, 
  generateOrderKreditID, 
  generateTransaksiIDCicilan, 
  generateIDMenabung } = require('./generate_id')
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

app.use('/api/register', register);
app.use('/api/auth', authRoutes);
app.use('/api/menabung', addTabungan);
app.use('/api/ambil-tabungan', ambilTabungan)
app.use('/api/add-investasi', addInvestasi);
app.use('/api/ambil-investasi', ambilInvestasi)
app.use('/api/topup', topup)
app.use('/api/pembelian', pembelian)




// ====================== GET LIST ANGGOTA BUAT ADMIN ====================================

/**
 * @swagger
 * /api/anggota-koperasi:
 *   get:
 *     summary: Get all members list of KOPERASI << untuk kebutuhan admin >>
 *     description: Retrieve list data Koperasi.
 *     responses:
 *       200:
 *         description: Successful response with the list of members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_anggota:
 *                     type: integer
 *                     description: Unique identifier for the member.
 *                     example: 1
 *                   username:
 *                     type: string
 *                     description: Username of the member.
 *                     example: johndoe
 *                   nama_lengkap:
 *                     type: string
 *                     description: Full name of the member.
 *                     example: John Doe
 *                   tanggal_masuk:
 *                     type: string
 *                     format: date
 *                     description: Date the member joined.
 *                     example: 2023-05-12
 *                   alamat:
 *                     type: string
 *                     description: Address of the member.
 *                     example: Jl. Kebon Jeruk No. 15
 *                   saldo:
 *                     type: number
 *                     format: float
 *                     description: Current balance of the member.
 *                     example: 1500000.50
 *                   total_investasi:
 *                     type: number
 *                     format: float
 *                     description: Total investments made by the member.
 *                     example: 3000000.75
 *                   total_tabungan:
 *                     type: number
 *                     format: float
 *                     description: Total savings of the member.
 *                     example: 2000000.25
 *       500:
 *         description: Database query failed or server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Database query failed: Connection error."
 */



app.get("/api/anggota-koperasi", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT id_anggota, username, nama_lengkap, tanggal_masuk, alamat, saldo, total_investasi, total_tabungan FROM users ;`);
    
    res.json(rows); // kirim semua data
  } catch (error) {
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
});

// ====================== GET LIST ANGGOTA BUA user login ====================================

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * security:
 *   - bearerAuth: []
 * 
 * /api/profile-anggota:
 *   get:
 *     summary: Get profile by user
 *     description: Mendapatkan detail profile user.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []  # Pastikan ini ada agar token dikirim
 *     responses:
 *       200:
 *         description: Successful response with the detail profile user.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_anggota:
 *                     type: string
 *                     description: ID unik setiap anggota.
 *                     example: ANG-2412-001
 *                   username:
 *                     type: string
 *                     description: Username anggota.
 *                     example: admin
 *                   nama_lengkap:
 *                     type: string
 *                     description: Nama lengkap.
 *                     example: ADMIN UTAMA
 *                   tanggal_masuk:
 *                     type: string
 *                     format: date
 *                     description: Tanggal daftar member.
 *                     example: 2023-05-12
 *                   alamat:
 *                     type: string
 *                     description: Alamat anggota.
 *                     example: Bojongsoang - Kab Bandung
 *                   saldo:
 *                     type: number
 *                     format: float
 *                     description: Saldo anggota.
 *                     example: 185000.00
 *                   total_investasi:
 *                     type: number
 *                     format: float
 *                     description: Total investasi anggota.
 *                     example: 3000000.75
 *                   total_tabungan:
 *                     type: number
 *                     format: float
 *                     description: Total tabungan anggota.
 *                     example: 2000000.25
 *       401:
 *         description: Tidak memiliki akses (Token salah atau tidak diberikan)
 *       500:
 *         description: Kesalahan server atau database.
 */




app.get("/api/profile-anggota", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied, no valid token provided" });
    }

    const token = authHeader.split(" ")[1]; // Ambil token setelah "Bearer"
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.username) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const { username } = decoded;
    const [row_profile_user] = await db.query(
      `SELECT id_anggota, username, nama_lengkap, tanggal_masuk, alamat, saldo, total_investasi, total_tabungan 
      FROM users WHERE username = ?`, 
      [username]
    );

    if (row_profile_user.length === 0) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.json(row_profile_user);
  } catch (error) {
    console.error("Database query failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========================================================================================

// ==================================== UPDATE USER ======================================
/**
 * @swagger
 * /api/profile-anggota:
 *   put:
 *     summary: Update profile by user
 *     description: Mengubah detail profile user berdasarkan input yang diberikan.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_lengkap:
 *                 type: string
 *                 description: Nama lengkap anggota.
 *                 example: ADMIN UTAMA
 *               alamat:
 *                 type: string
 *                 description: Alamat anggota.
 *                 example: Bojongsoang - Kab Bandung
 *               
 *     responses:
 *       200:
 *         description: Berhasil memperbarui data profile user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully."
 *       400:
 *         description: Input tidak valid atau data tidak ditemukan.
 *       401:
 *         description: Tidak memiliki akses (Token salah atau tidak diberikan).
 *       500:
 *         description: Kesalahan server atau database.
 */

app.put("/api/profile-anggota", async (req, res) => {
  try {
    // Verifikasi token (hapus jika tidak menggunakan token)
    const token_profile_anggota = req.headers['authorization'];
    if (!token_profile_anggota) {
      return res.status(401).json({ message: 'Access denied, no token provided' });
    }
    const decoded_profile_anggota = jwt.verify(token_profile_anggota.split(' ')[1], process.env.JWT_SECRET);
    const { username } = decoded_profile_anggota;

    // Ambil data dari body request
    const { nama_lengkap, alamat } = req.body;

    // Validasi input
    if (!nama_lengkap && !alamat ) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    // Query untuk update data
    const [result] = await db.query(
      `UPDATE users SET 
        nama_lengkap = COALESCE(?, nama_lengkap),
        alamat = COALESCE(?, alamat)
      WHERE username = ?`,
      [nama_lengkap, alamat, username]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Profile not found or no changes made' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error("Database update failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
});

 
//  =================================== KREDIT LIST ========================================
app.get("/api/kredit_list", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT anggota.id_anggota, anggota.nama_lengkap AS nama_Anggota, kredit_barang.nama_barang FROM anggota INNER JOIN kredit_barang ON anggota.id_anggota = kredit_barang.id_anggota;;`);
    
    res.json(rows); // kirim semua data
  } catch (error) {
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
});

//  ======================== HISTORY TABUNGAN ========================


/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * security:
 *   - bearerAuth: []
 * 
 * /api/transaksi-tabungan:
 *   get:
 *     summary: Get History tabungan per user
 *     description: History tabungan per user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with the list of members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array  
 *               items:
 *                 type: object
 *                 properties:
 *                   id_tabungan:
 *                     type: string
 *                     description: Unique identifier for the member.
 *                     example: TAB-2412-001
 *                   tanggal_menabung:
 *                     type: stamptime
 *                     description: tanggal menabung.
 *                     example: 19-12-2024
 *                   jumlah_menabung:
 *                     type: number
 *                     format: float
 *                     description: jumlah menabung pada transaksi tersebut made by the member.
 *                     example: 50000.00
 *       500:
 *         description: Database query failed or server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message.
 *                   example: "Database query failed: Connection error."
 */


// end point ini sebaiknya untuk History investasi
// ini pun harus pake decode token biar uniq ID dan username sudah ada... ini buat dipake di swagger un
app.get("/api/transaksi-tabungan", async (req, res) => {
  try {
    // hapus dari sini kalo ga mau pake token 
    const token_transaksi_tabungan = req.headers['authorization'];
    if (!token_transaksi_tabungan) {
      return res.status(401).json({ message: 'Access denied, no token provided'});
    }
    const decoded_transaksi_tabungan = jwt.verify(token_transaksi_tabungan.split(' ')[1], process.env.JWT_SECRET)
    const {username} = decoded_transaksi_tabungan;
    // hapus sampe sini kalo ga mau pake token
    
    // jika ga mau pake token, maka untuq querynya hapus yang ada where = username
    const [row_transaksi_tabungan] =  await db.query (`SELECT transaksi_tabungan.id_tabungan, transaksi_tabungan.tanggal_menabung, transaksi_tabungan.jumlah_menabung from transaksi_tabungan inner join users on users.id_anggota = transaksi_tabungan.id_anggota  where username = ?`,
      [username]);
    res.json(row_transaksi_tabungan);
  } catch (error){
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
})


//  ======================== HISTORY INVESTASI =======================
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * security:
 *   - bearerAuth: []
 * 
 * /api/transaksi-investasi:
 *   get:
 *     summary: History transaksi investasi
 *     description: Pengambilan history transaksi investasi per user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with the list of members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array  
 *               items:
 *                 type: object
 *                 properties:
 *                   id_anggota:
 *                     type: string
 *                     description: Unique identifier for the member.
 *                     example: ANG-01-01
 *                   nama_lengkap:
 *                     type: string
 *                     description: Nama lengkap dari user yang sudah login.
 *                     example: Dede Anjar
 *                   total_investasi:
 *                     type: number
 *                     format: float
 *                     description: Total investments made by the member.
 *                     example: 3000000.75
 *       500:
 *         description: Database query failed or server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message.
 *                   example: "Database query failed: Connection error."
 */

// fungsi ini untuk endpoint admin mendapatkan transaksi semua investasi
// app.get("/api/transaksi-investasi", async (req, res) => {
//   try {
//     const [row_investasi] =  await db.query (`SELECT users.id_anggota, users.nama_lengkap, transaksi_investasi.id_investasi, transaksi_investasi.tanggal_investasi, transaksi_investasi.jumlah_investasi from users INNER JOIN transaksi_investasi on transaksi_investasi.id_anggota = users.id_anggota;`);
//     res.json(row_investasi);
//   } catch (error){
//     console.error("Database query failed:", error.message); // Log error
//     res.status(500).json({ error: error.message });
//   }
// })

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * security:
 *   - bearerAuth: []
 * 
 * /api/transaksi-investasi:
 *   get:
 *     summary: Get History investasi per user
 *     description: History Investasi per user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with the list of members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array  
 *               items:
 *                 type: object
 *                 properties:
 *                   id_investasi:
 *                     type: string
 *                     description: Unique identifier for the member.
 *                     example: INV-2412-001
 *                   tanggal_investasi:
 *                     type: stamptime
 *                     description: tanggal transaksi.
 *                     example: 19-12-2024
 *                   jumlah_investasi:
 *                     type: number
 *                     format: float
 *                     description: Total investments made by the member.
 *                     example: 50000.00
 *       500:
 *         description: Database query failed or server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message.
 *                   example: "Database query failed: Connection error."
 */


// end point ini sebaiknya untuk History investasi
// ini pun harus pake decode token biar uniq ID dan username sudah ada... ini buat dipake di swagger un
app.get("/api/transaksi-investasi", async (req, res) => {
  try {
    // hapus dari sini kalo ga mau pake token 
    const token_transaksi_investasi = req.headers['authorization'];
    if (!token_transaksi_investasi) {
      return res.status(401).json({ message: 'Access denied, no token provided'});
    }
    const decoded_transaksi_investasi = jwt.verify(token_transaksi_investasi.split(' ')[1], process.env.JWT_SECRET)
    const {username} = decoded_transaksi_investasi;
    // hapus sampe sini kalo ga mau pake token
    
    // jika ga mau pake token, maka untuq querynya hapus yang ada where = username
    const [row_transaksi_investasi] = await db.query(`
      SELECT 
          transaksi_investasi.id_investasi, 
          transaksi_investasi.tanggal_investasi, 
          transaksi_investasi.jumlah_investasi, 
          transaksi_investasi.id_anggota, 
          users.username,
          
          -- Menghitung GrandTotal per user
          (SELECT 
              SUM(
                  CASE 
                      WHEN t.id_investasi LIKE '%INV%' THEN t.jumlah_investasi
                      WHEN t.id_investasi LIKE '%WITHDRAW%' THEN -t.jumlah_investasi
                      ELSE 0  
                  END
              ) 
           FROM transaksi_investasi t 
           WHERE t.id_anggota = transaksi_investasi.id_anggota
          ) AS GrandTotal
  
      FROM transaksi_investasi 
      INNER JOIN users ON users.id_anggota = transaksi_investasi.id_anggota  
      WHERE users.username = ?
      ORDER BY transaksi_investasi.tanggal_investasi DESC;
  `, [username]);
  
    res.json(row_transaksi_investasi);
  } catch (error){
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
})
// ==============  TOTAL INVESTASI =============
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * security:
 *   - bearerAuth: []
 * 
 * /api/total-investasi:
 *   get:
 *     summary: Get total investasi per user
 *     description: Retrieve list total investasi per user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with the list of members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array  
 *               items:
 *                 type: object
 *                 properties:
 *                   id_anggota:
 *                     type: string
 *                     description: Unique identifier for the member.
 *                     example: ANG-01-01
 *                   nama_lengkap:
 *                     type: string
 *                     description: Nama lengkap dari user yang sudah login.
 *                     example: Dede Anjar
 *                   total_investasi:
 *                     type: number
 *                     format: float
 *                     description: Total investments made by the member.
 *                     example: 3000000.75
 *       500:
 *         description: Database query failed or server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message.
 *                   example: "Database query failed: Connection error."
 */


//  end point ini untuk melihat total investasi user tersebut yang login
app.get("/api/total-investasi", async (req, res) => {
  try {
    // hapus dari sini kalo ga mau pake token 
    const token_total_investasi = req.headers['authorization'];
    if (!token_total_investasi) {
      return res.status(401).json({ message: 'Access denied, no token provided'});
    }
    const decoded_total_investasi = jwt.verify(token_total_investasi.split(' ')[1], process.env.JWT_SECRET)
    const {username} = decoded_total_investasi; 
    // hapus sampe sini kalo ga mau pake token

    const [row_total_investasi] =  await db.query (`SELECT id_anggota, nama_lengkap,  total_investasi from users where username = ?`,
      [username]);
    res.json(row_total_investasi);
  } catch (error){
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
})

// ===================== Total Tabungan ==============================

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * security:
 *   - bearerAuth: []
 * 
 * /api/total-tabungan:
 *   get:
 *     summary: Get total tabungan per user
 *     description: Retrieve list total tabungan per user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with the list of members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array  
 *               items:
 *                 type: object
 *                 properties:
 *                   id_anggota:
 *                     type: string
 *                     description: Unique identifier for the member.
 *                     example: ANG-01-01
 *                   nama_lengkap:
 *                     type: string
 *                     description: Nama lengkap dari user yang sudah login.
 *                     example: Dede Anjar
 *                   total_tabungan:
 *                     type: number
 *                     format: float
 *                     description: Total tabungan made by the member.
 *                     example: 300000.75
 *       500:
 *         description: Database query failed or server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message.
 *                   example: "Database query failed: Connection error."
 */


//  end point ini untuk melihat total investasi user tersebut yang login
app.get("/api/total-tabungan", async (req, res) => {
  try {
    // hapus dari sini kalo ga mau pake token 
    const token_total_tabungan = req.headers['authorization'];
    if (!token_total_tabungan) {
      return res.status(401).json({ message: 'Access denied, no token provided'});
    }
    const decoded_total_tabungan = jwt.verify(token_total_tabungan.split(' ')[1], process.env.JWT_SECRET)
    const {username} = decoded_total_tabungan; 
    // hapus sampe sini kalo ga mau pake token

    const [row_total_tabungan] =  await db.query (`SELECT id_anggota, nama_lengkap,  total_tabungan from users where username = ?`,
      [username]);
    res.json(row_total_tabungan);
  } catch (error){
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
})



// =============================== get kredit per user ======================
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
    // hapus dari sini kalo ga mau pake token 
    const token_transaksi_tabungan = req.headers['authorization'];
    if (!token_transaksi_tabungan) {
      return res.status(401).json({ message: 'Access denied, no token provided'});
    }
    const decoded_transaksi_tabungan = jwt.verify(token_transaksi_tabungan.split(' ')[1], process.env.JWT_SECRET)
    const {username} = decoded_transaksi_tabungan;
    // hapus sampe sini kalo ga mau pake token
    const [row_transaksi_tabungan] = await db.query (`
      select 
      users.username, 
      users.id_anggota, 
      transaksi_tabungan.id_tabungan,
      transaksi_tabungan.jumlah_menabung, 
      transaksi_tabungan.tanggal_menabung, 
      transaksi_tabungan.jenis_transaksi 
      from users
      INNER join transaksi_tabungan 
      on users.id_anggota = transaksi_tabungan.id_anggota
      where username = ?
      ORDER BY transaksi_tabungan.tanggal_menabung DESC;`
      , [username]);
    res.json(row_transaksi_tabungan);
  } catch (error) {
    console.error("Database query failed: ", error.message);
    res.status(500).json({error : error.message})
  }
})

// ============================= HISTORY TOPUP ============================


/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * security:
 *   - bearerAuth: []
 * 
 * /api/transaksi-topup:
 *   get:
 *     summary: Get History topup per user
 *     description: History topup per user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with the list of members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array  
 *               items:
 *                 type: object
 *                 properties:
 *                   id_transaksi:
 *                     type: string
 *                     description: Unique identifier for the member.
 *                     example: IDTOPUP-2412-001
 *                   created_at:
 *                     type: stamptime
 *                     description: tanggal topup.
 *                     example: 19-12-2024
 *                   amount:
 *                     type: number
 *                     format: float
 *                     description: History topup made by the member.
 *                     example: 50000.00
 *       500:
 *         description: Database query failed or server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message.
 *                   example: "Database query failed: Connection error."
 */


// end point ini sebaiknya untuk History topup
// ini pun harus pake decode token biar uniq ID dan username sudah ada... ini buat dipake di swagger un
app.get("/api/transaksi-topup", async (req, res) => {
  try {
    // hapus dari sini kalo ga mau pake token 
    const token_transaksi_topup = req.headers['authorization'];
    if (!token_transaksi_topup) {
      return res.status(401).json({ message: 'Access denied, no token provided'});
    }
    const decoded_transaksi_topup = jwt.verify(token_transaksi_topup.split(' ')[1], process.env.JWT_SECRET)
    const {username} = decoded_transaksi_topup;
    // hapus sampe sini kalo ga mau pake token
    
    // jika ga mau pake token, maka untuq querynya hapus yang ada where = username
    const [row_transaksi_topup] =  await db.query (`SELECT transaksi_topup.id_transaksi, transaksi_topup.created_at, transaksi_topup.amount from transaksi_topup inner join users on users.id_anggota = transaksi_topup.id_anggota  where username = ?`,
      [username]);
    res.json(row_transaksi_topup);
  } catch (error){
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
})




// fungsi ini untuk melihat semua data oleh admin
// app.get('/api/saldo', async (req, res) => {
//   try{
//     const [row_topup] = await db.query (`SELECT transaksi_topup.id_transaksi, transaksi_topup.id_anggota, users.nama_lengkap, transaksi_topup.amount, transaksi_topup.created_at from users
//                                         INNER JOIN transaksi_topup ON
//                                         users.id_anggota = transaksi_topup.id_anggota `)
//     res.json(row_topup);
//   } catch (error) {
//     console.error("Database query failed: ", error.message);
//     res.status(500).json({error: error.message})
//   }
// })


/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * security:
 *   - bearerAuth: []
 * 
 * /api/saldo:
 *   get:
 *     summary: Get Saldo per user
 *     description: Saldo atau balance per user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with the list of members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array  
 *               items:
 *                 type: object
 *                 properties:
 *                   id_anggota:
 *                     type: string
 *                     description: Unique identifier for the member.
 *                     example: ANG-2412-001
 *                   nama_lengkap:
 *                     type: string
 *                     description: Nama lengkap dari user yang sudah login.
 *                     example: Dede Anjar
 *                   saldo:
 *                     type: number
 *                     format: float
 *                     description: Cek saldo atau balance per user.
 *                     example: 12345.00
 *       500:
 *         description: Database query failed or server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message.
 *                   example: "Database query failed: Connection error."
 */

// fungsi ini untuk menggunakan decode token
app.get('/api/saldo', async (req, res) => {
  try{
    // hapus dari sini kalo ga mau pake token 
    const token_saldo = req.headers['authorization'];
    if (!token_saldo) {
      return res.status(401).json({ message: 'Access denied, no token provided'});
    }
    const decoded_saldo = jwt.verify(token_saldo.split(' ')[1], process.env.JWT_SECRET)
    const {username} = decoded_saldo; 
    // hapus sampe sini kalo ga mau pake token

    const [row_total_saldo] =  await db.query (`SELECT id_anggota, nama_lengkap,  saldo from users where username = ?`,
      [username]);

    res.json(row_total_saldo);
  } catch (error) {
    console.error("Database query failed: ", error.message);
    res.status(500).json({error: error.message})
  }
})

//  get tabungan




app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});


// Swagger setup
swaggerSetup(app);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});