# AniKita

Website katalog anime (data dari Jikan API / MyAnimeList). Tanpa build, tanpa dependensi.

## Struktur
- `index.html` : halaman utama
(CSS ada di dalam `index.html`)
- `js/app.js` : logika dan akses API
- `api/jikan/[...path].js` : proxy server (Vercel) ke Jikan, mengatasi "tidak bisa terhubung" karena blokir jaringan/CORS
- `data/config.json` : pengaturan (`api`, hari, genre, urutan). Ubah `api` untuk memakai proxy/API sendiri

## Menjalankan lokal
```
python -m http.server 8000
```
lalu buka http://localhost:8000

## Deploy
- Vercel: upload folder ini ke repo GitHub, lalu Add New > Project > Deploy.
- GitHub Pages: Settings > Pages > Branch main / root.

Buka lewat https (bukan file:// atau preview) supaya permintaan ke API tidak gagal.

## Kalau "tidak bisa terhubung ke Jikan"
Deploy ke Vercel dengan folder `api/` ikut terupload. Situs otomatis memakai proxy `/api/jikan`; kalau proxy tidak ada, ia mencoba langsung ke Jikan.
