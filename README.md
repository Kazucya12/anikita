# Kumori Lite

Situs katalog dan pemutar anime ringan, satu file `index.html`, tanpa build.
Data anime dari AniList. Sumber video diatur sendiri di menu **Sumber**.

## Deploy
1. Upload semua file ke repo GitHub baru.
2. Vercel: Add New, Project, pilih repo, Framework: Other, Deploy.
   (Build Command dan Output Directory dikosongkan.)

## Atur sumber video
Buka `#/set` dan isi alamat dengan {id} (ID AniList), {ep} (episode), {title}.
Contoh: `https://servermu.com/{id}/{ep}.m3u8`

## Manga
Tab Manga memakai MangaDex lewat proxy kecil `api/md.js` (Vercel Function),
jadi manga hanya jalan setelah di-deploy ke Vercel, bukan saat file dibuka langsung.

## Episode dari YouTube (resmi)
Tanpa sumber pribadi, klik episode akan mencari videonya di kanal Muse / Ani-One lewat `api/yt.js`.
1. Buat API key gratis: Google Cloud Console, aktifkan "YouTube Data API v3", buat API key.
2. Vercel, Settings, Environment Variables: `YOUTUBE_API_KEY` = key tadi (toggle Sensitive boleh dinyalakan, ini bukan variabel VITE_).
3. Redeploy.
Kuota gratis sekitar 100 pencarian per hari; hasil di-cache 24 jam.
Kalau episode tidak ditemukan, tampil link nonton resmi dari AniList.


## Katalog Otakudesu
Tab **Ongoing** dan **Complete** memakai snapshot data dari file `data/otakudesu.json`.
Klik kartu anime untuk membuka halaman sumber Otakudesu di tab baru. Untuk memperbarui
daftar, ganti isi file JSON tersebut dengan data terbaru yang memiliki struktur `ongoing`
dan `completed`.

Data tambahan **Daftar Anime** disimpan pada properti `animeList` di `data/otakudesu.json`.
Halaman ini menampilkan status, skor, genre, poster, dan tautan sumber untuk setiap anime.

## Jadwal anime Otakudesu
Tab **Jadwal** menampilkan daftar anime berdasarkan hari dari `data/otakudesu-schedule.json`.
Data ini adalah snapshot dari respons API yang diberikan; untuk pembaruan, ganti file JSON
dengan respons terbaru yang memiliki struktur `data[]`, `day`, dan `anime_list[]`.

## Detail anime dan Genre
Halaman detail (`#/o/d/<animeId>`) membaca `data/otakudesu-detail.json` (kunci = animeId,
isi = `data` dari respons detail: info, `genreList`, `episodeList`, `recommendedAnimeList`).
Untuk menambah anime, tambahkan satu entri di file itu dan satu entri di `animeList`
pada `data/otakudesu.json` agar muncul di Daftar Anime. Kartu tanpa detail tetap
membuka Otakudesu di tab baru.
Halaman Genre (`#/o/genres`, `#/o/genre/<id>`) memakai `data/otakudesu-genres.json`
dan menyaring `animeList`. Tombol episode membuka halaman episode di Otakudesu.

## Catatan streaming
Data detail anime yang dibagikan menyediakan metadata dan daftar episode, tetapi belum
menyertakan URL media video atau URL unduhan. Player internal membutuhkan endpoint detail
episode yang mengembalikan sumber video yang dapat diputar (misalnya HLS `.m3u8` atau MP4)
serta izin penggunaan sumber tersebut.
