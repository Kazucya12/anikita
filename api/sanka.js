// Proxy server-side untuk Sanka Vollerei (https://www.sankavollerei.web.id/anime/).
// Browser memanggil /api/sanka?p=/anime/search/naruto, lalu Vercel meneruskannya.
// Jika Sanka butuh API key, isi Environment Variable SANKA_APIKEY di Vercel.
const HOST = 'https://www.sankavollerei.web.id';

module.exports = async (req, res) => {
  let p = String(req.query.p || '');
  // Kompatibel dengan path lama: /anime/otakudesu/... -> /anime/...
  p = p.replace(/^\/anime\/otakudesu\//, '/anime/');
  if (!p.startsWith('/anime/') || p.includes('..') || /^\/\/|https?:/i.test(p)) {
    res.status(400).json({ error: 'bad_path', message: 'Path Sanka tidak diizinkan.' });
    return;
  }
  const key = process.env.SANKA_APIKEY;
  let url = HOST + p;
  if (key) url += (p.includes('?') ? '&' : '?') + 'apikey=' + encodeURIComponent(key);
  try {
    const r = await fetch(url, {
      headers: {
        accept: 'application/json',
        'user-agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
      }
    });
    const body = await r.text();
    const ct = r.headers.get('content-type') || '';
    let out = body, type = ct || 'application/json; charset=utf-8';
    // Jika upstream mengembalikan bukan JSON, beri pesan JSON yang jelas.
    try { JSON.parse(body); } catch (e) {
      res.status(r.status >= 400 ? r.status : 502).json({
        error: 'upstream_not_json',
        message: 'Sanka membalas bukan JSON (HTTP ' + r.status + ').',
        path: p
      });
      return;
    }
    res.setHeader('content-type', type);
    res.setHeader('cache-control', r.ok ? 's-maxage=60, stale-while-revalidate=120' : 'no-store');
    res.status(r.status).send(out);
  } catch (e) {
    res.status(502).json({ error: 'sanka_upstream_unreachable', message: 'Tidak dapat menghubungi Sanka API.' });
  }
};
