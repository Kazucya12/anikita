# Kumori

Kumori adalah situs katalog anime dan manga ringan berbasis HTML/JavaScript yang dapat di-deploy ke Vercel.

## Unduh APK (Android)
APK dibuat otomatis oleh GitHub Actions setiap kali kamu push ke branch `main` (file `.github/workflows/build-apk.yml`).
1. Upload seluruh isi folder ini ke repository GitHub (termasuk folder `.github/` dan `android-wrapper/`).
2. Buka tab **Actions** dan tunggu workflow **Build APK** selesai (sekitar 5–8 menit). Bisa juga dijalankan manual lewat **Run workflow**.
3. Buka tab **Releases** di repository lalu unduh **kumori.apk**. Tautan tetap untuk rilis terbaru: `https://github.com/USERNAME/NAMA-REPO/releases/latest/download/kumori.apk`
4. Di HP, buka file APK dan izinkan pemasangan dari sumber ini.

Catatan:
- APK membungkus situs `https://anikita.vercel.app` (ubah di `android-wrapper/capacitor.config.json` bila domainnya berbeda), jadi pembaruan situs langsung tampil tanpa pasang ulang APK. Butuh internet.
- APK ditandatangani dengan `android-wrapper/kumori.keystore` yang sama di setiap build, sehingga versi baru bisa langsung menimpa yang lama. Keystore ini untuk pemasangan manual (sideload), bukan untuk Play Store; simpan keystore sendiri bila suatu saat ingin merilis ke Play Store.

## Fitur pemutar
- Peringkat server: server yang paling sering berhasil dicoba lebih dulu (Pengaturan → Reset peringkat server untuk mengulang).
- Prefetch: saat tontonan mencapai ±80%, server episode berikutnya dimuat lebih dulu.
- Kualitas HLS (Auto/360p/720p/...), kecepatan putar, Picture-in-Picture, tombol ±10 detik dan Lewati intro (+85 detik).
- Ketuk dua kali di sisi kiri/kanan video untuk mundur/maju 10 detik; ketuk sekali untuk putar/jeda. Papan ketik: ← → (±10 dtk), spasi, F (layar penuh), P (PiP).
- Animasi splash saat dibuka, transisi halaman maju/mundur, dan kartu muncul bertahap. Animasi otomatis diredam bila perangkat mengaktifkan "kurangi gerakan".

## Deploy ke Vercel
1. Extract ZIP ini.
2. Upload seluruh isi folder `anikita-main` ke repository GitHub.
3. Hubungkan repository ke Vercel dengan Framework Preset `Other`.
4. Biarkan Build Command kosong dan deploy.
5. Pastikan folder `api/` ikut ter-upload. Vercel akan menjalankan `api/sanka.js`, `api/md.js`, dan `api/yt.js` sebagai serverless functions. Proxy MangaDex wajib berada di `api/md.js` (bukan hanya `data/md.js`), karena frontend memanggil `/api/md`.

## Streaming Samehadaku melalui Sanka
- Pemutar pada halaman anime AniList mencari judul (Romaji, English, synonyms) dan episode di namespace Samehadaku pada Sanka API.
- Halaman katalog Otakudesu (`#/o/...`) tetap memakai namespace Otakudesu untuk pemutarnya.
- Sanka dipanggil melalui `/api/sanka` sebagai proxy agar browser tidak melakukan request lintas domain secara langsung.
- Endpoint Samehadaku yang dipakai: `/samehadaku/search?q=`, `/samehadaku/anime/:animeId`, `/samehadaku/episode/:episodeId`, `/samehadaku/server/:serverId`. Proxy juga mencoba awalan `/anime/samehadaku/...` bila yang pertama gagal.
- Sanka bisa membalas `status: success` walau Samehadaku error (pesan "Error fetching data from Samehadaku"); adapter menganggapnya sebagai kegagalan.
- Jika Sanka mewajibkan API key, isi Environment Variable `SANKA_APIKEY` di Vercel (tidak perlu mengubah kode).
- Jika Sanka mengubah endpoint atau bentuk respons, adapter di `index.html` (`SRC`, `sankaAutoEpisode`) dan proxy `api/sanka.js` perlu disesuaikan.
- URL video eksternal hanya dapat diputar jika server sumber mengizinkan embed/CORS dan URL masih aktif. Sebagian server mungkin memerlukan iframe atau mungkin menolak pemutaran.

## Otakudesu: data langsung dari Sanka
- Daftar, detail, genre, jadwal, dan halaman episode Otakudesu kini diambil langsung dari Sanka lebih dulu; folder `data/` hanya cadangan bila Sanka tidak bisa dihubungi (file statis tidak lagi dimuat kecuali diperlukan).
- Halaman episode Otakudesu yang gagal (atau semua servernya mati saat diputar) otomatis mencoba Samehadaku.
- Daftar server dan URL video di-cache sementara (10 menit / 3 menit) di `sessionStorage`, dan di-refresh otomatis untuk server yang sebelumnya gagal.
- `api/sanka.js` memiliki batas waktu total ±8,5 detik; bila terlampaui, proxy membalas HTTP 504 `sanka_timeout`. Path cadangan `/anime/samehadaku/...` hanya dicoba bila path utama gagal.
- Ikon PWA (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`) sudah disertakan; ganti dengan logo sendiri bila mau.

## Auto ganti server
- Saat video gagal dimuat, Kumori otomatis mencoba server berikutnya pada sumber yang sama, lalu lanjut ke sumber lain (Server 1 → Server 2 → YouTube) pada mode Otomatis.
- Video yang sudah berjalan tetapi error atau macet lebih dari 20 detik juga otomatis dipindah ke server lain (dapat dimatikan di Pengaturan → Ganti server otomatis).
- Server yang gagal ditandai dicoret; server yang terakhir berhasil diingat dan dicoba lebih dulu di episode berikutnya.
- Tombol "Video bermasalah? Ganti server" tersedia untuk memindah manual. Untuk server berbentuk iframe, isi halaman lintas-domain tidak bisa dibaca browser, sehingga hanya gagal-muat/timeout yang terdeteksi otomatis; layar hitam di dalam iframe perlu diganti manual lewat tombol tersebut.

## YouTube resmi (fallback)
Fitur pencarian video YouTube membutuhkan `YOUTUBE_API_KEY` di Vercel Environment Variables. Tanpa key, fallback YouTube tidak akan berfungsi; streaming Sanka tetap dicoba lebih dahulu.

## Manga
Tab Manga memakai MangaDex melalui proxy `api/md.js`. Jika daftar Manga masih kosong setelah deploy, buka `/api/md?p=%2Fmanga%3Flimit%3D1%26includes%255B%255D%3Dcover_art` untuk memeriksa apakah proxy mengembalikan JSON dari MangaDex; error 429 berarti rate limit sementara dari MangaDex.

## Catatan
Sanka, Samehadaku, dan Otakudesu adalah layanan pihak ketiga. Ketersediaan endpoint, server, dan hak distribusi konten berada di bawah ketentuan penyedia masing-masing. Uji pemutaran setelah deploy; respons API dan server video pihak ketiga dapat berubah.
