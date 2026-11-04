# AniKita

Website katalog anime (data dari Jikan API / MyAnimeList). Tanpa build, tanpa dependensi.

## Struktur
- `index.html` : halaman utama
(CSS ada di dalam `index.html`)
- `js/app.js` : logika dan akses API
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
