const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require ('../db')
const { generateAnggotaID } = require('../generate_id')

const router = express.Router(); // Pastikan ini ada


/**
 * @swagger
 * /api/register:
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

router.post('/', async (req, res) => {
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
  

  module.exports = router;