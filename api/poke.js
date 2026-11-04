export const config = { runtime: 'edge' };

const OK = /^\/[a-z-]+(\/[a-z0-9-]+)*\/?$/;
const J = { 'Content-Type': 'application/json' };

export default async function handler(req) {
  const url = new URL(req.url);
  let p = url.searchParams.get('p');
  if (p === null) p = url.pathname.replace(/^\/api\/poke/, '');
  url.searchParams.delete('p');
  const qs = url.searchParams.toString();

  if (!OK.test(p)) {
    return new Response(JSON.stringify({ error: 'endpoint tidak diizinkan' }), { status: 403, headers: J });
  }

  try {
    const r = await fetch('https://pokeapi.co/api/v2' + p + (qs ? '?' + qs : ''), { headers: { Accept: 'application/json' } });
    const body = await r.text();
    const h = new Headers(J);
    if (r.ok) h.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return new Response(body, { status: r.status, headers: h });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Gagal menghubungi PokeAPI' }), { status: 502, headers: J });
  }
}
