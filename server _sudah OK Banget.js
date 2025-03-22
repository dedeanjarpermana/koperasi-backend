const express = require("express");
const db = require("./db"); // Impor file koneksi database
const cors = require("cors"); // Import middleware CORS
const authRoutes = require('./routes/auth'); // Impor file auth.js
const bcrypt = require('bcrypt'); // Import bcrypt
const authenticateToken = require('./controller/authenticaticateToken')
const jwt = require('jsonwebtoken');
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


app.use('/api/auth', authRoutes);

/**
 * @swagger
 * /api/add-anggota:
 *   post:
 *     summary: Registrasi / admin tambah anggota
 *     description: Endpoint untuk menambahkan anggota baru ke database koperasi.
 *     tags:
 *       - Registrasi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - alamat
 *               - nama_lengkap
 *             properties:
 *               username:
 *                 type: string
 *                 example: "dede_anjar_permana"
 *               password:
 *                 type: string
 *                 example: "mypassword123"
 *               alamat:
 *                 type: string
 *                 example: "Jl. Braga Cinta no 10 Bandung"
 *               nama_lengkap:
 *                 type: string
 *                 example: "dede anjar permana"
 *     responses:
 *       201:
 *         description: Data anggota baru berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Data anggota baru berhasil ditambahkan"
 *                 id_anggota:
 *                   type: string
 *                   example: "202406-001"
 *       400:
 *         description: Data tidak lengkap
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Data tidak lengkap"
 *       409:
 *         description: ID anggota sudah ada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ID anggota sudah ada, coba lagi."
 *       500:
 *         description: Terjadi kesalahan server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Terjadi kesalahan saat menambahkan anggota baru"
 */

app.post('/api/add-anggota', async (req, res) => {
  try {
    const { username, password, alamat, nama_lengkap } = req.body;

    // Validasi input
    if (!username || !password || !alamat || !nama_lengkap) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password
    const anggotaDate = new Date();
    const year = anggotaDate.getFullYear();
    const month = anggotaDate.getMonth() + 1;

    // Hitung sequence berdasarkan jumlah data yang sudah ada
    const [rows] = await db.query(
      'SELECT COUNT(*) AS count FROM users WHERE YEAR(tanggal_masuk) = ? AND MONTH(tanggal_masuk) = ?',
      [year, month]
    );
    const sequence = rows[0]?.count ? rows[0].count + 1 : 1;

    // Generate ID anggota
    const id_anggota = generateAnggotaID(year, month, sequence);
    const total_investasi = 0;
    const saldo = 0;
    const total_tabungan = 0;

    // Validasi unik ID anggota
    const [existing] = await db.query(
      'SELECT id_anggota FROM users WHERE id_anggota = ?',
      [id_anggota]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'ID anggota sudah ada, coba lagi.' });
    }

    // Simpan ke database
    await db.query(
      'INSERT INTO users (id_anggota, username, password, alamat, nama_lengkap, saldo, total_investasi, total_tabungan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id_anggota, username, hashedPassword, alamat, nama_lengkap, saldo, total_investasi, total_tabungan]
    );

    res.status(201).json({ message: 'Data anggota baru berhasil ditambahkan', id_anggota });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan anggota baru' });
  }
});

// app.post('/api/add-anggota', async (req, res) => {
//   try {
//     const { username, password, alamat, nama_lengkap } = req.body;

//     if (!username || !password || !alamat || !nama_lengkap) {
//       return res.status(400).json({ message: 'Data tidak lengkap' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const anggotaDate = new Date();
//     const year = anggotaDate.getFullYear();
//     const month = anggotaDate.getMonth() + 1;

//     // Cari sequence terbesar berdasarkan pola ID anggota
//     const [rows] = await db.query(
//       'SELECT MAX(SUBSTRING_INDEX(id_anggota, "-", -1)) AS max_sequence FROM users WHERE id_anggota LIKE ?',
//       [`ANG-${year}${String(month).padStart(2, '0')}%`]
//     );

//     const maxSequence = rows[0].max_sequence ? parseInt(rows[0].max_sequence, 10) : 0;
//     const sequence = maxSequence + 1;
//     const formattedSequence = String(sequence).padStart(3, '0'); // Tambahkan padding
//     const id_anggota = `ANG-${year}${String(month).padStart(2, '0')}-${formattedSequence}`;
//     const total_investasi = 0;
//     const saldo = 0;
//     const total_tabungan = 0;

//     // Validasi unik ID anggota
//     const [existing] = await db.query(
//       'SELECT id_anggota FROM users WHERE id_anggota = ?',
//       [id_anggota]
//     );
//     console.log(existing)
//     if (existing.length > 0) {
//       return res.status(409).json({ message: 'ID anggota sudah ada, coba lagi.' });
//     }

//     // Simpan ke database
//     await db.query(
//       'INSERT INTO users (id_anggota, username, password, alamat, nama_lengkap, saldo, total_investasi, total_tabungan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
//       [id_anggota, username, hashedPassword, alamat, nama_lengkap, saldo, total_investasi, total_tabungan]
//     );

//     res.status(201).json({ message: 'Data anggota baru berhasil ditambahkan', id_anggota });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan anggota baru' });
//   }
// });

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

// ====================== GET LIST ANGGOTA BUAT ADMIN ====================================

/**
 * @swagger
 * /api/profile-anggota:
 *   get:
 *     summary: Get profile by user
 *     description: Mendapatkan detail profile user.
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
 *                     type: varchar
 *                     description: id unik setiap anggota.
 *                     example: ANG-2412-001
 *                   username:
 *                     type: string
 *                     description: Username of the member.
 *                     example: dede.anjar.permana
 *                   nama_lengkap:
 *                     type: string
 *                     description: nama lengkap.
 *                     example: Dede Anjar Permana
 *                   tanggal_masuk:
 *                     type: string
 *                     format: date
 *                     description: Tanggal daftar member.
 *                     example: 2023-05-12
 *                   alamat:
 *                     type: string
 *                     description: Alamat anggota.
 *                     example: Komplek GBA 1 BLOK A Bojongsoang
 *                   saldo:
 *                     type: number
 *                     format: float
 *                     description: Jumlah saldo saat ini.
 *                     example: 10500.00
 *                   total_investasi:
 *                     type: number
 *                     format: float
 *                     description: Total investasi setiap user
 *                     example: 3000000.75
 *                   total_tabungan:
 *                     type: number
 *                     format: float
 *                     description: Total tabungan setiap user.
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



app.get("/api/profile-anggota", async (req, res) => {
  try {
    // hapus dari sini kalo ga mau pake token 
    const token_profile_anggota = req.headers['authorization'];
    if (!token_profile_anggota) {
      return res.status(401).json({ message: 'Access denied, no token provided'});
    }
    const decoded_profile_anggota = jwt.verify(token_profile_anggota.split(' ')[1], process.env.JWT_SECRET)
    const {username} = decoded_profile_anggota;
    // hapus sampe sini kalo ga mau pake token
    const [rows] = await db.query(`SELECT id_anggota, username, nama_lengkap, tanggal_masuk, alamat, saldo, total_investasi, total_tabungan FROM users ;`);
    
    res.json(rows); // kirim semua data
  } catch (error) {
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
});
// ========================================================================================
 
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
    const [row_transaksi_investasi] =  await db.query (`SELECT transaksi_investasi.id_investasi, transaksi_investasi.tanggal_investasi, transaksi_investasi.jumlah_investasi from transaksi_investasi inner join users on users.id_anggota = transaksi_investasi.id_anggota  where username = ?`,
      [username]);
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

// ===================== Add investasi =================================

/**
 * @swagger
 * /api/add-investasi:
 *   post:
 *     summary: Melakukan add - investasi
 *     description: Menambahkan investasi. Memerlukan autentikasi.
 *     tags:
 *       - Tambah Investasi
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Jumlah Investasi
 *             properties:
 *               jumlah_investasi:
 *                 type: number
 *                 format: decimal
 *                 example: 5000.00
 *     responses:
 *       200:
 *         description: Investasi berhasil ditambahkan
 *       401:
 *         description: Tidak memiliki akses (Token salah atau tidak diberikan)
 *       500:
 *         description: Kesalahan server
 */

// end point untuk membuat form ADD investasi
app.post('/api/add-investasi', async (req, res) => {
  try {
      const token_investasi = req.headers['authorization'];
      if (!token_investasi) {
        return res.status(401).json({ message: 'Access denied, no token provided'});
      }

      const decoded_investasi = jwt.verify(token_investasi.split(' ')[1], process.env.JWT_SECRET)
      const {username} = decoded_investasi; 

      // Data dari request
      const { jumlah_investasi } = req.body;
      if (!jumlah_investasi || jumlah_investasi <= 0) {
          return res.status(400).json({ message: 'Invalid Investasi' });
      }

      // Ambil tanggal investasi dari data
      const investasiDate = new Date();
      const year = investasiDate.getFullYear();
      const month = investasiDate.getMonth() + 1;

      // Hitung urutan id transaksi investasi
      const [rows] = await db.query(
        'SELECT COUNT(*) AS count FROM transaksi_investasi WHERE YEAR(tanggal_investasi) = ? AND MONTH(tanggal_investasi) = ?', 
        [year, month]
      );
      const sequence = rows[0]?.count ? rows[0].count + 1 : 1;

      // Generate ID investasi
      const id_investasi = generateInvestasiID(year, month, sequence);
      console.log({ id_investasi, jumlah_investasi });

      await db.query('START TRANSACTION')

      const [userResult] = await db.query(
        'SELECT id_anggota, total_investasi from users WHERE username = ?',
        [username]
      );

      
      // disini diget dulu id_anggota, jumlah_investasi_lama
      if (userResult.length === 0){
        await db.query('ROLLBACK');
        return res.status(404).json({ message: 'User Not found' });
      }

      const idAnggota = userResult[0].id_anggota;
      const oldInvestasi = parseFloat(userResult[0].total_investasi) // total investasi diambil dari table user
      const amountInvestasi = parseFloat(jumlah_investasi); // jumlah investasi diambil dari tabel transaksi investasi
      const newAmountInvestasi = oldInvestasi + amountInvestasi;

      //  update nilai investasi 
      await db.query(
        'UPDATE users set total_investasi = ? where id_anggota = ?',
        [newAmountInvestasi.toFixed(2), idAnggota]
      );

      // Simpan ke tabel transaksi_investasi
      await db.query(
        'INSERT INTO transaksi_investasi (id_investasi, id_anggota, jumlah_investasi) VALUES ( ?, ?, ?)',
          [id_investasi, idAnggota, amountInvestasi.toFixed(2)]
        
      );

      await db.query('COMMIT');

      res.status(201).json({
        message: 'Investasi berhasil ditambahkan',
        id_investasi: id_investasi,
        jumlah_investasi: amountInvestasi,
        newAmountInvestasi: newAmountInvestasi,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan investasi' });
  }
});



// ===================== Ambil investasi =================================

/**
 * @swagger
 * /api/add-investasi:
 *   post:
 *     summary: Melakukan add - investasi
 *     description: Menambahkan investasi. Memerlukan autentikasi.
 *     tags:
 *       - Tambah Investasi
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Jumlah Investasi
 *             properties:
 *               jumlah_investasi:
 *                 type: number
 *                 format: decimal
 *                 example: 5000.00
 *     responses:
 *       200:
 *         description: Investasi berhasil ditambahkan
 *       401:
 *         description: Tidak memiliki akses (Token salah atau tidak diberikan)
 *       500:
 *         description: Kesalahan server
 */

// end point untuk membuat form ADD investasi
// buat fungsi untuk generate id ambil investasi 
app.post('/api/ambil-investasi', async (req, res) => {
  try {
      const token_ambil_investasi = req.headers['authorization'];
      if (!token_ambil_investasi) {
        return res.status(401).json({ message: 'Access denied, no token provided'});
      }

      const decoded_ambil_investasi = jwt.verify(token_ambil_investasi.split(' ')[1], process.env.JWT_SECRET)
      const {username} = decoded_ambil_investasi; 

      // Data dari request
      const { jumlah_investasi } = req.body;
      if (!jumlah_investasi || jumlah_investasi <= 0) {
          return res.status(400).json({ message: 'Invalid Investasi' });
      }

      // Ambil tanggal investasi dari data
      const investasiDate = new Date();
      const year = investasiDate.getFullYear();
      const month = investasiDate.getMonth() + 1;

      // Hitung urutan id transaksi investasi
      const [rows] = await db.query(
        'SELECT COUNT(*) AS count FROM transaksi_investasi WHERE YEAR(tanggal_investasi) = ? AND MONTH(tanggal_investasi) = ?', 
        [year, month]
      );
      const sequence = rows[0]?.count ? rows[0].count + 1 : 1;

      // Generate ID investasi
      const id_investasi = generateInvestasiID(year, month, sequence);
      console.log({ id_investasi, jumlah_investasi });

      await db.query('START TRANSACTION')

      const [userResult] = await db.query(
        'SELECT id_anggota, total_investasi from users WHERE username = ?',
        [username]
      );

      
      // disini diget dulu id_anggota, jumlah_investasi_lama
      if (userResult.length === 0){
        await db.query('ROLLBACK');
        return res.status(404).json({ message: 'User Not found' });
      }

      const idAnggota = userResult[0].id_anggota;
      const oldInvestasi = parseFloat(userResult[0].total_investasi) // total investasi diambil dari table user
      const amountInvestasi = parseFloat(jumlah_investasi); // jumlah investasi diambil dari tabel transaksi investasi
      const newAmountInvestasi = oldInvestasi + amountInvestasi;

      //  update nilai investasi 
      await db.query(
        'UPDATE users set total_investasi = ? where id_anggota = ?',
        [newAmountInvestasi.toFixed(2), idAnggota]
      );

      // Simpan ke tabel transaksi_investasi
      await db.query(
        'INSERT INTO transaksi_investasi (id_investasi, id_anggota, jumlah_investasi) VALUES ( ?, ?, ?)',
          [id_investasi, idAnggota, amountInvestasi.toFixed(2)]
        
      );

      await db.query('COMMIT');

      res.status(201).json({
        message: 'Investasi berhasil ditambahkan',
        id_investasi: id_investasi,
        jumlah_investasi: amountInvestasi,
        newAmountInvestasi: newAmountInvestasi,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan investasi' });
  }
});


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
    const [row_shu] = await db.query (`select users.username, tabungan_pokok.jumlah_setoran, tabungan_pokok.tanggal_setor FROM users INNER join tabungan_pokok on users.id_anggota = tabungan_pokok.id_anggota;`)
    res.json(row_shu);
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
    const [row_transaksi_topup] =  await db.query (`SELECT transaksi_topup.id_transaksi, transaksi_topup.created_at, transaksi_investasi.amount from transaksi_topup inner join users on users.id_anggota = transaksi_topup.id_anggota  where username = ?`,
      [username]);
    res.json(row_transaksi_topup);
  } catch (error){
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
})


//  ============================= POST TOPUP ===============================
/**
 * @swagger
 * /api/topup:
 *   post:
 *     summary: Melakukan TOPUP saldo untuk menambah Balance
 *     description: Menambahkan topup saldo. Memerlukan autentikasi.
 *     tags:
 *       - TOPUP Saldo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Amount
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 example: 5000.00
 *     responses:
 *       200:
 *         description: Saldo berhasil ditambahkan
 *       401:
 *         description: Tidak memiliki akses (Token salah atau tidak diberikan)
 *       500:
 *         description: Kesalahan server
 */
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
          'SELECT COUNT(*) AS count FROM transaksi_topup WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?',
          [year, month]
      );
      const sequence = rows[0]?.count ? rows[0].count + 1 : 1;
      const id_transaksi_topup = generateTransaksiIDTopup(year, month, sequence);

      await db.query('START TRANSACTION');

      const [userResult] = await db.query(
          // 'SELECT users.id_anggota, saldo.total_saldo FROM users INNER JOIN saldo ON users.id_anggota = saldo.id_anggota WHERE username = ?',
          'SELECT id_anggota, saldo from users WHERE username = ?',
          [username]);

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
          'INSERT INTO transaksi_topup (id_transaksi, id_anggota, amount) VALUES (?, ?, ?)',
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


/**
 * @swagger
 * /api/menabung:
 *   post:
 *     summary: Menambah Tabungan pribadi
 *     description: Menambahkan tabungan. Memerlukan autentikasi.
 *     tags:
 *       - Tambah Tabungan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Jumlah menabung
 *             properties:
 *               jumlah_menabung:
 *                 type: number
 *                 format: decimal
 *                 example: 5000.00
 *     responses:
 *       200:
 *         description: Tabungan berhasil ditambahkan
 *       401:
 *         description: Tidak memiliki akses (Token salah atau tidak diberikan)
 *       500:
 *         description: Kesalahan server
 */

//  post menabung
app.post('/api/menabung', async (req, res) => {
  try {
      const token = req.headers['authorization'];
      if (!token) {
          return res.status(401).json({ message: 'Access denied, no token provided' });
      }

      const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
      const { username } = decoded;

      const { jumlah_menabung } = req.body;
      if (!jumlah_menabung || jumlah_menabung <= 0) {
          return res.status(400).json({ message: 'Invalid add tabungan' });
      }

      const transaksiMenabung = new Date();
      const year = transaksiMenabung.getFullYear();
      const month = transaksiMenabung.getMonth() + 1;

      const [rows] = await db.query(
          'SELECT COUNT(*) AS count FROM transaksi_tabungan WHERE YEAR(tanggal_menabung) = ? AND MONTH(tanggal_menabung) = ?',
          [year, month]
      );
      const sequence = rows[0]?.count ? rows[0].count + 1 : 1;
      const id_transaksi_menabung = generateIDMenabung(year, month, sequence);

      await db.query('START TRANSACTION');

      const [userResult] = await db.query(
          'SELECT id_anggota, total_tabungan FROM users WHERE username = ?',
          [username]
      );

      if (userResult.length === 0) {
          await db.query('ROLLBACK');
          return res.status(404).json({ message: 'User not found' });
      }

      const idAnggota = userResult[0].id_anggota;
      const oldTabungan = parseFloat(userResult[0].total_tabungan); // Konversi ke angka
      const amountMenabung = parseFloat(jumlah_menabung); // Konversi ke angka
      const newTotalTabungan = oldTabungan + amountMenabung; // Penjumlahan angka

      await db.query(
          'UPDATE users SET total_tabungan = ? WHERE id_anggota = ?',
          [newTotalTabungan.toFixed(2), idAnggota] // Pastikan hanya menyimpan 2 desimal
      );

      await db.query(
          'INSERT INTO transaksi_tabungan (id_tabungan, id_anggota, jumlah_menabung) VALUES (?, ?, ?)',
          [id_transaksi_menabung, idAnggota, amountMenabung.toFixed(2)] // Simpan dengan format 2 desimal
      );

      await db.query('COMMIT');

      res.status(200).json({
          message: 'Top-up successful',
          oldTabungan: oldTabungan.toFixed(2),
          addMenabung: amountMenabung.toFixed(2),
          newTotalTabungan: newTotalTabungan.toFixed(2),
          id_transaksi_menabung: id_transaksi_menabung,
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