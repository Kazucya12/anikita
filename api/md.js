// Proxy kecil ke MangaDex (menghindari CORS, menambah user-agent)
module.exports = async (req, res) => {
  const p = String(req.query.p || '');
  if (!/^\/(manga|chapter|at-home\/server)(\/|\?|$)/.test(p) || p.includes('..')) {
    res.status(400).json({ error: 'bad path' });
    return;
  }
  try {
    const r = await fetch('https://api.mangadex.org' + p, {
      headers: { 'user-agent': 'kumori-lite/1.0' }
    });
    const t = await r.text();
    res.setHeader('content-type', 'application/json');
    if (!p.startsWith('/at-home')) res.setHeader('cache-control', 's-maxage=300, stale-while-revalidate=600');
    res.status(r.status).send(t);
  } catch (e) {
    res.status(502).json({ error: 'upstream' });
  }
};
