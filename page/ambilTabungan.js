const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require ('../db')
const { generateTransaksiAmbilTabungan } = require('../generate_id')

const router = express.Router(); // Pastikan ini ada

// belum beres
// ===================== Ambil investasi =================================
// untuk endpoint kalo di file ini hanya (/) untuk /api/ambil-investasi diambil dari file server.js app.use('/api/ambil-investasi', ambilInvestasi)
/**
 * @swagger
 * /api/ambil-tabungan:
 *   post:
 *     summary: Ambil Tabungan
 *     description: Mengurangi jumlah total tabungan user dengan jumlah yang diambil. Memerlukan autentikasi.
 *     tags:
 *       - Ambil  Tabungan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jumlah_ambil
 *             properties:
 *               jumlah_ambil:
 *                 type: number
 *                 format: float
 *                 example: 500000.00
 *     responses:
 *       201:
 *         description: Tabungan berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Withdrawal successful
 *                 id_transaksi:
 *                   type: string
 *                   example: IDAMBIL-202412-001
 *                 jumlah_ambil:
 *                   type: number
 *                   format: float
 *                   example: 500000.00
 *                 sisa_investasi:
 *                   type: number
 *                   format: float
 *                   example: 1500000.00
 *       400:
 *         description: Permintaan tidak valid atau saldo tabungan tidak mencukupi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Insufficient investment balance
 *       401:
 *         description: Tidak memiliki akses (token tidak diberikan atau tidak valid).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Access denied, no token provided
 *       404:
 *         description: User tidak ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Kesalahan server saat memproses permintaan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error processing withdrawal
 */
// end point untuk membuat form ADD investasi
// buat fungsi untuk generate id ambil investasi 
router.post('/', async (req, res) => {
    try {
        const token_ambil_tabungan = req.headers['authorization'];
        if (!token_ambil_tabungan) {
          return res.status(401).json({ message: 'Access denied, no token provided'});
        }
  
        const decoded_ambil_tabungan = jwt.verify(token_ambil_tabungan.split(' ')[1], process.env.JWT_SECRET)
        const {username} = decoded_ambil_tabungan; 
  
        // Data dari request
        const { jumlah_ambil } = req.body;
        if (!jumlah_ambil || jumlah_ambil <= 0) {
            return res.status(400).json({ message: 'Invalid withdrawal amount' });
        }
  
        // Ambil tanggal tabungan dari data
        const investasiDate = new Date();
        const year = investasiDate.getFullYear();
        const month = investasiDate.getMonth() + 1;
  
        // Hitung urutan id transaksi investasi
        const [rows] = await db.query(
          'SELECT COUNT(*) AS count FROM transaksi_tabungan WHERE YEAR(tanggal_menabung) = ? AND MONTH(tanggal_menabung) = ?', 
          [year, month]
        );
        const sequence = rows[0]?.count ? rows[0].count + 1 : 1;
  
        // Generate ID investasi
        const id_tabungan = generateTransaksiAmbilTabungan(year, month, sequence);
        // console.log({ id_investasi, jumlah_investasi });
  
        await db.query('START TRANSACTION')
  
        const [userResult] = await db.query(
          'SELECT id_anggota, total_tabungan from users WHERE username = ?',
          [username]
        );
  
        
        // disini diget dulu id_anggota, jumlah_investasi_lama
        if (userResult.length === 0){
          await db.query('ROLLBACK');
          return res.status(404).json({ message: 'User Not found' });
        }
  
        const idAnggota = userResult[0].id_anggota;
        const currentTabungan = parseFloat(userResult[0].total_tabungan) // total tabungan diambil dari table user
        const ambilTabungan = parseFloat(jumlah_ambil); // jumlah  ambil diambil dari req body 

        
        if (ambilTabungan > currentTabungan) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient saving balance' });
        }

        const newAmountTabungan = currentTabungan - ambilTabungan;
  
        //  update nilai investasi 
        await db.query(
          'UPDATE users set total_tabungan = ? where id_anggota = ?',
          [newAmountTabungan.toFixed(2), idAnggota]
        );
  
        // Simpan ke tabel transaksi_tabungan
        await db.query(
          'INSERT INTO transaksi_tabungan (id_tabungan, id_anggota, jenis_transaksi, jumlah_menabung) VALUES ( ?, ?, ?, ?)',
            [id_tabungan, idAnggota, 'AMBIL' , ambilTabungan.toFixed(2)]
          
        );
  
        await db.query('COMMIT');
  
        res.status(201).json({
          message: 'Tabungan berhasil diambil',
          id_tabungan: id_tabungan,
          jumlah_tabungan_diambil: ambilTabungan,
          newAmountTabungan: newAmountTabungan,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan investasi' });
    }
  });
  
  
  module.exports = router;