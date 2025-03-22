const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require ('../db')
const { generateInvestasiID } = require('../generate_id')

const router = express.Router(); // Pastikan ini ada
/**
 * @swagger
 * /api/investasi/withdraw:
 *   post:
 *     summary: Ambil investasi
 *     description: Mengurangi jumlah total investasi user dengan jumlah yang diambil. Memerlukan autentikasi.
 *     tags:
 *       - Investasi
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



// Endpoint untuk mengambil investasi
router.post('/', async (req, res) => {
    try {
        const token_investasi = req.headers['authorization'];
        if (!token_investasi) {
            return res.status(401).json({ message: 'Access denied, no token provided' });
        }

        const decoded_investasi = jwt.verify(token_investasi.split(' ')[1], process.env.JWT_SECRET);
        const { username } = decoded_investasi;

        const { jumlah_ambil } = req.body;
        if (!jumlah_ambil || jumlah_ambil <= 0) {
            return res.status(400).json({ message: 'Invalid withdrawal amount' });
        }

        await db.query('START TRANSACTION');

        // Ambil data user dan total investasi saat ini
        const [userResult] = await db.query(
            'SELECT id_anggota, total_investasi FROM users WHERE username = ?',
            [username]
        );

        if (userResult.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'User not found' });
        }

        const idAnggota = userResult[0].id_anggota;
        const currentInvestasi = parseFloat(userResult[0].total_investasi);
        const amountWithdraw = parseFloat(jumlah_ambil);

        if (amountWithdraw > currentInvestasi) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient investment balance' });
        }

        const newInvestasi = currentInvestasi - amountWithdraw;

        // Update total investasi di tabel `users`
        await db.query(
            'UPDATE users SET total_investasi = ? WHERE id_anggota = ?',
            [newInvestasi.toFixed(2), idAnggota]
        );

        // Simpan transaksi ke tabel `transaksi_investasi`
        const idTransaksi = generateInvestasiID(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getTime());
        await db.query(
            'INSERT INTO transaksi_investasi (id_transaksi, id_anggota, jenis_transaksi, jumlah_investasi) VALUES (?, ?, ?, ?)',
            [idTransaksi, idAnggota, 'WITHDRAW', amountWithdraw.toFixed(2)]
        );

        await db.query('COMMIT');

        res.status(201).json({
            message: 'Withdrawal successful',
            id_transaksi: idTransaksi,
            jumlah_ambil: amountWithdraw,
            sisa_investasi: newInvestasi,
        });
    } catch (error) {
        console.error(error);
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Error processing withdrawal' });
    }
});

module.exports = router;
