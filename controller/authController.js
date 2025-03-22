const bcrypt = require('bcrypt');
const db = require('../database/db');

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Ambil data user berdasarkan username
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Username tidak ditemukan' });
        }

        const user = rows[0];

        // Validasi password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Password salah' });
        }

        // Jika valid, lanjutkan dengan mengirimkan respons sukses
        res.status(200).json({ message: 'Login berhasil', user: { id: user.id_anggota, username: user.username } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat login' });
    }
};

module.exports = { loginUser };
