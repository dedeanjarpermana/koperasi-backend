const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router(); // Pastikan ini ada

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: "Masukkan token Bearer JWT yang didapatkan setelah login"
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login jika sudah punya akun, jika belum punya lakukan registrasi terlebih dahulu
 *     description: Endpoint untuk autentikasi pengguna menggunakan username dan password.
 *     tags:
 *       - Module Keanggotaan - Diakses oleh anggota
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "dede_anjar_permana"
 *               password:
 *                 type: string
 *                 example: "mypassword123"
 *     responses:
 *       200:
 *         description: Login berhasil dan mengembalikan token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Username atau password tidak diisi
 *       401:
 *         description: Kredensial tidak valid
 *       500:
 *         description: Kesalahan server
 */

// Endpoint Login
router.post('/login', async (req, res) => {
    try {
        console.log('Step 1: Request body received:', req.body.username);

        const { username, password } = req.body;

        // Validasi input
        if (!username || !password) {
            console.log('Step 2: Missing username or password');
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Query database menggunakan async/await
        console.log('Step 3: Querying database...');
        const [results] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

        if (results.length === 0) {
            console.log('Step 4: User not found');
            return res.status(404).json({ message: 'Invalid credentials' });
        }

        const user = results[0];
        console.log('Step 5: User found:', user);

        // Verifikasi password
        console.log('Step 6: Verifying password...');
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log('Step 7: Password mismatch');
            logger.warn(`Failed login attempt for user: ${user.username}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }


        // Buat token JWT
        console.log('Step 8: Generating token...');
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        console.log('Step 9: Login successful, sending response');
        res.json({ token });

    } catch (error) {
        console.error('Unexpected error:', error.message);
        res.status(500).json({ message: 'Unexpected error occurred', error: error.message });
    }
});

// module.exports = router; // Pastikan ini ada

// Login Endpoint
// router.post('/login', async (req, res) => {
//     const { username, password } = req.body;
//     const user = users.find(user => user.username === username);

//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

//     const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
//         expiresIn: process.env.JWT_EXPIRES_IN,
//     });

//     res.json({ token });
// });

// // Protected Route
// router.get('/protected', (req, res) => {
//     const token = req.headers['authorization'];
//     if (!token) return res.status(401).json({ message: 'Access denied' });

//     try {
//         const verified = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
//         res.json({ message: 'Protected data', user: verified });
//     } catch (err) {
//         res.status(400).json({ message: 'Invalid token' });
//     }
// });

module.exports = router;
