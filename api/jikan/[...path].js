// Vercel Serverless Function: meneruskan /api/jikan/* ke Jikan API dari server,
// jadi browser tidak perlu menghubungi Jikan langsung (menghindari blokir ISP/CORS) dan hasilnya di-cache.
module.exports = async (req, res) => {
  const { path = [], ...query } = req.query;
  const p = [].concat(path).join("/");
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) [].concat(v).forEach((x) => qs.append(k, x));
  try {
    const r = await fetch("https://api.jikan.moe/v4/" + p + (qs.toString() ? "?" + qs : ""));
    const body = await r.text();
    res.setHeader("Content-Type", "application/json");
    if (r.ok) res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    res.status(r.status).send(body);
  } catch (e) {
    res.status(502).json({ error: "Gagal menghubungi Jikan" });
  }
};
