const bcrypt = require('bcryptjs');

const password = '12345'; // Password plain-text yang akan di-hash
bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Hashed Password:', hash);
});
