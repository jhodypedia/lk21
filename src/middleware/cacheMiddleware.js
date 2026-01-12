const cache = require('../utils/appCache');

// Duration dalam detik
const cacheMiddleware = (duration) => (req, res, next) => {
    // Jika request method bukan GET, jangan di-cache
    if (req.method !== 'GET') {
        return next();
    }

    // Key cache berdasarkan URL request (misal: /api/home)
    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        // [HIT] Data ada di memori, kirim langsung (Cepat!)
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedResponse);
    } else {
        // [MISS] Data tidak ada, proses request
        res.setHeader('X-Cache', 'MISS');
        
        // Intercept res.json untuk menyimpan data sebelum dikirim ke user
        const originalSend = res.json;
        res.json = (body) => {
            // Hanya cache jika status sukses
            if (res.statusCode === 200 && body.status === 'success') {
                cache.set(key, body, duration);
            }
            originalSend.call(res, body);
        };
        next();
    }
};

module.exports = cacheMiddleware;
