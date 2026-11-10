// Proxy server-side untuk Sanka Vollerei (https://www.sankavollerei.web.id/anime/).
// Browser memanggil /api/sanka?p=/samehadaku/anime/ao-ashi-s2, lalu Vercel meneruskannya.
// Namespace: /anime/... (Otakudesu), /samehadaku/... (Samehadaku), dan /donghua/... (Anichin).
// Jika Sanka butuh API key, isi Environment Variable SANKA_APIKEY di Vercel.
const HOST = 'https://www.sankavollerei.web.id';
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

async function pull(path, key) {
  let url = HOST + path;
  if (key) url += (path.includes('?') ? '&' : '?') + 'apikey=' + encodeURIComponent(key);
  const r = await fetch(url, { headers: { accept: 'application/json', 'user-agent': UA } });
  const body = await r.text();
  let json = true;
  try { JSON.parse(body); } catch (e) { json = false; }
  return { r, body, json };
}

module.exports = async (req, res) => {
  let p = String(req.query.p || '');
  // Kompatibel dengan path lama: /anime/otakudesu/... -> /anime/...
  p = p.replace(/^\/anime\/otakudesu\//, '/anime/');
  const okPrefix = p.startsWith('/anime/') || p.startsWith('/samehadaku/') || p.startsWith('/donghua/');
  if (!okPrefix || p.includes('..') || /^\/\/|https?:/i.test(p)) {
    res.status(400).json({ error: 'bad_path', message: 'Path Sanka tidak diizinkan.' });
    return;
  }
  const key = process.env.SANKA_APIKEY;
  // Samehadaku bisa berada di /samehadaku/... atau /anime/samehadaku/...; coba keduanya.
  const paths = p.startsWith('/samehadaku/') ? [p, '/anime' + p] : [p];
  try {
    let last = null;
    for (const path of paths) {
      const out = await pull(path, key);
      last = { ...out, path };
      if (out.json && out.r.ok) break;
    }
    const { r, body, json, path } = last;
    if (!json) {
      res.status(r.status >= 400 ? r.status : 502).json({
        error: 'upstream_not_json',
        message: 'Sanka membalas bukan JSON (HTTP ' + r.status + ').',
        path
      });
      return;
    }
    res.setHeader('content-type', r.headers.get('content-type') || 'application/json; charset=utf-8');
    res.setHeader('cache-control', r.ok ? 's-maxage=60, stale-while-revalidate=120' : 'no-store');
    res.status(r.status).send(body);
  } catch (e) {
    res.status(502).json({ error: 'sanka_upstream_unreachable', message: 'Tidak dapat menghubungi Sanka API.' });
  }
};
