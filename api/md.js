// Vercel serverless proxy for MangaDex API.
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

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
