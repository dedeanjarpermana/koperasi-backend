// const mysql = require('mysql2');
const dotenv = require('dotenv');
// const mysql = require("mysql2/promise"); // Gunakan versi promise
dotenv.config();

// Membuat koneksi database
// const db = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME,
// });

// // Menghandle koneksi dan error
// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err.message);
//         process.exit(1); // Keluar dengan kode error jika koneksi gagal
//     }
//     console.log('Connected to the MySQL database');
// });

const mysql = require("mysql2/promise"); // Gunakan versi promise

// Buat koneksi pool
const db = mysql.createPool({
  host: "localhost",      // Ganti dengan host database Anda
  user: "root",           // Ganti dengan username database Anda
  password: "!DedeAnjar1986",           // Ganti dengan password database Anda
  database: "koperasi", // Ganti dengan nama database Anda
});

module.exports = db;


