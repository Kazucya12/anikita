// Proxy gambar MangaDex (cover & halaman chapter) lewat Vercel.
// Dipakai saat browser tidak bisa memuat gambar langsung dari MangaDex (mis. diblokir ISP/DNS).
const ALLOWED = /(^|\.)mangadex\.(org|network)$/i;
const MAX = 4400000; // batas respons Vercel Function ~4.5 MB

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  let u;
  try { u = new URL(String((req.query && req.query.u) || '')); } catch (e) { return res.status(400).json({ error: 'bad_url' }); }
  if (u.protocol !== 'https:' || !ALLOWED.test(u.hostname) || u.username || u.password) {
    return res.status(400).json({ error: 'host_not_allowed' });
  }
  try {
    const r = await fetch(u.href, { headers: { 'User-Agent': 'KumoriLite/1.0 (image proxy)', Accept: 'image/*' } });
    let finalHost = '';
    try { finalHost = new URL(r.url).hostname; } catch (e) {}
    if (finalHost && !ALLOWED.test(finalHost)) return res.status(400).json({ error: 'redirect_not_allowed' });
    const type = r.headers.get('content-type') || '';
    if (!r.ok) return res.status(r.status).json({ error: 'upstream_' + r.status });
    if (!/^image\//i.test(type)) return res.status(502).json({ error: 'not_an_image' });
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX) return res.status(413).json({ error: 'image_too_large' });
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).json({ error: 'image_upstream_unavailable' });
  }
};
