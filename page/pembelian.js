const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require ('../db')
const { generateTransaksiPembelian } = require('../generate_id')

const router = express.Router(); // Pastikan ini ada


//  ============================= POST PEMBELIAN ===============================

// untuk endpoint kalo di file ini hanya (/) untuk /api/topupnya diambil dari file server.js app.use('/api/topup', topup)
/**
 * @swagger
 * /api/pembelian:
 *   post:
 *     summary: Melakukan pembelian dan akan mengurangi saldo atau Balance
 *     description: Pembelian mengurangi saldo. Memerlukan autentikasi.
 *     tags:
 *       - PEMBELIAN
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - servide code
 *             properties:
 *               service_code:
 *                 type: string
 *                 example: PLN50
 *     responses:
 *       200:
 *         description: Pembelian berhasil dilakukam
 *       401:
 *         description: Tidak memiliki akses (Token salah atau tidak diberikan)
 *       500:
 *         description: Kesalahan server
 */
// endpoint untuk topup saldo
router.post('/', async (req, res) => {
    try {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(401).json({ message: 'Access denied, no token provided' });
        }
  
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        const { username } = decoded;
  
        const { service_code } = req.body;
        // pengecekan service code terlebih dahulu apakah ada atau tidak

        const [service] = await db.query(
        'select service_code, service_price from services where service_code = ?',
        [service_code]
    )
        if (!service) {
            return res.status(400).json({ message: 'Invalid service code' });
        }
  
        const transaksiTopupDate = new Date();
        const year = transaksiTopupDate.getFullYear();
        const month = transaksiTopupDate.getMonth() + 1;
  
        const [rows] = await db.query(
            'SELECT COUNT(*) AS count FROM transaksi_topup WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?',
            [year, month]
        );

        const sequence = rows[0]?.count ? rows[0].count + 1 : 1;
        const id_transaksi_pembelian = generateTransaksiPembelian(year, month, sequence);
  
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
        const servicePrice = parseFloat(service[0].service_price); // Konversi ke angka
        const newBalance = oldBalance - servicePrice; // Penjumlahan angka
  
        await db.query(
            'UPDATE users SET saldo = ? WHERE id_anggota = ?',
            [newBalance.toFixed(2), idAnggota] // Pastikan hanya menyimpan 2 desimal
        );
  
        await db.query(
            'INSERT INTO transaksi_topup (id_transaksi, id_anggota, jenis_transaksi, amount) VALUES (?, ?, ?, ?)',
            [id_transaksi_pembelian, idAnggota, 'BELI', servicePrice.toFixed(2)] // Simpan dengan format 2 desimal
        );
  
        await db.query('COMMIT');
  
        res.status(200).json({
            message: 'Pembelian  successful',
            oldBalance: oldBalance.toFixed(2),
            pembelian: servicePrice.toFixed(2),
            newBalance: newBalance.toFixed(2),
            id_transaksi_pembelian: id_transaksi_pembelian,
            service_code: service_code
        });
    } catch (error) {
        console.error(error);
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Internal server error' });
    }
  });

  module.exports = router;