const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const cacheMiddleware = require('../middleware/cacheMiddleware');

// --- KONFIGURASI CACHE (Detik) ---
// Home: 30 menit (Cukup fresh)
// Search/Genre: 1 Jam
// Detail: 24 Jam (Film lama jarang berubah infonya)
// Download: 5 Menit (Link bisa expired/berubah)

router.get('/home', cacheMiddleware(1800), mainController.home);

router.get('/search', cacheMiddleware(3600), mainController.search);

// Endpoint untuk Genre, Negara, Tahun, Page
// Contoh: /api/archive?slug=genre/action
router.get('/archive', cacheMiddleware(3600), mainController.archive);

router.get('/detail', cacheMiddleware(86400), mainController.detail);

router.get('/download', cacheMiddleware(300), mainController.getDownloadRedirect);

module.exports = router;
