// Server-side proxy for Sanka Vollerei anime API.
// Keep the upstream host here so the browser never depends on CORS.
module.exports = async (req, res) => {
  const p = String(req.query.p || '');
  // Only allow the Otakudesu anime namespace; block traversal and absolute URLs.
  if (!p.startsWith('/anime/otakudesu/') || p.includes('..') || /^\/\/|https?:/i.test(p)) {
    res.status(400).json({ error: 'bad_path', message: 'Path Sanka tidak diizinkan.' });
    return;
  }
  const upstream = 'https://www.sankavollerei.web.id' + p;
  try {
    const r = await fetch(upstream, {
      headers: { accept: 'application/json', 'user-agent': 'KumoriLite/1.0' }
    });
    const body = await r.text();
    res.setHeader('content-type', r.headers.get('content-type') || 'application/json; charset=utf-8');
    res.setHeader('cache-control', 's-maxage=60, stale-while-revalidate=120');
    res.status(r.status).send(body);
  } catch (e) {
    res.status(502).json({ error: 'sanka_upstream_unreachable', message: 'Tidak dapat menghubungi Sanka API.' });
  }
};
