const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require ('../db')
const { generateTransaksiIDTopup } = require('../generate_id')

const router = express.Router(); // Pastikan ini ada


//  ============================= POST TOPUP ===============================

// untuk endpoint kalo di file ini hanya (/) untuk /api/topupnya diambil dari file server.js app.use('/api/topup', topup)
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
router.post('/', async (req, res) => {
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
            'INSERT INTO transaksi_topup (id_transaksi, id_anggota, , jenis_transaksi, amount) VALUES (?, ?, ?, ?)',
            [id_transaksi_topup, idAnggota, 'TOPUP', amountNum.toFixed(2)] // Simpan dengan format 2 desimal
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

  module.exports = router;