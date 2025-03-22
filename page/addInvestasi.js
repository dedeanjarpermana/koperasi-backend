const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require ('../db')
const { generateInvestasiID } = require('../generate_id')

const router = express.Router(); // Pastikan ini ada

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
router.post('/', async (req, res) => {
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
          'INSERT INTO transaksi_investasi (id_investasi, id_anggota, jenis_transaksi, jumlah_investasi) VALUES ( ?, ?, ?, ?)',
            [id_investasi, idAnggota, 'ADD', amountInvestasi.toFixed(2)]
          
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


  module.exports = router;