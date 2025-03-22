const express = require("express");
const db = require("./db"); // Impor file koneksi database
const cors = require("cors"); // Import middleware CORS
const bcrypt = require('bcrypt'); // Import bcrypt
const authenticateToken = require('./controller/authenticaticateToken')
const jwt = require('jsonwebtoken');


const corsOptions = {
  origin: '*', // Mengizinkan semua origin. Ubah sesuai kebutuhan.
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Metode HTTP yang diizinkan
  allowedHeaders: ['Content-Type', 'Authorization'], // Header yang diizinkan
};

app.use(cors(corsOptions));
app.get('/', (req, res) => {
  res.send('CORS Configuration Successful');
});

app.use(express.json()); // Middleware untuk parsing JSON



app.post('/users', async (req, res) => {
    try {
        
        // Data dari request
        const { nama, email, password } = req.body;
        if (!nama || !email || !password ) {
            return res.status(400).json({ message: 'Data kurang lengkap, lengkapi data anda,' });
        }
  
  
        // Simpan ke tabel transaksi_investasi
        await db.query(
          'INSERT INTO users (id, nama, email, password) VALUES ( ?, ?, ?)',
            [id, nama, email, password]          
        );

        res.status(201).json({
          message: 'user berhasil ditambahkan',
          nama: nama,
          email: email,
          password: password,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan user baru' });
    }
  });


  app.PUT('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {nama_baru, email_baru, password_baru} = req.body
        

        const [result] = await db.query("UPDATE users SET nama = nama_baru, email = email_baru, password = password_baru WHERE id = ?", [id]);
        
    
        res.status(201).json({
          message: 'user berhasil update data',
          nama: nama_baru,
          email: email_baru,
          password: password_baru,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat update  data' });
    }
  });

  app.delete("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "user tidak ditemukan" });
      }
  
      res.json({ message: "user berhasil dihapus!" });
    } catch (error) {
      console.error("❌ Gagal menghapus soal:", error);
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  });


app.get("/users/:id", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT id, nama, email, password from users where id = ?`, [id]);
    
    res.json(rows); // kirim semua data
  } catch (error) {
    console.error("Database query failed:", error.message); // Log error
    res.status(500).json({ error: error.message });
  }
});


app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});