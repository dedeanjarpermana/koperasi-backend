const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require ('../db')
const { generateIDMenabung } = require('../generate_id')

const router = express.Router(); // Pastikan ini ada


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
router.post('/', async (req, res) => {
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
          'INSERT INTO transaksi_tabungan (id_tabungan, id_anggota, jenis_transaksi , jumlah_menabung) VALUES (?, ?, ?, ?)',
          [id_transaksi_menabung, idAnggota, 'SIMPAN' ,amountMenabung.toFixed(2)] // Simpan dengan format 2 desimal
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

module.exports = router;
