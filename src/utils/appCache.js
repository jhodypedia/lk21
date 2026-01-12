const NodeCache = require('node-cache');

// stdTTL: Default waktu simpan 1 jam (3600 detik)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

module.exports = cache;
