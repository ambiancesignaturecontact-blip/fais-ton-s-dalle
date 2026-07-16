#!/usr/bin/env python3
import base64, io, os, json
from PIL import Image

def img_b64(path, max_size=400, quality=70):
    img = Image.open(path)
    img.thumbnail((max_size, max_size), Image.LANCZOS)
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGBA')
        bg = Image.new('RGBA', img.size, (255,255,255))
        bg.paste(img, mask=img.split()[3]); img = bg.convert('RGB')
    elif img.mode != 'RGB': img = img.convert('RGB')
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=quality, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

def resize_to(path, w, h=None, q=80):
    img = Image.open(path)
    if h: img = img.resize((w, h), Image.LANCZOS)
    else: img.thumbnail((w, w), Image.LANCZOS)
    if img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, (255,255,255))
        bg.paste(img, mask=img.split()[3]); img = bg
    elif img.mode != 'RGB': img = img.convert('RGB')
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

LOGO = resize_to('favicon.png', 322, 110, 80)
IMGS = {
    'a': img_b64('images/menu-leger.jpeg'), 'b': img_b64('images/menu-classique.jpeg'),
    'c': img_b64('images/menu-gourmand.jpeg'), 'd': img_b64('images/tiramisu.jpeg'),
    'e': img_b64('images/google-photo-1.jpeg', 300, 65), 'f': img_b64('images/google-photo-2.jpeg', 300, 65),
    'g': img_b64('images/google-photo-3.jpeg', 300, 60), 'h': img_b64('images/google-photo-4.jpeg', 300, 65),
    'i': img_b64('images/uber-store.jpeg', 240, 70),
}

# Read the template
with open(__file__.replace('build2.py','') + 'index_template.html', 'r') as f:
    template = f.read()

# Replace placeholders
html = template.replace('LOGO_B64', LOGO)
for k, v in IMGS.items():
    html = html.replace(f'IMG_{k.upper()}_B64', v)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

size = os.path.getsize('index.html')
print(f'Done! {size} bytes ({size/1024:.1f}KB)')
