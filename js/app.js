// js/app.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("Anikita Web App Started 🚀");
    
    // Contoh tombol atau fungsi pemanggil data
    setupUI();
});

function setupUI() {
    // Tombol pilihan provider anime (bisa disesuaikan dengan elemen HTML kamu)
    const providers = ['otakudesu', 'kuramanime', 'kuronime', 'nanime'];
    
    providers.forEach(provider => {
        const btn = document.getElementById(`btn-${provider}`);
        if (btn) {
            btn.addEventListener("click", () => fetchAnimeData(provider));
        }
    });
}

async function fetchAnimeData(provider) {
    const displayArea = document.getElementById("anime-result");
    if (displayArea) displayArea.innerHTML = `<p>Memuat data dari ${provider}...</p>`;

    try {
        const response = await fetch(`/api/${provider}`);
        const result = await response.json();

        console.log(`Data ${provider}:`, result);
        
        if (displayArea) {
            displayArea.innerHTML = `
                <h3>Hasil dari ${provider.toUpperCase()}</h3>
                <pre style="background:#1e1e1e; color:#d4d4d4; padding:15px; border-radius:8px; overflow-x:auto;">
                    ${JSON.stringify(result, null, 2)}
                </pre>
            `;
        }
    } catch (error) {
        console.error("Gagal mengambil data:", error);
        if (displayArea) {
            displayArea.innerHTML = `<p style="color: red;">Gagal terhubung ke server API.</p>`;
        }
    }
}
