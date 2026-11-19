# Membuat ikon launcher & splash native dari icon-512.png di akar repo.
# Dijalankan di CI setelah `npx cap add android`.
import glob, os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
src = Image.open(os.path.join(ROOT, '..', 'icon-512.png')).convert('RGBA')

for folder, size in {'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96,
                     'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192}.items():
    d = os.path.join(RES, folder)
    os.makedirs(d, exist_ok=True)
    im = src.resize((size, size), Image.LANCZOS)
    im.save(os.path.join(d, 'ic_launcher.png'))
    mask = Image.new('L', (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    rd = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    rd.paste(im, (0, 0), mask)
    rd.save(os.path.join(d, 'ic_launcher_round.png'))

# Pakai ikon PNG biasa di semua versi Android (hapus ikon adaptif bawaan Capacitor).
for f in glob.glob(os.path.join(RES, 'mipmap-anydpi*', '*.xml')):
    os.remove(f)

# Splash native: warna solid gelap, lalu animasi splash web mengambil alih tanpa kedipan putih.
solid = Image.new('RGB', (16, 16), (14, 15, 26))
for f in glob.glob(os.path.join(RES, 'drawable*', 'splash.png')):
    solid.save(f)
print('ikon & splash dibuat')
