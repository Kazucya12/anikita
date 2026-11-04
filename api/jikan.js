// api/jikan.js — proxy + cache untuk Jikan API
export default async function handler(req, res) {
  const path = req.query.path;
  if (!path || !path.startsWith('/')) {
    return res.status(400).json({ error: 'path wajib, contoh: /schedules?filter=monday' });
  }

  // Hanya izinkan endpoint tertentu
  const allowed = ['/schedules', '/top/anime', '/seasons/now', '/anime', '/genres', '/random'];
  if (!allowed.some(p => path.startsWith(p))) {
    return res.status(403).json({ error: 'endpoint tidak diizinkan' });
  }

  try {
    const r = await fetch('https://api.jikan.moe/v4' + path, {
      headers: { Accept: 'application/json' }
    });
    const data = await r.text();

    if (r.ok) {
      // Cache di CDN Vercel 10 menit, boleh dipakai basi 1 jam
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(r.status).send(data);
  } catch (e) {
    return res.status(502).json({ error: 'Gagal menghubungi Jikan', detail: String(e) });
  }
}
