// Vercel serverless proxy untuk MangaDex.
//  - /api/md?p=<path API>  -> data JSON dari api.mangadex.org
//  - /api/md?u=<url gambar> -> gambar cover/halaman dari mangadex.org / mangadex.network
const IMG_HOST = /(^|\.)mangadex\.(org|network)$/i;
const IMG_MAX = 4400000; // batas respons Vercel Function ~4.5 MB

async function image(req, res) {
  let u;
  try { u = new URL(String(req.query.u || '')); } catch (e) { return res.status(400).json({ error: 'bad_url' }); }
  if (u.protocol !== 'https:' || !IMG_HOST.test(u.hostname) || u.username || u.password) {
    return res.status(400).json({ error: 'host_not_allowed' });
  }
  try {
    const r = await fetch(u.href, { headers: { 'User-Agent': 'Kumori/1.0 (image proxy)', Accept: 'image/*' } });
    let finalHost = '';
    try { finalHost = new URL(r.url).hostname; } catch (e) {}
    if (finalHost && !IMG_HOST.test(finalHost)) return res.status(400).json({ error: 'redirect_not_allowed' });
    if (!r.ok) return res.status(r.status).json({ error: 'upstream_' + r.status });
    const type = r.headers.get('content-type') || '';
    if (!/^image\//i.test(type)) return res.status(502).json({ error: 'not_an_image' });
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > IMG_MAX) return res.status(413).json({ error: 'image_too_large' });
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).json({ error: 'image_upstream_unavailable' });
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (req.query && req.query.u) return image(req, res);

  const raw = req.query && req.query.p;
  const path = Array.isArray(raw) ? raw[0] : String(raw || '');
  // Only expose the MangaDex endpoints used by the client.
  if (!/^\/(manga|chapter|at-home\/server)(\/|\?|$)/.test(path) || path.includes('..') || path.includes('\\')) {
    return res.status(400).json({ error: 'bad_path' });
  }

  try {
    const upstream = await fetch('https://api.mangadex.org' + path, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Kumori/1.0 (MangaDex API proxy)'
      }
    });
    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', path.startsWith('/at-home/server/') ? 'no-store' : 's-maxage=180, stale-while-revalidate=300');
    return res.status(upstream.status).send(body);
  } catch (error) {
    console.error('MangaDex proxy error:', error);
    return res.status(502).json({ error: 'mangadex_upstream_unavailable' });
  }
};
