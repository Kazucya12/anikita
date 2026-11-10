# Kumori Lite

Kumori Lite adalah situs katalog anime dan manga ringan berbasis HTML/JavaScript yang dapat di-deploy ke Vercel.

## Deploy ke Vercel
1. Extract ZIP ini.
2. Upload seluruh isi folder `anikita-main` ke repository GitHub.
3. Hubungkan repository ke Vercel dengan Framework Preset `Other`.
4. Biarkan Build Command kosong dan deploy.
5. Pastikan folder `api/` ikut ter-upload. Vercel akan menjalankan `api/sanka.js`, `api/md.js`, dan `api/yt.js` sebagai serverless functions. Proxy MangaDex wajib berada di `api/md.js` (bukan hanya `data/md.js`), karena frontend memanggil `/api/md`.

## Streaming Otakudesu melalui Sanka
- Pemutar pada halaman anime AniList mencoba mencari judul dan episode di namespace Otakudesu pada Sanka API.
- Halaman detail Otakudesu (bila detail lokal tersedia) mengarahkan pilihan episode ke pemutar internal Sanka.
- Sanka dipanggil melalui `/api/sanka` sebagai proxy agar browser tidak melakukan request lintas domain secara langsung.
- Endpoint Sanka yang dipakai: `/anime/search/:judul`, `/anime/anime/:animeId`, `/anime/episode/:episodeId`, `/anime/server/:serverId`.
- Jika Sanka mewajibkan API key, isi Environment Variable `SANKA_APIKEY` di Vercel (tidak perlu mengubah kode).
- Jika Sanka mengubah endpoint atau bentuk respons, adapter di `index.html` dan proxy `api/sanka.js` perlu disesuaikan.
- URL video eksternal hanya dapat diputar jika server sumber mengizinkan embed/CORS dan URL masih aktif. Sebagian server mungkin memerlukan iframe atau mungkin menolak pemutaran.

## YouTube resmi (fallback)
Fitur pencarian video YouTube membutuhkan `YOUTUBE_API_KEY` di Vercel Environment Variables. Tanpa key, fallback YouTube tidak akan berfungsi; streaming Sanka tetap dicoba lebih dahulu.

## Manga
Tab Manga memakai MangaDex melalui proxy `api/md.js`. Jika daftar Manga masih kosong setelah deploy, buka `/api/md?p=%2Fmanga%3Flimit%3D1%26includes%255B%255D%3Dcover_art` untuk memeriksa apakah proxy mengembalikan JSON dari MangaDex; error 429 berarti rate limit sementara dari MangaDex.

## Catatan
Sanka dan Otakudesu adalah layanan pihak ketiga. Ketersediaan endpoint, server, dan hak distribusi konten berada di bawah ketentuan penyedia masing-masing. Uji pemutaran setelah deploy; respons API dan server video pihak ketiga dapat berubah.
