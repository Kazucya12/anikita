# Kumori Lite

Situs katalog anime, streaming melalui Sanka Vollerei, katalog manga MangaDex, dan pencarian episode resmi YouTube.

## Deploy ke Vercel
1. Upload seluruh folder repo ke GitHub.
2. Import repo ke Vercel dengan Framework Preset **Other**.
3. Build Command dikosongkan; Output Directory `.`.
4. Deploy. Backend berjalan sebagai Vercel Functions dari folder `api/`.

## Integrasi API
- **AniList GraphQL**: katalog trending, pencarian, dan detail anime.
- **Sanka Vollerei**: katalog Otakudesu live, pencarian, detail, episode, dan server streaming melalui proxy `/api/sanka`.
- **MangaDex**: manga, detail, chapter, dan reader melalui proxy `/api/md`.
- **YouTube Data API v3**: pencarian episode resmi melalui `/api/yt`.

## YouTube API Key (opsional)
Buat API key di Google Cloud Console, aktifkan YouTube Data API v3, lalu tambahkan Environment Variable `YOUTUBE_API_KEY` di Vercel dan redeploy. Jika tidak diisi, fallback tautan streaming resmi AniList tetap tersedia.

## Catatan Sanka
Sanka merupakan upstream pihak ketiga dan struktur respons/server dapat berubah. Integrasi ini mencoba pencarian anime Otakudesu, detail, episode, dan pemilihan server. Bila API upstream tidak tersedia, katalog Otakudesu memakai snapshot JSON lokal. Streaming menampilkan fallback tautan resmi AniList bila URL media dari API tidak dapat diperoleh. Gunakan konten sesuai hak akses dan ketentuan layanan.
