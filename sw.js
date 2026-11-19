const V='kumori-v5';
const SHELL=['/','/manifest.webmanifest','/icon-192.png','/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x.startsWith('kumori-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});

const timeout=(ms)=>new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms));
async function netFirst(req,key,ms){
  const c=await caches.open(V);
  try{
    const res=await Promise.race([fetch(req),timeout(ms)]);
    if(res&&res.ok&&!res.redirected)c.put(key,res.clone());
    return res;
  }catch{
    const hit=await c.match(key);
    if(hit)return hit;
    throw new Error('offline');
  }
}
async function swr(req){
  const c=await caches.open(V),hit=await c.match(req);
  const net=fetch(req).then(res=>{if(res&&res.ok)c.put(req,res.clone());return res}).catch(()=>null);
  return hit||(await net)||Response.error();
}
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==location.origin)return;
  if(r.mode==='navigate'){e.respondWith(netFirst(r,'/',3500));return}
  if(u.pathname==='/api/sanka'){
    let q='';try{q=decodeURIComponent(u.search)}catch{}
    if(/ongoing-anime|complete-anime|\/anime\/anime\//.test(q))e.respondWith(netFirst(r,r.url,4000));
    return;
  }
  if(u.pathname.startsWith('/api/'))return;
  if(u.pathname.startsWith('/data/')||/\.(png|webmanifest)$/.test(u.pathname))e.respondWith(swr(r));
});
