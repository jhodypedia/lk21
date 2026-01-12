const ScraperModel = require('../models/ScraperModel');
const adsConfig = require('../config/adsConfig');

// Standard Response Wrapper
const responseSuccess = (res, data, message = 'Success') => {
    res.json({
        status: 'success',
        message: message,
        // Inject Iklan ke Response
        ads: {
            enabled: adsConfig.enabled,
            banner: adsConfig.banner_code,
            social_bar: adsConfig.social_bar_script,
            smartlink: adsConfig.smartlink_url
        },
        data: data
    });
};

const responseError = (res, message, code = 500) => {
    res.status(code).json({
        status: 'error',
        message: message,
        ads: { enabled: adsConfig.enabled, smartlink: adsConfig.smartlink_url } // Tetap kirim smartlink jika error (opsional)
    });
};

exports.home = async (req, res) => {
    try {
        const data = await ScraperModel.getHome();
        responseSuccess(res, data, 'Homepage Data');
    } catch (error) {
        responseError(res, error.message);
    }
};

exports.search = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return responseError(res, 'Query parameter ?q= wajib diisi', 400);
        
        const path = `/search/?s=${query}`;
        const data = await ScraperModel.getArchive(path);
        responseSuccess(res, data, `Hasil pencarian: ${query}`);
    } catch (error) {
        responseError(res, error.message);
    }
};

exports.archive = async (req, res) => {
    try {
        // Menerima slug seperti: 'genre/action' atau 'year/2024'
        const slug = req.query.slug;
        if (!slug) return responseError(res, 'Slug parameter ?slug= wajib diisi', 400);

        const data = await ScraperModel.getArchive(`/${slug}`);
        responseSuccess(res, data, `Archive: ${slug}`);
    } catch (error) {
        responseError(res, error.message);
    }
};

exports.detail = async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return responseError(res, 'Url parameter ?url= wajib diisi', 400);

        const data = await ScraperModel.getDetail(url);
        responseSuccess(res, data, 'Detail Film');
    } catch (error) {
        responseError(res, error.message);
    }
};

// Khusus Handler Download Link
exports.getDownloadRedirect = async (req, res) => {
    try {
        const url = req.query.url; // URL Halaman Detail Film
        if (!url) return responseError(res, 'Url film wajib diisi', 400);

        const data = await ScraperModel.getDetail(url);

        if (data.download_page_link) {
            res.json({
                status: 'success',
                message: 'Silahkan redirect user ke URL ini',
                ads: {
                    smartlink: adsConfig.smartlink_url // Iklan Smartlink
                },
                // Link asli LK21 (dl.lk21...)
                // Frontend harus membuka ini di tab baru (window.open)
                redirect_url: data.download_page_link 
            });
        } else {
            responseError(res, 'Link download tidak ditemukan untuk film ini', 404);
        }
    } catch (error) {
        responseError(res, error.message);
    }
};
