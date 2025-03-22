const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']; // Token dari Authorization header
    if (!token) {
        return res.status(401).json({ message: 'Access denied, no token provided' });
    }

    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.user = decoded; // Tambahkan data user ke request
        next();
    } catch (err) {
        return res.status(400).json({ message: 'Invalid token' });
    }
};

module.exports = authenticateToken;
