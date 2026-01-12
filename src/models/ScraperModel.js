const axios = require('axios');
const cheerio = require('cheerio');
const { HEADERS, BASE_URL } = require('../config/constants');

class ScraperModel {
    
    // Helper Fetcher
    static async fetchHtml(url) {
        try {
            // Encode URL untuk menangani spasi atau karakter khusus
            const targetUrl = encodeURI(url);
            const response = await axios.get(targetUrl, { headers: HEADERS, timeout: 15000 });
            return cheerio.load(response.data);
        } catch (error) {
            console.error(`[Scraper Error] ${url}: ${error.message}`);
            // Jika 404 atau error lain, return null
            return null;
        }
    }

    // Helper Parser Kartu Film
    static parseCard($, element) {
        const title = $(element).find('.poster-title, h3').text().trim();
        let link = $(element).find('a').attr('href');
        
        // Normalisasi Link (Tambahkan domain jika relative)
        if (link && !link.startsWith('http')) link = `${BASE_URL}${link}`;

        return {
            title,
            rating: $(element).find('.rating').text().trim() || 'N/A',
            quality: $(element).find('.label').text().trim() || 'HD',
            duration: $(element).find('.duration').text().trim() || '-',
            episode: $(element).find('.episode').text().trim() || null,
            poster: $(element).find('img').attr('src'),
            link_detail: link
        };
    }

    // 1. Ambil Home Data
    static async getHome() {
        const $ = await this.fetchHtml(BASE_URL);
        if (!$) throw new Error("Gagal mengambil data Home");

        const result = { featured: [], latest_movies: [], latest_series: [] };

        // Featured Slider
        $('#featured-slider .slider article').each((i, el) => {
            result.featured.push(this.parseCard($, el));
        });

        // Widget Terbaru
        $('.widget[data-type="latest-movies"] .slider article').each((i, el) => {
            result.latest_movies.push(this.parseCard($, el));
        });

        // Widget Series
        $('.widget[data-type="latest-series"] .slider article').each((i, el) => {
            result.latest_series.push(this.parseCard($, el));
        });

        return result;
    }

    // 2. Ambil Search & Genre (Archive)
    static async getArchive(path) {
        let url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
        const $ = await this.fetchHtml(url);
        if (!$) return { results: [], has_next: false };

        const results = [];
        // Selector umum LK21 untuk hasil search/genre
        $('.search-item article, .gallery-grid article, .main-content article').each((i, el) => {
            const data = this.parseCard($, el);
            if (data.title) results.push(data);
        });

        // Cek Pagination
        const nextPage = $('.pagination .next').attr('href');
        let nextLink = null;
        if (nextPage) {
            nextLink = nextPage.startsWith('http') ? nextPage : `${BASE_URL}${nextPage}`;
        }

        return {
            results,
            has_next: !!nextLink,
            next_page_url: nextLink
        };
    }

    // 3. Ambil Detail Film/Series
    static async getDetail(url) {
        const $ = await this.fetchHtml(url);
        if (!$) throw new Error("Gagal mengambil detail film");

        // Usahakan ambil metadata dari JSON script (lebih rapi)
        let meta = {};
        try {
            const scriptJson = $('#watch-history-data').html() || $('#season-data').html();
            // Cek sederhana agar tidak mengambil JSON season yang kompleks
            if (scriptJson && !scriptJson.includes('"1":[')) {
                meta = JSON.parse(scriptJson);
            }
        } catch (e) {}

        const title = $('h1').text().trim();
        const synopsis = $('.synopsis').text().trim();
        const poster = $('.movie-info picture img').attr('src');
        
        // Ambil data Episode jika ada (Series)
        let episodes = [];
        try {
            const seasonScript = $('#season-data').html();
            if (seasonScript) {
                const seasonJson = JSON.parse(seasonScript);
                // Flatten object season menjadi array episode
                Object.keys(seasonJson).forEach(seasonKey => {
                    episodes = episodes.concat(seasonJson[seasonKey]);
                });
            }
        } catch (e) {}

        // --- PENTING: Link Download ---
        // Kita hanya mengambil URL tombol yang mengarah ke halaman download (biasanya dl.lk21...)
        // Kita TIDAK membukanya di backend. Frontend yang akan membukanya.
        const downloadRedirect = $('.movie-action a[href*="dl.lk21"]').attr('href');

        // Stream URL
        const streamUrl = $('#main-player').attr('src');

        return {
            title: meta.title || title,
            original_title: meta.original_title || title,
            year: meta.year || $('.year').text().trim(),
            poster: meta.poster || poster,
            rating: meta.rating || $('.rating').text().trim(),
            synopsis: synopsis,
            stream_url: streamUrl,
            download_page_link: downloadRedirect || null, // Link ini dikirim ke frontend
            episodes: episodes.length > 0 ? episodes : null
        };
    }
}

module.exports = ScraperModel;
