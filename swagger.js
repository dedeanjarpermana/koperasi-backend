// http://localhost:5000/api-docs/

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Konfigurasi Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Koperasi API',
            version: '1.0.0',
            description: 'API Dokumentasi untuk aplikasi koperasi',
        },
        servers: [
            {
                url: 'http://localhost:5000', // Ganti dengan URL server Anda
            },
        ],
    },
    apis: ['./page/register.js', './routes/auth.js', './server.js', './page/addTabungan.js', './page/ambilTabungan.js','./page/addInvestasi.js', './page/ambilInvestasi.js','./page/topup.js', './page/pembelian.js'], // Pastikan path benar
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
