const express = require("express");
const axios = require("axios");

// Menggunakan require sesuai format asli file scraper kamu
const kuramanime = require("../source/kuramanime/kuramanime");
const nanime = require("../source/nanime/nanime");
const kuronime = require("../source/kuronime/kuronime");
const otakudesu = require("../source/otakudesu/otakudesu");

const app = express();

// Konfigurasi Axios
axios.defaults.validateStatus = () => true;
app.use(express.json());

// Endpoint Cek Status API
app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "Anikita API Scraper Ready 🚀"
    });
});

// Daftarkan router dengan dukungan ganda (dengan atau tanpa awalan /api)
// agar tidak terjadi error 404 / gagal muat di Vercel
const animeRoutes = [
    { path: "/kuramanime", router: kuramanime },
    { path: "/nanime", router: nanime },
    { path: "/kuronime", router: kuronime },
    { path: "/otakudesu", router: otakudesu }
];

animeRoutes.forEach(({ path, router }) => {
    app.use(path, router);
    app.use(`/api${path}`, router);
});

// Wajib ekspor menggunakan module.exports untuk CommonJS di Vercel
module.exports = app;
