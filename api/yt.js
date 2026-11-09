// Cari episode resmi di YouTube (kanal Muse / Ani-One). Butuh env YOUTUBE_API_KEY.
module.exports = async (req, res) => {
  const key = process.env.YOUTUBE_API_KEY;
  const ep = parseInt(req.query.ep, 10);
  const titles = String(req.query.t || '').split('|').map(s => s.trim()).filter(Boolean).slice(0, 2);
  if (!key) { res.status(500).json({ error: 'no key' }); return; }
  if (!titles.length || !ep) { res.status(400).json({ error: 'bad query' }); return; }
  const OK = /muse|ani-one|ani one/i;
  try {
    for (const t of titles) {
      const q = `${t} episode ${ep}`;
      const u = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=10&q=' +
        encodeURIComponent(q) + '&key=' + key;
      const r = await fetch(u);
      const j = await r.json();
      if (!r.ok) { res.status(502).json({ error: (j.error && j.error.message) || 'yt error' }); return; }
      const re = new RegExp('(episode|ep)\\.? ?0*' + ep + '(?!\\d)', 'i');
      const hit = (j.items || []).find(i => OK.test(i.snippet.channelTitle) && re.test(i.snippet.title));
      if (hit) {
        res.setHeader('cache-control', 's-maxage=86400, stale-while-revalidate=86400');
        res.status(200).json({ id: hit.id.videoId, title: hit.snippet.title, channel: hit.snippet.channelTitle });
        return;
      }
    }
    res.setHeader('cache-control', 's-maxage=3600');
    res.status(200).json({ id: null });
  } catch (e) {
    res.status(502).json({ error: 'upstream' });
  }
};
