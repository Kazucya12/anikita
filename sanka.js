// Server-side proxy for Sanka Vollerei anime API.
// Only allow the public anime endpoints used by Kumori Lite.
module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'method_not_allowed' }); }
  const p = String(req.query.p || '');
  if (!p.startsWith('/anime/') || p.includes('..') || p.length > 500 || /[\r\n]/.test(p)) {
    return res.status(400).json({ error: 'bad_path' });
  }
  try {
    const upstream = await fetch('https://www.sankavollerei.web.id' + p, {
      headers: { 'accept': 'application/json', 'user-agent': 'KumoriLite/1.1 (+https://vercel.app)' }
    });
    const body = await upstream.text();
    res.setHeader('content-type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    res.setHeader('cache-control', p.includes('/episode/') || p.includes('/server/') ? 's-maxage=60, stale-while-revalidate=120' : 's-maxage=300, stale-while-revalidate=600');
    return res.status(upstream.status).send(body);
  } catch (err) {
    return res.status(502).json({ error: 'sanka_upstream_unavailable', message: 'Tidak dapat menghubungi Sanka API.' });
  }
};
