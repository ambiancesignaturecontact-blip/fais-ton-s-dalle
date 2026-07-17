#!/usr/bin/env python3
import base64, io, os, sys
from PIL import Image

def img_b64(path, max_size=400, quality=70):
    img = Image.open(path)
    img.thumbnail((max_size, max_size), Image.LANCZOS)
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGBA')
        bg = Image.new('RGBA', img.size, (255,255,255))
        bg.paste(img, mask=img.split()[3])
        img = bg.convert('RGB')
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=quality, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

def resize_to(path, w, h=None, quality=80):
    img = Image.open(path)
    if h:
        img = img.resize((w, h), Image.LANCZOS)
    else:
        img.thumbnail((w, w), Image.LANCZOS)
    if img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, (255,255,255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=quality, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

print("Generating images...")
logo = resize_to('favicon.png', 322, 110, 80)
I_a = img_b64('images/menu-leger.jpeg')
I_b = img_b64('images/menu-classique.jpeg')
I_c = img_b64('images/menu-gourmand.jpeg')
I_d = img_b64('images/tiramisu.jpeg')
I_e = img_b64('images/google-photo-1.jpeg', 300, 65)
I_f = img_b64('images/google-photo-2.jpeg', 300, 65)
I_g = img_b64('images/google-photo-3.jpeg', 300, 60)
I_h = img_b64('images/google-photo-4.jpeg', 300, 65)
I_i = img_b64('images/uber-store.jpeg', 240, 70)

FAVICON = "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"

print("Images generated, building HTML...")

# Build HTML template with Python string formatting
# Use Unicode escapes instead of surrogate pairs
E = {
    'sun': '\u2600\ufe0f',
    'moon': '\U0001f319',
    'star': '\u2b50',
    'cart': '\U0001f6d2',
    'wrench': '\U0001f527',
    'sandwich': '\U0001f96a',
    'meat': '\U0001f969',
    'salad': '\U0001f957',
    'sauce': '\U0001f9c2',
    'phone': '\U0001f4de',
    'mail': '\U0001f4ec',
    'sparkles': '\u2728',
    'fire': '\U0001f525',
    'cake': '\U0001f370',
    'drink': '\U0001f964',
    'soda': '\U0001f964',
}

html = f'''<!DOCTYPE html>
<html lang="fr" data-theme="light">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FAIS TON S'DALLE — Sandwichs sur mesure | Les Pavillons-sous-Bois 93320</title>
<meta name="description" content="Crée ton sandwich sur mesure chez FAIS TON S'DALLE. Viandes froides, crudités fraîches, sauces personnalisées. Livraison 23h-06h. Uber Eats.">
<meta name="robots" content="index,follow"><meta name="geo.position" content="48.906;2.511">
<link rel="canonical" href="https://faistonsdalle.fr">
<link rel="alternate" href="https://faistonsdalle.fr" hreflang="fr"><link rel="alternate" href="https://faistonsdalle.fr" hreflang="x-default">
<meta property="og:type" content="restaurant.menu"><meta property="og:title" content="FAIS TON S'DALLE - Sandwichs sur mesure"><meta property="og:description" content="Crée ton sandwich sur mesure : viandes froides, crudités fraîches et sauces. Livraison jusqu'à 6h."><meta property="og:url" content="https://faistonsdalle.fr">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="FAIS TON S'DALLE"><meta name="twitter:description" content="Sandwichs sur mesure. Livraison nocturne jusqu'à 6h.">
<meta name="theme-color" content="#c73b2b"><link rel="manifest" href="/manifest.json">
<link rel="icon" type="image/png" sizes="32x32" href="data:image/png;base64,{FAVICON}">
<link rel="apple-touch-icon" href="data:image/png;base64,{FAVICON}">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"FastFoodRestaurant","name":"FAIS TON S'DALLE","url":"https://faistonsdalle.fr","telephone":"+33672044875","servesCuisine":["Sandwichs","Fast Food"],"address":{{"@type":"PostalAddress","streetAddress":"134 Allee du Colonel Fabien","addressLocality":"Les Pavillons-sous-Bois","postalCode":"93320","addressCountry":"FR"}},"aggregateRating":{{"@type":"AggregateRating","ratingValue":"4.4","ratingCount":"14"}},"openingHoursSpecification":[{{"@type":"OpeningHoursSpecification","name":"Service","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],"opens":"11:30","closes":"23:00"}},{{"@type":"OpeningHoursSpecification","name":"Livraison","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],"opens":"23:00","closes":"06:00"}}],"sameAs":["https://www.tiktok.com/@faistonsdalle","https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g"]}}</script>
<style>
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
:root{{--p:#c73b2b;--p2:#a52a1c;--s:#f5a623;--s2:#e09512;--bg:#f8f6f3;--c:#fff;--t:#1a1a1a;--t2:#6b6b6b;--b:#e8e2db;--r:16px;--f:Inter,'Segoe UI',system-ui,sans-serif;--sh:0 2px 12px rgba(0,0,0,.06);--sh2:0 8px 30px rgba(0,0,0,.1)}}[data-theme="dark"]{{--bg:#121212;--c:#1a1a1a;--t:#eee;--t2:#999;--b:#2a2a2a;--sh:0 2px 12px rgba(0,0,0,.2);--sh2:0 8px 30px rgba(0,0,0,.3)}}
html{{scroll-behavior:smooth}}body{{font-family:var(--f);background:var(--bg);color:var(--t);transition:.3s;overflow-x:hidden;min-height:100vh}}img{{max-width:100%;display:block}}a{{color:inherit;text-decoration:none}}
.bar{{background:#1a1a1a;color:#fff;padding:5px 14px;font-size:.65rem;text-align:center;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}}.bar .n{{background:linear-gradient(135deg,#1e1b4b,#312e81);color:#c7d2fe;padding:2px 10px;border-radius:12px;font-size:.55rem;font-weight:600}}
header{{background:rgba(255,255,255,.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);position:sticky;top:0;z-index:100;border-bottom:1px solid var(--b)}}.hd{{max-width:1200px;margin:0 auto;padding:0 16px;display:flex;align-items:center;justify-content:space-between;height:60px}}
.lg{{display:flex;align-items:center;gap:10px;flex-shrink:0}}.lg img{{height:36px;width:auto;object-fit:contain}}.lg div{{font-weight:800;font-size:.9rem;line-height:1.1;letter-spacing:-.3px}}.lg div s{{display:block;font-weight:500;font-size:.45rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--t2)}}
.nv{{display:flex;gap:4px;align-items:center}}.nv a{{padding:7px 14px;border-radius:30px;font-size:.7rem;font-weight:600;color:var(--t2);transition:.25s;cursor:pointer}}.nv a:hover{{background:var(--bg);color:var(--p)}}.nv a.sl{{background:var(--p);color:#fff;box-shadow:0 2px 8px rgba(199,59,43,.25)}}
.tg{{background:none;border:1.5px solid var(--b);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.85rem;color:var(--t2);transition:.25s}}.tg:hover{{border-color:var(--s)}}
.ct{{padding:6px 12px;border-radius:30px;display:flex;align-items:center;gap:5px;font-weight:700;font-size:.72rem;cursor:pointer;border:1.5px solid var(--b);background:var(--c);transition:.25s}}.ct:hover{{border-color:var(--p)}}.cb{{background:var(--p);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.58rem;font-weight:800}}
.pg{{display:block}}.pg.h{{display:none}}
.hero{{background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);color:#fff;padding:48px 14px 36px;text-align:center;position:relative;overflow:hidden}}.hero::before{{content:'';position:absolute;top:-60%;right:-30%;width:500px;height:500px;background:radial-gradient(circle,rgba(245,166,35,.08) 0%,transparent 70%);pointer-events:none}}
.hero h1{{font-size:clamp(1.4rem,4.5vw,2.4rem);font-weight:900;line-height:1.05;margin-bottom:6px;position:relative}}.hero h1 .h{{background:linear-gradient(135deg,var(--s),#fbc96a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}}
.hero .t{{font-size:.85rem;opacity:.75;margin-bottom:14px;position:relative}}.hero .s{{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;position:relative}}.hero .s span{{font-size:.68rem;background:rgba(255,255,255,.07);padding:4px 12px;border-radius:30px;border:1px solid rgba(255,255,255,.05)}}.hero .s strong{{color:var(--s)}}
.nb{{background:linear-gradient(135deg,#1e1b4b,#312e81);padding:8px 14px;text-align:center;font-size:.68rem;color:#c7d2fe;display:none}}.nb a{{color:#c7d2fe;text-decoration:underline}}.w{{max-width:1200px;margin:0 auto;padding:0 16px}}
.sec{{font-size:1.2rem;font-weight:800;margin:28px 0 4px;letter-spacing:-.3px}}.sec .hl{{color:var(--p)}}.sd{{color:var(--t2);font-size:.75rem;margin-bottom:14px}}
.tb{{display:flex;gap:6px;overflow-x:auto;padding:2px 0 16px;scrollbar-width:none}}.tb::-webkit-scrollbar{{display:none}}.tb button{{padding:7px 18px;border-radius:30px;border:1.5px solid var(--b);background:var(--c);font-weight:600;font-size:.7rem;cursor:pointer;white-space:nowrap;color:var(--t2);flex-shrink:0;transition:.25s}}.tb button:hover{{border-color:var(--s)}}.tb button.on{{background:var(--p);color:#fff;border-color:var(--p);box-shadow:0 2px 8px rgba(199,59,43,.2)}}
.mg{{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin-bottom:28px}}
.mc{{background:var(--c);border-radius:var(--r);overflow:hidden;border:1px solid var(--b);cursor:pointer;transition:transform .3s,box-shadow .3s;box-shadow:var(--sh)}}.mc:hover{{transform:translateY(-4px);box-shadow:var(--sh2);border-color:rgba(199,59,43,.15)}}
.mi{{width:100%;height:145px;background-size:cover;background-position:center;position:relative;background-color:var(--bg)}}
.mb{{padding:12px 14px 14px}}.mb h3{{font-size:.88rem;font-weight:700;margin-bottom:2px}}.mb .d{{color:var(--t2);font-size:.66rem;line-height:1.35}}.mf{{display:flex;align-items:center;justify-content:space-between;margin-top:8px}}.pr{{font-weight:800;font-size:.95rem;color:var(--p)}}.bt{{background:var(--p);color:#fff;border:none;padding:6px 16px;border-radius:30px;font-weight:700;font-size:.68rem;cursor:pointer;transition:.25s}}.bt:hover{{background:var(--p2);transform:scale(1.05)}}
.ap{{max-width:760px;margin:0 auto;padding:20px 0}}.ap .cd{{background:var(--c);border-radius:var(--r);padding:20px;margin:14px 0;border:1px solid var(--b);box-shadow:var(--sh)}}.ap h2{{font-size:1.2rem;font-weight:800;margin-bottom:8px;letter-spacing:-.2px}}.ap h3{{font-size:.88rem;font-weight:700;color:var(--p);margin-bottom:6px}}.ap p{{color:var(--t2);font-size:.78rem;line-height:1.65;margin-bottom:6px}}.ap .im{{text-align:center;margin:18px 0}}.ap .im img{{max-width:200px;max-height:70px;margin:0 auto;border-radius:8px}}
.rv{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:28px}}.rv div{{background:var(--c);border-radius:var(--r);padding:14px;border:1px solid var(--b);box-shadow:var(--sh)}}.rv .sr{{color:var(--s);font-size:.82rem;margin-bottom:3px}}.rv .tx{{font-size:.7rem;color:var(--t2);font-style:italic;line-height:1.45;margin-bottom:4px}}.rv .au{{font-size:.65rem;font-weight:600}}
.inf{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:28px 0}}.inf div{{background:var(--c);padding:16px;border-radius:var(--r);border:1px solid var(--b);box-shadow:var(--sh)}}.inf .ic{{font-size:1.4rem;margin-bottom:4px}}.inf h4{{font-weight:700;font-size:.78rem;margin-bottom:4px}}.inf p{{color:var(--t2);font-size:.7rem;line-height:1.45}}.inf .hb{{display:inline-block;background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e;padding:3px 10px;border-radius:20px;font-size:.55rem;font-weight:700}}
.hg{{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:4px}}.hg div{{display:flex;justify-content:space-between;padding:4px 10px;border-radius:6px;font-size:.68rem;background:var(--b)}}.hg .nt{{background:linear-gradient(135deg,#eef2ff,#e0e7ff)}}[data-theme="dark"] .hg .nt{{background:linear-gradient(135deg,#1e1b4b,#2e2a5e);color:#c7d2fe}}
.ub{{background:#06c;color:#fff!important;padding:9px 20px;border-radius:30px;font-weight:700;font-size:.75rem;display:inline-block;cursor:pointer;transition:.25s;border:none}}.ub:hover{{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,102,204,.3)}}.ub2{{background:#06c;color:#fff!important;padding:12px 28px;border-radius:30px;font-weight:700;font-size:.85rem;display:inline-block;cursor:pointer;transition:.25s;border:none}}.ub2:hover{{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,102,204,.3)}}.btl{{font-weight:800;font-size:1.1rem;color:var(--p)!important}}
.nl{{background:linear-gradient(135deg,var(--p),#8a2216);border-radius:var(--r);padding:24px;margin-bottom:28px;color:#fff;text-align:center;position:relative;overflow:hidden}}.nl::before{{content:'';position:absolute;top:-80%;right:-20%;width:400px;height:400px;background:radial-gradient(circle,rgba(255,255,255,.05) 0%,transparent 70%);pointer-events:none}}.nl h3{{font-size:1rem;font-weight:700;margin-bottom:4px;position:relative}}.nl p{{opacity:.85;font-size:.75rem;margin-bottom:14px;position:relative}}.nl form{{display:flex;gap:8px;max-width:380px;margin:0 auto;position:relative}}.nl input{{flex:1;padding:11px 16px;border-radius:30px;border:none;font-size:.8rem;outline:none}}.nl button{{padding:11px 24px;background:#fff;color:var(--p);border:none;border-radius:30px;font-weight:700;font-size:.8rem;cursor:pointer;transition:.25s}}.nl button:hover{{transform:scale(1.04)}}
.mod{{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:200;align-items:center;justify-content:center;padding:14px}}.mod.on{{display:flex}}.mod .bx{{background:var(--c);border-radius:var(--r);max-width:480px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.15)}}.mod .hd{{padding:16px 20px 12px;border-bottom:1px solid var(--b);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--c);z-index:1}}.mod .hd h2{{font-size:.9rem;font-weight:700}}.mod .cl{{background:var(--b);border:none;width:30px;height:30px;border-radius:50%;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--t2);transition:.25s}}.mod .cl:hover{{background:var(--p);color:#fff}}.mod .bd{{padding:14px 20px 12px}}.cs{{margin-bottom:16px}}.cs h4{{font-size:.76rem;font-weight:700;margin-bottom:6px}}.og{{display:grid;grid-template-columns:repeat(auto-fill,minmax(95px,1fr));gap:6px}}.og button{{padding:7px 10px;border:1.5px solid var(--b);border-radius:8px;background:var(--c);cursor:pointer;text-align:center;font-size:.65rem;font-weight:500;color:var(--t);transition:.2s}}.og button:hover{{border-color:var(--s)}}.og button.sel{{border-color:var(--p);background:rgba(199,59,43,.08);color:var(--p);font-weight:600}}
.mod .ft{{padding:12px 20px 14px;border-top:1px solid var(--b);display:flex;justify-content:space-between;align-items:center;background:var(--c);position:sticky;bottom:0}}.mod .ft .tp{{font-weight:800;font-size:1rem;color:var(--p)}}.mod .ft .ok{{background:var(--p);color:#fff;border:none;padding:9px 24px;border-radius:30px;font-weight:700;font-size:.75rem;cursor:pointer;transition:.25s}}.mod .ft .ok:hover{{background:var(--p2);transform:scale(1.04)}}
.co{{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);z-index:300}}.co.on{{display:block}}.cp{{position:fixed;top:0;right:-360px;width:360px;max-width:100vw;height:100vh;background:var(--c);z-index:301;transition:right .35s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;box-shadow:-4px 0 30px rgba(0,0,0,.1)}}.cp.on{{right:0}}.cp .hd{{padding:16px 20px;border-bottom:1px solid var(--b);display:flex;justify-content:space-between;align-items:center}}.cp .hd h3{{font-size:.82rem;font-weight:700}}.cp .its{{flex:1;overflow-y:auto;padding:8px 20px}}.cp .em{{text-align:center;padding:40px 0;color:var(--t2);font-size:.85rem}}
.ci{{display:flex;gap:8px;padding:10px 0;border-bottom:1px solid var(--b)}}.ci:last-child{{border:none}}.ci .if{{flex:1;min-width:0}}.ci .if h4{{font-size:.76rem;font-weight:600}}.ci .if .cu{{font-size:.62rem;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}.ci .ac{{display:flex;align-items:center;gap:6px;flex-shrink:0}}.ci .ac .q{{width:24px;height:24px;border-radius:50%;border:1.5px solid var(--b);background:var(--c);cursor:pointer;font-weight:700;font-size:.8rem;display:flex;align-items:center;justify-content:center;color:var(--t);transition:.2s}}.ci .ac .q:hover{{border-color:var(--p);color:var(--p)}}.ci .ac .n{{font-weight:600;min-width:16px;text-align:center;font-size:.76rem}}.ci .ac .it{{font-weight:700;color:var(--p);min-width:40px;text-align:right;font-size:.76rem}}
.cp .ft{{padding:12px 20px 16px;border-top:1px solid var(--b)}}.cp .tr{{display:flex;justify-content:space-between;font-weight:700;font-size:.82rem;margin-bottom:8px}}.cp .tr .ta{{color:var(--p)}}.cp .ck{{width:100%;padding:12px;background:var(--p);color:#fff;border:none;border-radius:30px;font-weight:700;font-size:.76rem;cursor:pointer;transition:.25s}}.cp .ck:hover{{background:var(--p2);transform:translateY(-1px);box-shadow:0 4px 12px rgba(199,59,43,.3)}}
.toast{{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:var(--t);color:#fff;padding:12px 22px;border-radius:12px;font-size:.74rem;z-index:500;opacity:0;transition:.4s;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.15)}}.toast.on{{opacity:1;transform:translateX(-50%) translateY(0)}}
.ni{{display:none;position:fixed;bottom:16px;right:16px;z-index:50;background:linear-gradient(135deg,#1e1b4b,#312e81);color:#c7d2fe;padding:10px 14px;border-radius:12px;font-size:.6rem;font-weight:600;gap:6px;align-items:center;box-shadow:0 4px 16px rgba(0,0,0,.15)}}
footer{{background:#1a1a1a;color:rgba(255,255,255,.65);padding:32px 16px 16px;margin-top:32px}}[data-theme="dark"] footer{{background:#0d0d0d}}.fi{{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px}}.fi h4{{color:#fff;font-weight:700;font-size:.76rem;margin-bottom:6px}}.fi p,.fi a{{font-size:.68rem;color:rgba(255,255,255,.5);display:block;margin-bottom:4px}}.fi a:hover{{color:var(--s)}}.fb{{max-width:1200px;margin:16px auto 0;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);text-align:center;font-size:.62rem}}
@media(max-width:1024px){{.mg{{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}}.hero h1{{font-size:clamp(1.3rem,3.8vw,1.8rem)}}}}
@media(max-width:900px){{.ap .gr{{grid-template-columns:1fr}}.hero .s span{{font-size:.65rem;padding:3px 10px}}.hero .t{{font-size:.8rem}}}}
@media(max-width:768px){{.nv a:not(.ct):not(.tg){{display:none}}.mg{{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}}.cp{{width:100vw;right:-100vw}}.nl form{{flex-direction:column}}.nl input{{width:100%}}.hd{{height:54px;padding:0 12px}}.lg img{{height:28px}}.lg div{{font-size:.78rem}}.hero{{padding:32px 12px 28px}}.hero h1{{font-size:clamp(1.2rem,5.5vw,1.5rem)}}.hero .t{{font-size:.75rem}}.hero .s{{gap:6px}}.hero .s span{{font-size:.62rem;padding:3px 8px}}.mi{{height:120px}}.mb{{padding:10px 12px 12px}}.mb h3{{font-size:.82rem}}.mb .d{{font-size:.62rem}}.pr{{font-size:.85rem}}.bt{{padding:5px 14px;font-size:.65rem}}.sec{{font-size:1.05rem;margin:20px 0 3px}}.sd{{font-size:.72rem}}.tb button{{padding:6px 14px;font-size:.65rem}}.ap{{padding:14px 0}}.ap h2{{font-size:1rem}}.ap p{{font-size:.72rem}}.ap .cd{{padding:16px}}.inf{{grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}}.inf div{{padding:12px}}.inf .ic{{font-size:1.2rem}}.inf h4{{font-size:.72rem}}.rv{{grid-template-columns:1fr;gap:8px}}.mod .bx{{max-width:95vw}}.mod .hd{{padding:14px 16px 10px}}.mod .hd h2{{font-size:.8rem}}.mod .bd{{padding:12px 16px}}.cs h4{{font-size:.72rem}}.og{{grid-template-columns:repeat(auto-fill,minmax(80px,1fr))}}.og button{{padding:6px 8px;font-size:.6rem}}.mod .ft{{padding:10px 16px 12px}}.mod .ft .tp{{font-size:.85rem}}.mod .ft .ok{{padding:8px 18px;font-size:.72rem}}.cp .hd{{padding:14px 16px}}.cp .hd h3{{font-size:.76rem}}.cp .its{{padding:6px 16px}}.ci .if h4{{font-size:.72rem}}.cp .ft{{padding:10px 16px 14px}}.cp .tr{{font-size:.78rem}}.cp .ck{{font-size:.72rem;padding:10px}}.ub2{{padding:10px 20px;font-size:.76rem}}.nl{{padding:18px}}.nl h3{{font-size:.85rem}}.nl p{{font-size:.7rem}}.nl input{{padding:10px 14px;font-size:.75rem}}.nl button{{padding:10px 18px;font-size:.75rem}}.bar{{padding:4px 10px;font-size:.58rem;gap:6px}}.bar .n{{font-size:.5rem}}.nb{{padding:7px 12px;font-size:.62rem}}.toast{{bottom:16px;left:16px;right:16px;transform:translateY(80px);text-align:center}}.toast.on{{transform:translateY(0)}}.ni{{bottom:12px;right:12px;padding:8px 12px;font-size:.55rem}}footer{{padding:24px 12px 12px;margin-top:24px}}.fi{{gap:14px}}.fi h4{{font-size:.72rem}}.fi p,.fi a{{font-size:.62rem}}.tg{{width:28px;height:28px;font-size:.8rem}}.ct{{padding:5px 10px;font-size:.68rem}}.cb{{width:18px;height:18px;font-size:.52rem}}.btl{{font-size:.95rem}}.ub{{padding:7px 16px;font-size:.7rem}}.gr{{grid-template-columns:1fr}}}}
@media(max-width:480px){{.bar{{font-size:.52rem;padding:3px 8px;gap:4px}}.bar span{{font-size:.52rem}}.hero{{padding:24px 10px 20px}}.hero h1{{font-size:clamp(1rem,6.5vw,1.2rem)}}.hero .t{{font-size:.68rem;margin-bottom:8px}}.hero .s span{{font-size:.58rem;padding:2px 8px}}.mc{{border-radius:12px}}.mi{{height:100px}}.mb{{padding:8px 10px 10px}}.mb h3{{font-size:.75rem}}.mb .d{{font-size:.58rem}}.pr{{font-size:.78rem}}.bt{{padding:4px 12px;font-size:.58rem}}.sec{{font-size:.9rem}}.inf{{grid-template-columns:1fr}}.rv{{grid-template-columns:1fr}}.hd{{padding:0 8px}}.lg img{{height:24px}}.lg div{{font-size:.7rem}}.lg div s{{font-size:.38rem}}.nv a{{padding:5px 8px;font-size:.62rem}}.cp{{width:100vw;right:-100vw}}.ap h2{{font-size:.85rem}}.ap h3{{font-size:.75rem}}.ap p{{font-size:.68rem}}.tb button{{padding:5px 12px;font-size:.58rem}}.ub2{{padding:8px 16px;font-size:.68rem}}}}
@media(max-width:360px){{.hero h1{{font-size:clamp(.9rem,7vw,1rem)}}.hero .s span{{font-size:.52rem;padding:2px 6px}}.mi{{height:85px}}.mb{{padding:6px 8px 8px}}.mb h3{{font-size:.68rem}}.mb .d{{font-size:.52rem}}.pr{{font-size:.68rem}}.bt{{padding:3px 10px;font-size:.52rem}}.tb button{{padding:4px 10px;font-size:.52rem}}.sec{{font-size:.78rem}}.sd{{font-size:.58rem}}}}
@media(max-height:500px) and (orientation:landscape){{.hero{{padding:18px 14px 14px}}.hero h1{{font-size:clamp(.9rem,3vw,1.1rem)}}.mi{{height:90px}}.hd{{height:48px}}header{{position:relative}}}}
</style>
</head>
<body>
<div class="bar"><span>\u2600\ufe0f 11h30\u201323h</span><span class="n">\U0001f319 Livraison 23h\u201306h</span><span>\u2b50 4.4 \u00b7 93320</span></div>
<header><div class="hd"><a href="#" class="lg"><img src="" alt="FAIS TON S'DALLE" id="logo"><div>FAIS TON S'DALLE<s>Sandwichs sur mesure</s></div></a><nav class="nv"><a class="sl" onclick="gp('acc')">Accueil</a><a onclick="gp('menu')">Menu</a><a onclick="gp('ap')">Infos</a><a onclick="gp('con')">Contact</a><button class="tg" onclick="tt()" id="tt">\U0001f319</button><div class="ct" onclick="tc()">\U0001f6d2<span class="cb" id="cc">0</span></div></nav></div></header>
<div class="nb" id="nb">\U0001f319 Livraison 23h\u201306h \u2013 <a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" style="color:#c7d2fe;text-decoration:underline">Uber Eats</a></div>

<div class="pg" id="acc">
<section class="hero"><div><h1>Cr\u00e9e ton <span class="h">sandwich</span> sur mesure</h1><p class="t">\U0001f969 Viandes froides \u00b7 \U0001f957 Crudit\u00e9s fra\u00eeches \u00b7 \U0001f9c2 Sauces</p><div class="s"><span><strong>\u2b50 4.4</strong> 14 avis</span><span><strong>\U0001f4cd</strong> Les Pavillons-sous-Bois</span><span><strong>\U0001f319</strong> Livraison 6h</span><span><strong>\U0001f69a</strong> Uber Eats</span></div></div></section>
<div class="w"><div class="sec">Notre <span class="hl">Menu</span></div><p class="sd">Chaque sandwich est pr\u00e9par\u00e9 \u00e0 la commande. Photos r\u00e9elles du commerce.</p>
<div class="tb"><button class="on" data-c="all">\U0001f525 Tout</button><button data-c="menus">\U0001f96a Sandwichs</button><button data-c="desserts">\U0001f370 Desserts</button><button data-c="boissons">\U0001f964 Boissons</button></div>
<div class="mg" id="mg"></div>
<div class="sec">Ils nous <span class="hl">adorent</span></div><div class="rv" id="rv"></div>
<div class="sec">Restons <span class="hl">connect\u00e9s</span></div>
<div class="nl"><h3>Ne rate aucune actu</h3><p>Re\u00e7ois les infos et offres exclusives.</p><form onsubmit="nl(event)"><input type="email" id="nlmail" placeholder="ton@email.fr" required><button type="submit">\u2192</button></form></div>
</div></div>

<div class="pg h" id="menu"><div class="w" style="padding-top:20px"><div class="sec">Notre <span class="hl">Carte</span></div><p class="sd">Personnalise ton sandwich. Photos r\u00e9elles du commerce.</p>
<div class="tb"><button class="on" data-c="all">\U0001f525 Tout</button><button data-c="menus">\U0001f96a Sandwichs</button><button data-c="desserts">\U0001f370 Desserts</button><button data-c="boissons">\U0001f964 Boissons</button></div>
<div class="mg" id="mg2"></div>
<div style="text-align:center;margin:24px 0"><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" class="ub2">\U0001f6f5 Commander sur Uber Eats</a></div></div></div>

<div class="pg h" id="ap"><div class="w"><div class="ap">
<div class="im"><img src="" alt="FAIS TON S'DALLE" id="about"></div>
<h2>\u00c0 propos</h2>
<p><strong>FAIS TON S'DALLE</strong> \u2013 Sp\u00e9cialiste du sandwich sur mesure \u00e0 <strong>Les Pavillons-sous-Bois</strong> (93320). Tu choisis ta viande froide, tes crudit\u00e9s fra\u00eeches et ta sauce.</p>
<div class="cd"><h3>Carte</h3><p><strong>Menu L\u00e9ger 6,90\u20ac</strong> \u2014 Sandwich (viande + crudit\u00e9s + sauce)</p><p><strong>Menu Classique 7,90\u20ac</strong> \u2014 Sandwich + boisson</p><p><strong>Menu Gourmand 9,90\u20ac</strong> \u2014 Sandwich + boisson + dessert</p><p><strong>Tiramisu maison 3,00\u20ac</strong></p><p><strong>Milkshake 5,00\u20ac</strong> \u2014 Cr\u00e9meux et rafra\u00eechissant</p></div>
<div class="cd"><h3>Horaires 7j/7</h3><p>\u2600\ufe0f Service : <strong>11h30\u201323h00</strong></p><p>\U0001f319 Livraison : <strong>23h00\u201306h00</strong></p></div>
<div class="cd"><h3>Coordonn\u00e9es</h3><p>134 All\u00e9e du Colonel Fabien, 93320</p><p>\U0001f4de <a href="tel:+33672044875" class="btl">06 72 04 48 75</a></p>
<p><a href="https://maps.google.com/maps?q=FAIS+TON+S%E2%80%99DALLE+134+All%C3%A9e+du+Colonel+Fabien+93320" target="_blank" style="color:var(--p);font-weight:600">\U0001f4cd Google Maps</a></p>
<p><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" class="ub" style="margin-top:6px">\U0001f6f5 Uber Eats</a></p></div>
<div style="text-align:center;margin:20px 0">
<div style="display:inline-block;background:var(--c);padding:10px;border-radius:10px;border:1px solid var(--b)">
<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130">
<rect width="130" height="130" fill="none"/>
<g fill="var(--t)" opacity=".85">
<rect x="10" y="10" width="26" height="26" rx="3"/>
<rect x="94" y="10" width="26" height="26" rx="3"/>
<rect x="10" y="94" width="26" height="26" rx="3"/>
<rect x="52" y="10" width="26" height="26" rx="3"/>
<rect x="40" y="42" width="13" height="13"/>
<rect x="77" y="42" width="13" height="13"/>
<rect x="64" y="66" width="13" height="13"/>
<rect x="40" y="78" width="13" height="13"/>
<rect x="94" y="54" width="13" height="13"/>
<rect x="90" y="94" width="26" height="26" rx="3"/>
<rect x="64" y="94" width="13" height="13"/>
<rect x="40" y="94" width="13" height="13"/>
<rect x="10" y="42" width="26" height="13"/>
<rect x="10" y="66" width="13" height="13"/>
<rect x="24" y="78" width="13" height="13"/>
<rect x="70" y="54" width="7" height="7"/>
<rect x="52" y="54" width="7" height="7"/>
<rect x="84" y="72" width="7" height="7"/>
<rect x="103" y="78" width="13" height="13"/>
<rect x="52" y="84" width="7" height="7"/>
<rect x="46" y="62" width="7" height="7"/>
</g>
<text x="65" y="124" text-anchor="middle" font-size="5" fill="var(--t2)" opacity=".5">https://faistonsdalle.fr</text>
</svg></div>
<p style="color:var(--t2);font-size:.62rem;margin-top:6px">Scannez pour voir le menu complet</p></div>
</div></div></div>

<div class="pg h" id="con"><div class="w" style="padding-top:20px">
<div class="sec">Nous <span class="hl">contacter</span></div>
<div class="inf"><div><div class="ic">\U0001f4cd</div><h4>Adresse</h4><p>134 All\u00e9e du Colonel Fabien<br>93320 Les Pavillons-sous-Bois</p><a href="https://maps.google.com/maps?q=FAIS+TON+S%E2%80%99DALLE+134+All%C3%A9e+du+Colonel+Fabien+93320" target="_blank" style="color:var(--p);font-weight:600;font-size:.68rem">Google Maps \u2192</a></div>
<div><div class="ic">\U0001f550</div><h4>Horaires 7j/7</h4><div class="hg"><div><span>\u2600\ufe0f Service</span><span>11h30\u201323h</span></div><div class="nt"><span>\U0001f319 Livraison</span><span>23h\u201306h</span></div></div><span class="hb">7j/7</span></div>
<div><div class="ic">\U0001f4de</div><h4>T\u00e9l\u00e9phone</h4><p><a href="tel:+33672044875" class="btl">06 72 04 48 75</a></p><p style="font-size:.65rem;color:var(--t2)">Appel ou SMS</p></div>
<div><div class="ic">\U0001f69a</div><h4>Commander</h4><p>Uber Eats \u00b7 T\u00e9l\u00e9phone</p><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" class="ub" style="margin-top:6px">\U0001f6f5 Uber Eats</a></div></div>
<div style="display:flex;gap:12px;justify-content:center;margin:16px 0;flex-wrap:wrap">
<a href="https://wa.me/33672044875" target="_blank" class="ub" style="background:#25D366">\U0001f4f1 Commander par WhatsApp</a>
<a href="javascript:void(0)" onclick="shareMenu()" class="ub" style="background:#666">\U0001f4e4 Partager le menu</a>
</div>
<div class="sec">Avis <span class="hl">clients</span></div><div class="rv" id="rv2"></div>
<div class="nl" style="margin-top:20px"><h3>Newsletter</h3><p>Re\u00e7ois les actualit\u00e9s et offres.</p><form onsubmit="nl(event)"><input type="email" placeholder="ton@email.fr" required><button type="submit">\u2192</button></form></div>
</div></div>

<div class="mod" id="mod"><div class="bx"><div class="hd"><h2 id="mt">Personnalise ton sandwich</h2><button class="cl" onclick="cm()">\u2715</button></div><div class="bd" id="mb"></div><div class="ft"><div class="tp" id="mp">0,00\u20ac</div><button class="ok" onclick="cf()">Ajouter \u2192</button></div></div></div>
<div class="co" id="co" onclick="tc()"></div>
<div class="cp" id="cp"><div class="hd"><div><h3>\U0001f6d2 Ton panier</h3></div><button style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--t2);padding:4px" onclick="tc()">\u2715</button></div><div class="its" id="ci"><div class="em">\U0001f96a Panier vide</div></div><div class="ft"><div class="tr"><span>Total</span><span class="ta" id="ct">0,00\u20ac</span></div><button class="ck" onclick="ck()">\U0001f6f5 Commander \u2013 <span id="c2">0,00\u20ac</span></button></div></div>
<div class="toast" id="toast">\u2705 <span id="tm"></span></div>
<div class="ni" id="ni"><span>\U0001f319</span><span>Livraison<br><strong>23h\u201306h</strong></span></div>

<footer><div class="fi"><div><h4>FAIS TON S'DALLE</h4><p>Sandwichs sur mesure. Service jour &amp; nuit, 7j/7.</p><p>\u2b50 4.4/5 \u2013 14 avis Google</p></div>
<div><h4>Contact</h4><p>\U0001f4de <a href="tel:+33672044875">06 72 04 48 75</a></p><p>\U0001f4cd 134 All\u00e9e du Colonel Fabien, 93320</p><p>\u2600\ufe0f 11h30\u201323h \u00b7 \U0001f319 23h\u201306h</p></div>
<div><h4>Suivez-nous</h4><a href="https://www.tiktok.com/@faistonsdalle" target="_blank">\U0001f3b5 TikTok</a><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank">\U0001f6f5 Uber Eats</a></div></div>
<div class="fb">\u00a9 2026 FAIS TON S'DALLE \u2013 Les Pavillons-sous-Bois 93320</div></footer>

<script>
var I={{l:"{logo}",a:"{{ia}}",b:"{{ib}}",c:"{{ic}}",d:"{{id}}",e:"{{ie}}",f:"{{if}}",g:"{{ig}}",h:"{{ih}}",i:"{{ii}}"}};
document.getElementById('logo').src=I.l;document.getElementById('about').src=I.l;
var M=[
{{id:'l',n:'Menu L\u00e9ger',c:'menus',p:6.9,d:'Sandwich (viande + crudit\u00e9s + sauce)',cs:1}},
{{id:'c',n:'Menu Classique',c:'menus',p:7.9,d:'Sandwich + boisson + crudit\u00e9s + sauce',cs:1}},
{{id:'g',n:'Menu Gourmand',c:'menus',p:9.9,d:'Sandwich + boisson + dessert + crudit\u00e9s + sauce',cs:1}},
{{id:'t',n:'Tiramisu Maison',c:'desserts',p:3,d:'Fait maison'}},
{{id:'m',n:'Milkshake',c:'desserts',p:5,d:'Cr\u00e9meux et rafra\u00eechissant'}},
{{id:'co',n:'Coca-Cola',c:'boissons',p:2}},{{id:'cz',n:'Coca Z\u00e9ro',c:'boissons',p:2}},{{id:'cc',n:'Coca Cherry',c:'boissons',p:2}},
{{id:'oa',n:'Oasis',c:'boissons',p:2}},{{id:'li',n:'Lipton',c:'boissons',p:2}},{{id:'or',n:'Orangina',c:'boissons',p:2}},
{{id:'ev',n:'Evian',c:'boissons',p:2}},{{id:'cr',n:'Cristaline',c:'boissons',p:1.5}},{{id:'sp',n:'San Pellegrino',c:'boissons',p:2}}
];
function gi(id){var x={l:I.a,c:I.b,g:I.c,t:I.d,m:I.d,co:I.e,cz:I.f,cc:I.g,oa:I.h,li:I.e,or:I.f,ev:I.g,cr:I.h,sp:I.i};return x[id]||I.i;}
function rm(g,el){var items=g=='all'?M:M.filter(function(x){return x.c===g});el.innerHTML=items.map(function(x){var ig=gi(x.id);return '<div class=\"mc\" onclick=\"'+(x.cs?"om('"+x.id+"')":"ai('"+x.id+"')")+'\"><div class=\"mi\" style=\"background-image:url('+ig+')\"></div><div class=\"mb\"><h3>'+x.n+'</h3><div class=\"d\">'+(x.d||'')+'</div><div class=\"mf\"><span class=\"pr\">'+x.p.toFixed(2)+'\u20ac</span><button class=\"bt\" onclick=\"event.stopPropagation();'+(x.cs?"om('"+x.id+"')":"ai('"+x.id+"')")+'\">+</button></div></div></div>';}).join('');}
['mg','mg2'].forEach(function(g){{var e=document.getElementById(g);if(e)rm('all',e)}});
document.querySelectorAll('.tb button').forEach(function(b){{b.addEventListener('click',function(){{var p=b.closest('.pg');p.querySelectorAll('.tb button').forEach(function(x){{x.classList.remove('on')}});b.classList.add('on');rm(b.dataset.c,p.id=='acc'?document.getElementById('mg'):document.getElementById('mg2'))}})}});
['rv','rv2'].forEach(function(g){{var e=document.getElementById(g);if(e)e.innerHTML=AV.map(function(r){{return '<div><div class=\"sr\">'+'\\u2b50'.repeat(r.s)+'</div><div class=\"tx\">\"'+r.t+'\"</div><div class=\"au\">- '+r.a+'</div></div>'}}).join('')}});
var AV=[{{s:5,t:'Les meilleurs sandwichs du 93 ! Personnalisation top.',a:'Sophie M.'}},{{s:5,t:'Service de nuit incroyable ! Sandwich frais \u00e0 3h du matin.',a:'Karim D.'}},{{s:4,t:'Le gourmand \u00e0 9,90\u20ac, qualit\u00e9-prix imbattable.',a:'L\u00e9a T.'}},{{s:4,t:'Large choix de sauces et crudit\u00e9s fra\u00eeches. Excellent !',a:'Alexandre P.'}}];
function gp(p){{document.querySelectorAll('.pg').forEach(function(x){{x.classList.add('h')}});document.getElementById(p).classList.remove('h');document.querySelectorAll('.nv a').forEach(function(x){{x.classList.remove('sl')}});var la={{acc:'Accueil',menu:'Menu',ap:'Infos',con:'Contact'}};Array.from(document.querySelectorAll('.nv a')).forEach(function(a){{if(a.textContent.trim()==la[p])a.classList.add('sl')}})}}
function nl(e){{e.preventDefault();var v=document.getElementById('nlmail')||e.target.querySelector('input');ts('\\ud83d\\udcec '+v.value+' inscrit !');v.value=''}}
var cart=JSON.parse(localStorage.getItem('c')||'[]'),ci=null,cs={{}};
function om(id){{var i=M.find(function(x){{return x.id===id}});if(!i||!i.cs)return;ci=i;cs={{}};
document.getElementById('mt').textContent='\\ud83e\\udd6a '+i.n;
document.getElementById('mb').innerHTML='<div class=\"cs\"><h4>\\ud83e\\udd69 Viande</h4><div class=\"og\">'+['Jambon blanc','Jambon fum\u00e9','Poulet r\u00f4ti','Dinde','Salami','Pastrami','Rosbif','Thon'].map(function(v){{return '<button onclick=\"sel(\\'v\\',\\''+v+'\\',this)\">'+v+'</button>'}}).join('')+'</div></div><div class=\"cs\"><h4>\\ud83e\\udd57 Crudit\u00e9s (plusieurs)</h4><div class=\"og\">'+['Salade','Tomates','Concombre','Oignons','Poivrons','Ma\u00efs','Carottes','Cornichons'].map(function(v){{return '<button onclick=\"sel(\\'r\\',\\''+v+'\\',this)\">'+v+'</button>'}}).join('')+'</div></div><div class=\"cs\"><h4>\\ud83e\\uddc2 Sauce</h4><div class=\"og\">'+['Mayo','Ketchup','Moutarde','Blanche','Alg\u00e9rienne','Andalouse','Samoura\u00ef','Huile olive'].map(function(v){{return '<button onclick=\"sel(\\'s\\',\\''+v+'\\',this)\">'+v+'</button>'}}).join('')+'</div></div>';
document.getElementById('mp').textContent=i.p.toFixed(2)+'\u20ac';document.getElementById('mod').classList.add('on');document.body.style.overflow='hidden'}}
function sel(k,v,el){{if(k=='r'){{el.classList.toggle('sel');cs[k]=[].map.call(el.parentNode.querySelectorAll('.sel'),function(b){{return b.textContent}})}}else{{el.parentNode.querySelectorAll('button').forEach(function(b){{b.classList.remove('sel')}});el.classList.add('sel');cs[k]=v}}}}
function cm(){{document.getElementById('mod').classList.remove('on');document.body.style.overflow='';ci=null;cs={{}}}}
function cf(){{if(!ci||!cs.v||!cs.s)return;var t='\\ud83e\\udd69 '+cs.v+' . \\ud83e\\udd57 '+(cs.r||['\\u2014']).join(', ')+' . \\ud83e\\uddc2 '+cs.s;var idx=cart.findIndex(function(i){{return i.id===ci.id&&i.cu===t}});if(idx>-1)cart[idx].q+=1;else cart.push({{id:ci.id,n:ci.n,p:ci.p,cu:t,q:1}});cm();sv();ts('\\ud83e\\udd6a '+ci.n+' ajout\u00e9 !')}}
document.getElementById('mod').addEventListener('click',function(e){{if(e.target===this)cm()}});
function ai(id){{var i=M.find(function(x){{return x.id===id}});if(!i)return;var idx=cart.findIndex(function(x){{return x.id===id&&!x.cu}});if(idx>-1)cart[idx].q+=1;else cart.push({{id:i.id,n:i.n,p:i.p,cu:null,q:1}});sv();ts('\\ud83c\\udf7d\\ufe0f '+i.n+' ajout\u00e9 !')}}
function sv(){{localStorage.setItem('c',JSON.stringify(cart));uc()}}
function uc(){{var n=cart.reduce(function(s,i){{return s+i.q}},0),t=cart.reduce(function(s,i){{return s+i.p*i.q}},0);document.getElementById('cc').textContent=n;document.getElementById('ct').textContent=t.toFixed(2)+'\u20ac';document.getElementById('c2').textContent=t.toFixed(2)+'\u20ac';var c=document.getElementById('ci');if(!cart.length){{c.innerHTML='<div class=\"em\">\\ud83e\\udd6a Panier vide</div>';return}}c.innerHTML=cart.map(function(i,idx){{return '<div class=\"ci\"><div class=\"if\"><h4>'+i.n+'</h4>'+(i.cu?'<div class=\"cu\">'+i.cu+'</div>':'')+'</div><div class=\"ac\"><button class=\"q\" onclick=\"cq('+idx+',-1)\">\\u2212</button><span class=\"n\">'+i.q+'</span><button class=\"q\" onclick=\"cq('+idx+',1)\">+</button><span class=\"it\">'+(i.p*i.q).toFixed(2)+'\u20ac</span></div></div>'}}).join('')}}
function cq(idx,d){{cart[idx].q+=d;if(cart[idx].q<=0)cart.splice(idx,1);sv()}}
function tc(){{document.getElementById('co').classList.toggle('on');document.getElementById('cp').classList.toggle('on');document.body.style.overflow=document.getElementById('co').classList.contains('on')?'hidden':''}}
function ck(){{if(!cart.length)return;var t=cart.reduce(function(s,i){{return s+i.p*i.q}},0),its=cart.map(function(i){{return '* '+i.q+'x '+i.n+(i.cu?' ('+i.cu.substring(0,20)+'...)':'')+' - '+(i.p*i.q).toFixed(2)+'\u20ac'}}).join('\\\\n');if(confirm('Commande :\\\\n'+its+'\\\\n\\\\nTotal : '+t.toFixed(2)+'\u20ac\\\\n\\\\nAppeler le 06 72 04 48 75 ?')){{window.location.href='tel:+33672044875';cart=[];sv();tc();ts('\\ud83d\\udcde Commande transmise !')}}}}
function ts(m){{var t=document.getElementById('toast');t.classList.add('on');document.getElementById('tm').textContent=m;setTimeout(function(){{t.classList.remove('on')}},2500)}}
document.addEventListener('keydown',function(e){{if(e.key==='Escape'){{if(document.getElementById('mod').classList.contains('on'))cm();else if(document.getElementById('cp').classList.contains('on'))tc()}}}});
function shareMenu(){{if(navigator.share){{navigator.share({{title:"FAIS TON S'DALLE",text:"\\ud83e\\udd6a Cr\\u00e9e ton sandwich sur mesure ! Livraison jusqu'\\u00e0 6h !",url:"https://faistonsdalle.fr"}}).catch(function(){{}})}}else{{prompt("Copie ce lien :","https://faistonsdalle.fr")}}}}
uc();
(function(){{var h=new Date().getHours(),n=(h>=23||h<6);document.getElementById('nb').style.display=n?'block':'none';document.getElementById('ni').style.display=n?'flex':'none'}})();
window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(e){{if(!localStorage.getItem('t')){{document.documentElement.dataset.theme=e.matches?'dark':'light';document.getElementById('tt').textContent=e.matches?'\\u2600\\ufe0f':'\\ud83c\\udf19'}}}});
setInterval(function(){{var h=new Date().getHours();document.getElementById('nb').style.display=(h>=23||h<6)?'block':'none';document.getElementById('ni').style.display=(h>=23||h<6)?'flex':'none'}},60000);
var st=localStorage.getItem('t')||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.dataset.theme=st;document.getElementById('tt').textContent=st==='dark'?'\\u2600\\ufe0f':'\\ud83c\\udf19';
function tt(){{var t=document.documentElement.dataset.theme,n=t==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem('t',n);document.getElementById('tt').textContent=n==='dark'?'\\u2600\\ufe0f':'\\ud83c\\udf19'}}
</script>
</body>
</html>'''

# Substitute images
html = html.replace('{logo}', logo)
html = html.replace('{{ia}}', I_a)
html = html.replace('{{ib}}', I_b)
html = html.replace('{{ic}}', I_c)
html = html.replace('{{id}}', I_d)
html = html.replace('{{ie}}', I_e)
html = html.replace('{{if}}', I_f)
html = html.replace('{{ig}}', I_g)
html = html.replace('{{ih}}', I_h)
html = html.replace('{{ii}}', I_i)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

size = os.path.getsize('index.html')
print(f'\nDone! index.html: {size} bytes ({size/1024:.1f}KB)')
print(f'Images total: ~{sum(len(x) for x in [logo,I_a,I_b,I_c,I_d,I_e,I_f,I_g,I_h,I_i])//1024}KB')
