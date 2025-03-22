const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require ('../db')
const { generateTransaksiAmbilInvestasi } = require('../generate_id')

const router = express.Router(); // Pastikan ini ada

// belum beres
// ===================== Ambil investasi =================================
// untuk endpoint kalo di file ini hanya (/) untuk /api/ambil-investasi diambil dari file server.js app.use('/api/ambil-investasi', ambilInvestasi)
/**
 * @swagger
 * /api/ambil-investasi:
 *   post:
 *     summary: Ambil investasi
 *     description: Mengurangi jumlah total investasi user dengan jumlah yang diambil. Memerlukan autentikasi.
 *     tags:
 *       - Ambil  Investasi
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
 *         description: Investasi berhasil diambil.
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
 *                   example: INV-202412-001
 *                 jumlah_ambil:
 *                   type: number
 *                   format: float
 *                   example: 500000.00
 *                 sisa_investasi:
 *                   type: number
 *                   format: float
 *                   example: 1500000.00
 *       400:
 *         description: Permintaan tidak valid atau saldo investasi tidak mencukupi.
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
        const token_ambil_investasi = req.headers['authorization'];
        if (!token_ambil_investasi) {
          return res.status(401).json({ message: 'Access denied, no token provided'});
        }
  
        const decoded_ambil_investasi = jwt.verify(token_ambil_investasi.split(' ')[1], process.env.JWT_SECRET)
        const {username} = decoded_ambil_investasi; 
  
        // Data dari request
        const { jumlah_ambil } = req.body;
        if (!jumlah_ambil || jumlah_ambil <= 0) {
            return res.status(400).json({ message: 'Invalid withdrawal amount' });
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
        const id_investasi = generateTransaksiAmbilInvestasi(year, month, sequence);
        // console.log({ id_investasi, jumlah_investasi });
  
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
        const currentInvestasi = parseFloat(userResult[0].total_investasi) // total investasi diambil dari table user
        const ambilInvestasi = parseFloat(jumlah_ambil); // jumlah investasi diambil dari tabel transaksi investasi

        
        if (ambilInvestasi > currentInvestasi) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient investment balance' });
        }

        const newAmountInvestasi = currentInvestasi - ambilInvestasi;
  
        //  update nilai investasi 
        await db.query(
          'UPDATE users set total_investasi = ? where id_anggota = ?',
          [newAmountInvestasi.toFixed(2), idAnggota]
        );
  
        // Simpan ke tabel transaksi_investasi
        await db.query(
          'INSERT INTO transaksi_investasi (id_investasi, id_anggota, jenis_transaksi, jumlah_investasi) VALUES ( ?, ?, ?, ?)',
            [id_investasi, idAnggota, 'WITHDRAW' ,ambilInvestasi.toFixed(2)]
          
        );
  
        await db.query('COMMIT');
  
        res.status(201).json({
          message: 'Investasi berhasil diambil',
          id_investasi: id_investasi,
          jumlah_investasi_diambil: ambilInvestasi,
          newAmountInvestasi: newAmountInvestasi,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan investasi' });
    }
  });
  
  
  module.exports = router;