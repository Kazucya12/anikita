/* Pengaturan (API, hari, genre, urutan) dimuat dari data/config.json. Ubah "api" di file itu untuk memakai proxy/API sendiri. */
let API,PROXY,BASE,DAYS,DAYEN,GEN,SORTDIR;
const DEFAULT_CFG={"api": "https://api.jikan.moe/v4", "proxy": "https://throbbing-bush-1d5d.akbarzenito.workers.dev", "days": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], "daysEn": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], "genres": [["", "Semua"], ["1", "Action"], ["2", "Adventure"], ["4", "Comedy"], ["8", "Drama"], ["10", "Fantasy"], ["14", "Horror"], ["7", "Mystery"], ["22", "Romance"], ["24", "Sci-Fi"], ["36", "Slice of Life"], ["30", "Sports"], ["37", "Supernatural"]], "sortDir": {"score": "desc", "popularity": "asc", "start_date": "desc", "title": "asc"}};
async function loadConfig(){
  let c=DEFAULT_CFG;
  try{const r=await fetch("data/config.json");if(r.ok)c=await r.json()}catch(e){}
  ({api:API,proxy:PROXY,days:DAYS,daysEn:DAYEN,genres:GEN,sortDir:SORTDIR}=c);
}
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ls={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};

/* ===== klien Jikan: antrean 1 permintaan / 400 ms, cache, ulang otomatis saat 429 ===== */
let last=0;const cache=new Map();
async function api(p){
  if(cache.has(p))return cache.get(p);
  /* coba proxy server sendiri (/api/jikan) dulu; kalau tidak ada atau gagal, langsung ke Jikan */
  const bases=BASE?[BASE]:[PROXY,API].filter(Boolean);
  let netErr=false;
  for(const b of bases){
    for(let i=0;i<3;i++){
      const t=Math.max(Date.now(),last+400);last=t;await sleep(t-Date.now());
      let r;try{r=await fetch(b+p,{signal:AbortSignal.timeout(10000)})}catch(e){netErr=true;break}
      if(r.status===429){await sleep(1500);continue}
      if(r.status===404||r.status>=500){netErr=true;break}
      if(!r.ok)throw new Error("Jikan error "+r.status);
      let j;try{j=await r.json()}catch(e){netErr=true;break}
      BASE=b;cache.set(p,j);return j;
    }
  }
  throw new Error(netErr?"NET":"Server Jikan sibuk, coba lagi sebentar lagi.");
}
const errMsg=e=>e.message==="NET"?"Tidak bisa terhubung ke Jikan. Pastikan dibuka lewat https (Vercel), bukan file:// atau preview. Jaringanmu mungkin memblokir Jikan: coba DNS 1.1.1.1, data seluler, atau VPN.":e.message;
const norm=a=>({id:a.mal_id,title:a.title_english||a.title,jp:a.title_japanese||"",img:((a.images.webp||{}).large_image_url)||a.images.jpg.large_image_url||a.images.jpg.image_url,score:a.score,year:a.year||(a.aired&&a.aired.prop&&a.aired.prop.from&&a.aired.prop.from.year)||"",type:a.type||"",eps:a.episodes,status:a.status||"",genres:(a.genres||[]).map(g=>g.name),syn:a.synopsis||"",time:a.broadcast&&a.broadcast.time});
const stat=s=>s==="Currently Airing"?"SEDANG TAYANG":s==="Finished Airing"?"TAMAT":s==="Not yet aired"?"AKAN TAYANG":(s||"").toUpperCase();
const wib=t=>{const[h,m]=t.split(":").map(Number);return String((h+22)%24).padStart(2,"0")+":"+String(m).padStart(2,"0")};
function toast(m){const d=document.createElement("div");d.className="toast";d.textContent=m;$("#toastWrap").appendChild(d);setTimeout(()=>d.remove(),2400)}
const fail=(el,e)=>{el.innerHTML='<div class="empty">'+esc(errMsg(e))+"</div>"};

let fav=ls.get("ak_fav",[]);
let watched=ls.get("ak_watched",{});
const state={q:"",genre:"",status:"",sort:"score",page:1,more:false,mode:"all"};
let list=[],heroList=[],heroIdx=0,heroTimer,day=(new Date().getDay()+6)%7,detailId=null;

/* ===== HERO ===== */
async function loadHero(){
  try{heroList=(await api("/top/anime?filter=airing&limit=8&sfw=true")).data.map(norm).filter(a=>a.syn).slice(0,5);renderHero();restartHero()}
  catch(e){fail($("#heroSlides"),e)}
}
function renderHero(){
  $("#heroSlides").innerHTML=heroList.map((a,i)=>`<div class="hero-slide${i===heroIdx?" active":""}" style="--img:url('${esc(a.img)}')">
    <div class="hero-inner"><div class="hero-tag">★ ${a.score||"–"} • ${stat(a.status)}${a.year?" • "+a.year:""}</div>
    <div class="h-jp">${esc(a.jp)}</div><h1>${esc(a.title)}</h1><p>${esc(a.syn)}</p>
    <div class="hero-btns"><button class="btn btn-primary" data-detail="${a.id}">▶ Trailer & Tonton</button><button class="btn btn-ghost" data-detail="${a.id}">Lihat Detail</button></div></div>
    <img class="hero-poster" src="${esc(a.img)}" alt=""></div>`).join("");
  $("#heroDots").innerHTML=heroList.map((_,i)=>`<button class="${i===heroIdx?"on":""}" data-go="${i}" aria-label="Slide ${i+1}"></button>`).join("");
}
function goHero(i){if(!heroList.length)return;heroIdx=(i+heroList.length)%heroList.length;renderHero();restartHero()}
function restartHero(){clearInterval(heroTimer);heroTimer=setInterval(()=>goHero(heroIdx+1),7000)}
$("#hero").addEventListener("click",e=>{
  const d=e.target.closest("[data-detail]");if(d)return openDetail(+d.dataset.detail);
  const g=e.target.closest("[data-go]");if(g)return goHero(+g.dataset.go);
  if(e.target.closest("#heroNext"))goHero(heroIdx+1);
  if(e.target.closest("#heroPrev"))goHero(heroIdx-1);
});

/* ===== JADWAL ===== */
async function loadSchedule(){
  $("#dayPills").innerHTML=DAYS.map((d,i)=>`<button class="${i===day?"on":""}" data-day="${i}">${d}</button>`).join("");
  const el=$("#dayList");el.innerHTML='<div class="empty">Memuat jadwal…</div>';
  const my=day;
  try{
    const seen=new Set();
    const d=(await api(`/schedules/${DAYEN[day]}?limit=25&sfw=true`)).data.filter(a=>!seen.has(a.mal_id)&&seen.add(a.mal_id)).map(norm).sort((a,b)=>(a.time||"99").localeCompare(b.time||"99"));
    if(my!==day)return;
    el.innerHTML=d.length?d.map(a=>`<div class="day-item" data-detail="${a.id}"><img src="${esc(a.img)}" alt="" loading="lazy"><div><b>${esc(a.title)}</b><small>${esc(a.type)}${a.eps?" • "+a.eps+" eps":""} • ${esc(a.genres.slice(0,2).join(", "))}</small></div>${a.time?`<span class="air">🕐 ${wib(a.time)} WIB</span>`:""}</div>`).join(""):'<div class="empty">Tidak ada rilisan hari ini.</div>';
  }catch(e){fail(el,e)}
}
$("#dayPills").addEventListener("click",e=>{const b=e.target.closest("[data-day]");if(b){day=+b.dataset.day;loadSchedule()}});
$("#dayList").addEventListener("click",e=>{const i=e.target.closest("[data-detail]");if(i)openDetail(+i.dataset.detail)});

/* ===== GRID ===== */
function renderChips(){$("#chips").innerHTML=GEN.map(([id,n])=>`<button class="${state.genre===id?"on":""}" data-g="${id}">${n}</button>`).join("")}
function cardHTML(a){
  const on=fav.some(f=>f.id===a.id),cls=a.status==="Currently Airing"?"b-air":a.status==="Not yet aired"?"b-soon":"";
  return `<article class="card" data-id="${a.id}"><div class="poster"><img src="${esc(a.img)}" alt="" loading="lazy">
    <span class="badge ${cls}">${stat(a.status)}</span>
    <button class="fav-btn ${on?"on":""}" data-fav="${a.id}" aria-label="Watchlist">${on?"♥":"♡"}</button>
    <div class="hover-play"><span>▶</span></div>${a.eps?`<span class="ep-badge">EP ${a.eps}</span>`:""}</div>
    <div class="card-body"><h3>${esc(a.title)}</h3><div class="meta"><span class="star">★ ${a.score||"–"}</span><span>${a.year||""}</span><span>${esc(a.type)}</span></div></div></article>`;
}
function renderGrid(){
  const fm=state.mode==="fav",items=fm?fav.filter(f=>f.title.toLowerCase().includes(state.q.toLowerCase())):list;
  $("#gridHeading").textContent=fm?`Watchlist Saya (${items.length})`:"Jelajahi Anime";
  $("#grid").innerHTML=items.length?items.map(cardHTML).join(""):'<div class="empty">Tidak ada anime yang cocok.</div>';
  $("#moreBtn").hidden=fm||!state.more;
  $("#navFav").classList.toggle("active",fm);$("#navAll").classList.toggle("active",!fm);
}
let gridTok=0;
async function loadGrid(reset=true){
  if(state.mode==="fav")return renderGrid();
  const tok=++gridTok;
  if(reset){state.page=1;list=[];$("#grid").innerHTML='<div class="skel"></div>'.repeat(6)}
  const p=`/anime?limit=24&sfw=true&page=${state.page}&order_by=${state.sort}&sort=${SORTDIR[state.sort]}`+(state.q?"&q="+encodeURIComponent(state.q):"")+(state.genre?"&genres="+state.genre:"")+(state.status?"&status="+state.status:"");
  try{
    const r=await api(p);if(tok!==gridTok)return;
    const seen=new Set(list.map(a=>a.id));
    list=list.concat(r.data.map(norm).filter(a=>!seen.has(a.id)));
    state.more=!!(r.pagination&&r.pagination.has_next_page);renderGrid();
  }catch(e){if(tok===gridTok)fail($("#grid"),e)}
}
$("#moreBtn").onclick=()=>{state.page++;loadGrid(false)};
$("#chips").addEventListener("click",e=>{const b=e.target.closest("[data-g]");if(!b)return;state.genre=b.dataset.g;renderChips();loadGrid()});
let qt;$("#q").addEventListener("input",e=>{state.q=e.target.value.trim();clearTimeout(qt);qt=setTimeout(loadGrid,450)});
$("#statusSel").onchange=e=>{state.status=e.target.value;loadGrid()};
$("#sortSel").onchange=e=>{state.sort=e.target.value;loadGrid()};
$("#grid").addEventListener("click",e=>{
  const f=e.target.closest("[data-fav]");if(f){e.stopPropagation();return toggleFav(+f.dataset.fav)}
  const c=e.target.closest(".card");if(c)openDetail(+c.dataset.id);
});

/* ===== WATCHLIST ===== */
function toggleFav(id,item){
  const i=fav.findIndex(f=>f.id===id);
  if(i>=0){fav.splice(i,1);toast("Dihapus dari watchlist")}
  else{const a=item||list.find(x=>x.id===id)||heroList.find(x=>x.id===id);if(!a)return;fav.unshift({id:a.id,title:a.title,img:a.img,score:a.score,year:a.year,type:a.type,eps:a.eps,status:a.status});toast("Ditambahkan ke watchlist ♥")}
  ls.set("ak_fav",fav);updateFav();renderGrid();
  const b=$("#dFav");if(b&&detailId===id)favBtn(b,id);
}
function updateFav(){const b=$("#favBadge");b.textContent=fav.length;b.hidden=!fav.length}
function favBtn(b,id){const on=fav.some(f=>f.id===id);b.textContent=on?"♥ Di Watchlist":"♡ Tambah Watchlist";b.classList.toggle("on",on)}
$("#navFav").addEventListener("click",e=>{e.preventDefault();state.mode=state.mode==="fav"?"all":"fav";$("#navLinks").classList.remove("open");state.mode==="all"?loadGrid():renderGrid();$("#jelajahi").scrollIntoView()});
$("#navAll").addEventListener("click",()=>{if(state.mode==="fav"){state.mode="all";loadGrid()}$("#navLinks").classList.remove("open")});

/* ===== PENANDA EPISODE DITONTON (disimpan di browser) ===== */
function renderEps(id,e){
  const w=watched[id]||[],box=$("#dEps");if(!box)return;
  const n=w.filter(k=>e.some(x=>x.mal_id===k)).length;
  $("#epN").textContent=e.length?`(${n}/${e.length} ditonton)`:"";
  box.innerHTML=e.length?e.map(x=>{const on=w.includes(x.mal_id);return `<div class="ep-row${on?" seen":""}" data-ep="${x.mal_id}"><b>${x.mal_id}</b><span>${esc(x.title||"Episode "+x.mal_id)}</span><i class="chk">${on?"✓":"○"}</i></div>`}).join(""):'<div class="ep-row"><span>Belum ada data episode.</span></div>';
  box.onclick=ev=>{
    const r=ev.target.closest("[data-ep]");if(!r)return;
    const k=+r.dataset.ep,a=watched[id]||(watched[id]=[]),i=a.indexOf(k);
    i>=0?a.splice(i,1):a.push(k);
    if(!a.length)delete watched[id];
    ls.set("ak_watched",watched);renderEps(id,e);
  };
}

/* ===== DETAIL ===== */
async function openDetail(id){
  detailId=id;$("#detailBody").innerHTML='<div class="empty" style="padding:90px 20px">Memuat…</div>';
  $("#detailModal").classList.add("open");document.body.style.overflow="hidden";
  try{
    const raw=(await api(`/anime/${id}/full`)).data,a=norm(raw);
    if(detailId!==id)return;
    const tr=raw.trailer&&(raw.trailer.embed_url||(raw.trailer.youtube_id&&"https://www.youtube.com/embed/"+raw.trailer.youtube_id));
    const st=(raw.streaming||[]);
    $("#detailBody").innerHTML=`<div class="detail-hero" style="--img:url('${esc(a.img)}')"><span class="d-jp">${esc(a.jp)}</span><h2>${esc(a.title)}</h2></div>
    <div class="detail-body">
      <div class="d-rating">★ ${a.score||"–"} <small>${raw.scored_by?"• "+raw.scored_by.toLocaleString("id-ID")+" penilai":""}</small></div>
      <div class="d-meta"><span>Status: <b>${stat(a.status)}</b></span><span>Tipe: <b>${esc(a.type||"–")}</b></span><span>Episode: <b>${a.eps||"?"}</b></span><span>Tahun: <b>${a.year||"–"}</b></span><span>Studio: <b>${esc((raw.studios||[]).map(s=>s.name).join(", ")||"–")}</b></span><span>Durasi: <b>${esc(raw.duration||"–")}</b></span></div>
      <p class="d-syn">${esc(a.syn||"Belum ada sinopsis.")}</p>
      <div class="d-genres">${a.genres.map(g=>`<span>${esc(g)}</span>`).join("")}</div>
      <div class="d-btns"><button class="btn-fav" id="dFav"></button></div>
      ${tr?`<div class="eps-title">Trailer</div><div class="vid"><iframe src="${esc(tr)}" allowfullscreen title="Trailer"></iframe></div>`:""}
      <div class="eps-title">Tonton resmi</div>
      <div class="links">${st.length?st.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join(""):'<span style="color:var(--muted)">Belum ada data platform resmi.</span>'}</div>
      <details class="own"><summary>Putar video milikmu</summary>
        <div class="row"><input type="text" id="ou" placeholder="Link video (.mp4 / .webm) milikmu"><button class="btn btn-primary" id="ogo">Putar</button></div>
        <div class="row"><input type="file" id="of" accept="video/*"></div>
        <video id="ov" controls playsinline></video>
        <div class="row"><a class="btn btn-ghost" id="odl" style="color:var(--text);border-color:var(--line);text-decoration:none" hidden download>Unduh video</a></div>
        <small>Hanya untuk video milikmu sendiri atau berlisensi bebas. Situs ini tidak menyediakan anime bajakan.</small></details>
      <div class="eps-title">Daftar Episode <span id="epN" style="color:var(--muted);font-weight:600"></span></div>
      <div class="eps-list" id="dEps"><div class="ep-row"><span>Memuat…</span></div></div>
    </div>`;
    favBtn($("#dFav"),id);$("#dFav").onclick=()=>toggleFav(id,a);
    const v=$("#ov"),dl=$("#odl");
    $("#ogo").onclick=()=>{const u=$("#ou").value.trim();if(!u)return;v.src=u;v.play().catch(()=>{});dl.href=u;dl.hidden=false};
    $("#of").onchange=e=>{const f=e.target.files[0];if(!f)return;const u=URL.createObjectURL(f);v.src=u;v.play().catch(()=>{});dl.href=u;dl.download=f.name;dl.hidden=false};
    api(`/anime/${id}/episodes`).then(r=>{
      if(detailId!==id)return;
      const e=r.data||[];
      renderEps(id,e);
    }).catch(()=>{if(detailId===id)$("#dEps").innerHTML='<div class="ep-row"><span>Daftar episode gagal dimuat.</span></div>'});
  }catch(e){if(detailId===id)fail($("#detailBody"),e)}
}
function closeDetail(){detailId=null;$("#detailModal").classList.remove("open");$("#detailBody").innerHTML="";document.body.style.overflow=""}
$("#closeDetail").onclick=closeDetail;
$("#detailModal").addEventListener("click",e=>{if(e.target===$("#detailModal"))closeDetail()});

/* ===== UI ===== */
$("#hamburger").onclick=()=>$("#navLinks").classList.toggle("open");
$("#themeBtn").onclick=()=>{const l=document.body.classList.toggle("light");$("#themeBtn").textContent=l?"☀️":"🌙";ls.set("ak_theme",l?"light":"dark")};
if(ls.get("ak_theme","dark")==="light"){document.body.classList.add("light");$("#themeBtn").textContent="☀️"}
document.addEventListener("keydown",e=>{
  const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if(e.key==="/"&&!typing){e.preventDefault();$("#q").focus()}
  if(e.key==="Escape")closeDetail();
});

/* ===== POKEMON SPOTLIGHT (PokeAPI lewat proxy /api/poke) ===== */
async function poke(p){
  const r=await fetch("/api/poke"+p,{signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new Error("Poke "+r.status);
  return r.json();
}
async function loadPoke(){
  const el=$("#pokeBox");
  el.innerHTML='<div class="empty">Memuat…</div>';
  try{
    const f=await poke("/pokemon-form/132/");
    const ab=await poke("/ability/150/");
    const mv=await poke("/move/144/");
    const en=o=>((o.effect_entries||[]).find(x=>x.language.name==="en")||{}).short_effect||"–";
    el.innerHTML=`<div class="poke">
      <img src="${esc(f.sprites.front_default||"")}" alt="${esc(f.name)}">
      <div class="poke-info">
        <h3>${esc(f.pokemon.name)}</h3>
        <div class="poke-tags">${f.types.map(t=>`<span>${esc(t.type.name)}</span>`).join("")}</div>
        <p><b>Ability: ${esc(ab.name)}</b><br>${esc(en(ab))}</p>
        <p><b>Move: ${esc(mv.name)}</b> • ${esc(mv.type.name)} • PP ${mv.pp||"–"} • Power ${mv.power||"–"}<br>${esc(en(mv))}</p>
      </div></div>`;
  }catch(e){el.innerHTML='<div class="empty">Data Pokémon gagal dimuat.</div>'}
}
loadConfig().then(()=>{renderChips();updateFav();loadHero();loadSchedule();loadGrid();loadPoke()});
