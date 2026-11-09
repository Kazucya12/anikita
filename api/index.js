// api/index.js
import express from "express";
import axios from "axios";

// Impor modul scraper anime kamu (sesuaikan path foldernya di proyek)
import kuramanime from "../source/kuramanime/kuramanime.js";
import nanime from "../source/nanime/nanime.js";
import kuronime from "../source/kuronime/kuronime.js";
import otakudesu from "../source/otakudesu/otakudesu.js";

const app = express();

// Konfigurasi Axios agar tidak throw error pada status non-2xx
axios.defaults.validateStatus = () => true;

app.use(express.json());

// Root endpoint API
app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "Anikita API Scraper Ready 🚀",
        endpoints: ["/api/kuramanime", "/api/nanime", "/api/kuronime", "/api/otakudesu"]
    });
});

// Routing Scraper Anime
app.use("/kuramanime", kuramanime);
app.use("/nanime", nanime);
app.use("/kuronime", kuronime);
app.use("/otakudesu", otakudesu);

// Ekspor app agar bisa dibaca Vercel Serverless
export default app;
