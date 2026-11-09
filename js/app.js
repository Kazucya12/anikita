document.addEventListener("DOMContentLoaded", () => {
    const providerSelect = document.getElementById("providerSelect");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const animeContainer = document.getElementById("animeContainer");
    const sectionTitle = document.getElementById("sectionTitle");

    // Muat anime terbaru saat halaman pertama kali dibuka
    loadLatestAnime(providerSelect.value);

    // Event ketika provider diubah
    providerSelect.addEventListener("change", () => {
        loadLatestAnime(providerSelect.value);
    });

    // Event tombol cari
    searchBtn.addEventListener("click", () => {
        const query = searchInput.value.trim();
        if (query) {
            searchAnime(providerSelect.value, query);
        }
    });

    // Cari dengan menekan enter
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            searchBtn.click();
        }
    });
});

// 1. Fungsi Mengambil Anime Terbaru
async function loadLatestAnime(provider) {
    const animeContainer = document.getElementById("animeContainer");
    const sectionTitle = document.getElementById("sectionTitle");
    
    sectionTitle.innerText = `Anime Terbaru (${provider.toUpperCase()})`;
    animeContainer.innerHTML = `<div class="loading">Memuat daftar anime...</div>`;

    try {
        const res = await fetch(`/api/${provider}/latest`);
        const result = await res.json();
        
        // Sesuaikan key array dari backend API scraper kamu (misal: result.data atau result)
        const list = result.data || result;
        renderAnimeList(list, provider);
    } catch (err) {
        console.error(err);
        animeContainer.innerHTML = `<div class="loading" style="color: #ef4444;">Gagal memuat data dari ${provider}.</div>`;
    }
}

// 2. Fungsi Pencarian Anime
async function searchAnime(provider, query) {
    const animeContainer = document.getElementById("animeContainer");
    const sectionTitle = document.getElementById("sectionTitle");
    
    sectionTitle.innerText = `Hasil Pencarian: "${query}"`;
    animeContainer.innerHTML = `<div class="loading">Mencari anime...</div>`;

    try {
        const res = await fetch(`/api/${provider}/search?q=${encodeURIComponent(query)}`);
        const result = await res.json();
        const list = result.data || result;
        renderAnimeList(list, provider);
    } catch (err) {
        console.error(err);
        animeContainer.innerHTML = `<div class="loading" style="color: #ef4444;">Pencarian gagal.</div>`;
    }
}

// 3. Render Kartu Anime ke DOM
function renderAnimeList(animeList, provider) {
    const animeContainer = document.getElementById("animeContainer");
    animeContainer.innerHTML = "";

    if (!animeList || animeList.length === 0) {
        animeContainer.innerHTML = `<div class="loading">Tidak ada anime ditemukan.</div>`;
        return;
    }

    animeList.forEach(item => {
        const card = document.createElement("div");
        card.className = "anime-card";
        
        // Ambil atribut standar (title, thumb/poster, endpoint/slug)
        const title = item.title || item.name || "Untitled";
        const thumb = item.thumb || item.image || item.poster || "https://via.placeholder.com/180x250?text=No+Image";
        const endpoint = item.endpoint || item.slug || item.id;

        card.innerHTML = `
            <img src="${thumb}" alt="${title}" loading="lazy">
            <div class="anime-card-body">
                <div class="anime-card-title">${title}</div>
                <div class="anime-card-meta">${item.episode || item.status || 'Sub Indo'}</div>
            </div>
        `;

        // Klik kartu untuk memilih episode / memutar streaming
        card.addEventListener("click", () => {
            playAnime(provider, endpoint, title);
        });

        animeContainer.appendChild(card);
    });
}

// 4. Memutar Video Stream / Embed
async function playAnime(provider, endpoint, title) {
    const playerSection = document.getElementById("playerSection");
    const videoWrapper = document.getElementById("videoWrapper");
    const playerTitle = document.getElementById("playerTitle");

    playerSection.style.display = "block";
    playerTitle.innerText = `Memuat Video: ${title}...`;
    videoWrapper.innerHTML = `<div class="loading">Mengambil link streaming...</div>`;
    
    // Scroll otomatis ke video player
    playerSection.scrollIntoView({ behavior: 'smooth' });

    try {
        // Panggil endpoint streaming dari scraper
        const res = await fetch(`/api/${provider}/detail/${endpoint}`);
        const data = await res.json();
        
        // Cari URL video (embed iframe / direct link mp4/m3u8)
        const streamUrl = data.streamUrl || data.embedUrl || (data.lowMP4 && data.lowMP4.url);

        if (streamUrl) {
            playerTitle.innerText = `Sedang Memutar: ${title}`;
            if (streamUrl.includes("<iframe") || streamUrl.endsWith(".html")) {
                videoWrapper.innerHTML = `<iframe src="${streamUrl}" allowfullscreen></iframe>`;
            } else {
                videoWrapper.innerHTML = `
                    <video controls autoplay style="width:100%; height:480px;">
                        <source src="${streamUrl}" type="video/mp4">
                        Browser Anda tidak mendukung pemutar video.
                    </video>`;
            }
        } else {
            playerTitle.innerText = `Gagal Memutar: ${title}`;
            videoWrapper.innerHTML = `<div class="loading" style="color:#ef4444;">Link streaming tidak ditemukan/berbeda format slug.</div>`;
        }
    } catch (err) {
        console.error(err);
        playerTitle.innerText = `Error`;
        videoWrapper.innerHTML = `<div class="loading" style="color:#ef4444;">Gagal menghubungkan ke server video.</div>`;
    }
}
