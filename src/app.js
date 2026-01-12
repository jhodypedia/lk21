const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS agar bisa diakses dari Frontend (React/Vue/HTML)
app.use(cors());
app.use(express.json());

// Load Routes
app.use('/api', apiRoutes);

// Root Endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'LK21 API Scraper (With Ads & Cache) Ready!',
        documentation: {
            home: '/api/home',
            search: '/api/search?q=keyword',
            genre: '/api/archive?slug=genre/action',
            detail: '/api/detail?url=https://tv7.lk21official.cc/judul-film',
            download: '/api/download?url=https://tv7.lk21official.cc/judul-film'
        }
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
