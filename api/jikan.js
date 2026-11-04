export const config = { runtime: 'edge' };

const OK = /^\/(schedules|top\/anime|seasons|anime|genres|random)(\/|$)/;
const J = { 'Content-Type': 'application/json' };

export default async function handler(req) {
  const url = new URL(req.url);
  let p = url.searchParams.get('p');
  if (p === null) p = url.pathname.replace(/^\/api\/jikan/, '');
  url.searchParams.delete('p');
  const qs = url.searchParams.toString();
  const rest = p + (qs ? '?' + qs : '');

  if (!OK.test(p)) {
    return new Response(JSON.stringify({ error: 'endpoint tidak diizinkan' }), { status: 403, headers: J });
  }

  try {
    const r = await fetch('https://api.jikan.moe/v4' + rest, { headers: { Accept: 'application/json' } });
    const body = await r.text();
    const h = new Headers(J);
    if (r.ok) h.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    return new Response(body, { status: r.status, headers: h });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Gagal menghubungi Jikan' }), { status: 502, headers: J });
  }
}
