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
