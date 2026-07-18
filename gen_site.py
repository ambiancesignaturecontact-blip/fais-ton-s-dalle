#!/usr/bin/env python3
"""Generate COMPLETE index.html for FAIS TON S'DALLE - ALL INLINE"""
import json

ITEMS = [
    {"id":"l","n":"Menu L\u00e9ger","c":"menus","p":6.9,"d":"Sandwich (viande + crudit\u00e9s + sauce)","cs":1,"pop":1},
    {"id":"c","n":"Menu Classique","c":"menus","p":7.9,"d":"Sandwich + boisson","cs":1,"pop":1},
    {"id":"g","n":"Menu Gourmand","c":"menus","p":9.9,"d":"Sandwich + boisson + dessert","cs":1,"pop":1},
    {"id":"t","n":"Tiramisu","c":"desserts","p":3,"d":"Fait maison","cs":2},
    {"id":"m","n":"Milkshake","c":"desserts","p":5,"d":"Personnalisable","cs":3},
    {"id":"co","n":"Coca-Cola","c":"boissons","p":1},
    {"id":"cz","n":"Coca Z\u00e9ro","c":"boissons","p":1},
    {"id":"pe","n":"Pepsi","c":"boissons","p":1},
    {"id":"oa","n":"Oasis Tropical","c":"boissons","p":1},
    {"id":"li","n":"Ice Tea","c":"boissons","p":1},
    {"id":"or","n":"Orangina","c":"boissons","p":1},
    {"id":"cr","n":"Cristaline","c":"boissons","p":1},
    {"id":"sp","n":"San Pellegrino","c":"boissons","p":1},
]

IMGS = {
    'l':'/images/menu-leger.jpg','c':'/images/menu-classique.jpg','g':'/images/menu-gourmand.jpg',
    't':'/images/tiramisu.jpg','m':'/images/milkshake.png',
    'co':'/images/coca.jpg','cz':'/images/zero.jpg','pe':'/images/pepsi.jpg',
    'oa':'/images/oasis.jpg','li':'/images/icetea.jpg','or':'/images/orangina.jpg',
    'cr':'/images/cristaline.jpg','sp':'/images/sanpellegrino.jpg',
}

def esc(s):
    return s.replace('\\','\\\\').replace("'","\\'").replace('"','\\"')

# Generate HTML
parts = []
A = parts.append

A('<!DOCTYPE html>')
A('<html lang="fr" data-theme="light">')
A('<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">')
A('<title>FAIS TON S\'DALLE \u2014 Sandwichs sur mesure Halal | Les Pavillons-sous-Bois 93320</title>')
A('<meta name="description" content="Cr\u00e9e ton sandwich sur mesure chez FAIS TON S\'DALLE. Halal. Tenders, poulet, dinde, pastrami, rosette, thon. Livraison 23h-06h. Paiement Stripe.">')
A('<meta name="robots" content="index,follow">')
A('<link rel="canonical" href="https://faistonsdalle.com">')
A('<meta property="og:type" content="restaurant.menu"><meta property="og:site_name" content="FAIS TON S\'DALLE">')
A('<meta property="og:locale" content="fr_FR"><meta property="og:url" content="https://faistonsdalle.com">')
A('<meta property="og:title" content="FAIS TON S\'DALLE"><meta property="og:image" content="https://faistonsdalle.com/images/logo.jpg">')
A('<meta name="theme-color" content="#c73b2b">')
A('<link rel="manifest" href="/manifest.json">')
A('<link rel="icon" type="image/jpeg" sizes="48x48" href="/images/favicon.jpg">')
A('<link rel="apple-touch-icon" sizes="180x180" href="/images/apple-icon.jpg">')
A('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>')
A('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">')
A('<script src="https://js.stripe.com/v3/"></script>')
A('</head><body>')

# === BAR ===
A('<div class="bar"><span>\u2600\ufe0f 11h30\u201323h</span><span class="n">\U0001f319 Livraison 23h\u201306h</span><span class="h-badge">\U0001f54c Halal</span><span>\u2b50 4.5</span></div>')

# === HEADER ===
A('<header><div class="hd"><a href="#" class="lg"><img src="/images/logo.jpg" alt="FAIS TON S\'DALLE" id="logo"><div class="br">FAIS TON S\'DALLE<span class="sub">Sandwichs sur mesure</span></div></a>')
A('<nav class="nv"><a class="sl" id="na-acc">Accueil</a><a id="na-menu">Menu</a><a id="na-ap">Infos</a><a id="na-con">Contact</a>')
A('<button class="ham" id="ham">\u2630</button><button class="tg" id="tt">\U0001f319</button><div class="ct" id="ct">\U0001f6d2<span class="cb" id="cc">0</span></div></nav></div></header>')
A('<div class="mn" id="mn"></div>')
A('<div class="nb" id="nb">\U0001f319 Livraison 23h-06h</div>')

# === HERO ===
A('<div class="hero"><div class="hero-c"><div class="hero-badge">\u2b50 4.5 \u00b7 Halal \u00b7 Livraison 23h-06h</div>')
A('<h1>Cr\u00e9e ton <span class="h">sandwich</span> sur mesure</h1>')
A('<p class="hero-p">\U0001f969 Tenders \u00b7 poulet \u00b7 dinde \u00b7 pastrami \u00b7 thon \u00b7 8 crudit\u00e9s \u00b7 9 sauces</p>')
A('<div class="hero-acts"><a class="hero-btn">Voir le menu</a><a class="hero-btn2">\U0001f4f1 WhatsApp</a></div></div>')
A('<div class="hero-particles"><div class="hero-particle">\U0001f96a</div><div class="hero-particle">\U0001f969</div><div class="hero-particle">\U0001f957</div><div class="hero-particle">\U0001f964</div></div></div>')

# Generate item cards HTML
def gen_item_card(item):
    badge = '<span class="pop-badge">Populaire</span>' if item.get('pop') and item.get('c')!='boissons' else ''
    img = IMGS.get(item['id'], '/images/coca.jpg')
    return f'<div class="crd" data-id="{item["id"]}"><div class="crd-img" style="background-image:url({img})" loading="lazy">{badge}</div><div class="crd-body"><h3>{item["n"]}</h3><div class="crd-desc">{item.get("d","")}</div><div class="crd-ft"><span class="crd-pr">{item["p"]:.2f}\u20ac</span><button class="add-btn">+</button></div></div></div>'

all_items = ''.join(gen_item_card(it) for it in ITEMS)

reviews_html = ''.join(
    f'<div class="rv-card"><div class="rv-stars">\u2605\u2605\u2605\u2605\u2605</div><div class="rv-txt">"{r["txt"]}"</div><div class="rv-auth">{r["auth"]}</div></div>'
    for r in [{"txt":"Les meilleurs sandwichs du 93 ! Toujours frais et bien garnis.","auth":"Sophie M."},
              {"txt":"Service rapide m\u00eame tard, les tenders sont incroyables !","auth":"Karim L."},
              {"txt":"Enfin un vrai fast-food halal de qualit\u00e9 pr\u00e8s de chez moi.","auth":"Fatima Z."},
              {"txt":"Le milkshake Snickers est une tuerie !","auth":"Alex D."}]
)

# === PAGE ACCUEIL ===
A(f'<div class="pg" id="acc"><div class="w"><div class="sec"><span class="hl">Menu</span></div>')
A('<div class="tabs"><button class="on" data-c="all">Tout</button><button data-c="menus">Sandwichs</button><button data-c="desserts">Desserts</button><button data-c="boissons">Boissons</button></div>')
A(f'<div class="grid" id="mg">{all_items}</div>')
A(f'<div class="sec"><span class="hl">Avis</span></div><div class="rv" id="rv">{reviews_html}</div>')
A('<div style="text-align:center;margin:0 0 24px"><a href="https://share.google/ohtsRFBl72o22DEi4" target="_blank" rel="noopener" class="ub" style="background:var(--p)">\u2b50 Laisser un avis Google</a></div>')
A('<div class="nl"><h3>Newsletter</h3><p>Promos et nouveaut\u00e9s.</p><form id="nl1"><input type="email" id="nlmail" placeholder="ton@email.fr" required><button type="submit">\u2192</button></form></div></div></div>')

# === PAGE MENU ===
A(f'<div class="pg h" id="menu"><div class="w"><div class="sec"><span class="hl">Carte</span></div>')
A('<div class="tabs"><button class="on" data-c="all">Tout</button><button data-c="menus">Sandwichs</button><button data-c="desserts">Desserts</button><button data-c="boissons">Boissons</button></div>')
A(f'<div class="grid" id="mg2">{all_items}</div>')
A('<div style="text-align:center;margin:24px 0"><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" rel="noopener" class="ub2">Uber Eats</a></div></div></div>')

# === PAGE INFOS ===
A('<div class="pg h" id="ap"><div class="w"><div class="ap">')
A('<img src="/images/store-front.jpeg" alt="FAIS TON S\'DALLE" id="about" class="store-img">')
A('<p style="font-size:.7rem;color:var(--t2)">134 All\u00e9e du Colonel Fabien, 93320 Les Pavillons-sous-Bois</p>')
A('<p><strong>FAIS TON S\'DALLE</strong> \u2013 Sandwichs sur mesure <strong>Halal</strong>.</p>')
A('<div class="ap-gallery"><img src="/images/google-photo-1.jpeg" alt="" loading="lazy"><img src="/images/google-photo-2.jpeg" alt="" loading="lazy"><img src="/images/google-photo-3.jpeg" alt="" loading="lazy"><img src="/images/google-photo-4.jpeg" alt="" loading="lazy"></div>')
A('<div class="cd"><h3>Viandes</h3><p>Tenders, Eminc\u00e9 de poulet, Blanc de dinde, Jambon de dinde, Pastrami, Rosette, Thon</p></div>')
A('<div class="cd"><h3>Crudit\u00e9s & Suppl\u00e9ments</h3><p>Salade, Tomate, Concombre, Oignons, Poivrons, Ma\u00efs, Carottes, Avocat \u00b7 Cheddar, Mozzarella, Feta</p></div>')
A('<div class="cd"><h3>Sauces</h3><p>Mayo, Ketchup, Alg\u00e9rienne, Samoura\u00ef, Blanche, Moutarde, Brasil, Chili, Thai</p></div>')
A('<div class="cd"><h3>Contact</h3><p>134 All\u00e9e du Colonel Fabien, 93320</p><p>\U0001f4de 06 72 04 48 75</p></div>')
A('</div></div></div>')

# === PAGE CONTACT ===
A('<div class="pg h" id="con"><div class="w"><div class="sec"><span class="hl">Commander</span></div>')
A('<div class="cmd-mode"><div class="cmd-toggle"><button class="on" id="mode-livraison">Livraison</button><button id="mode-emporter">\u00c0 emporter</button></div></div>')
A('<div class="cmd-addr" id="cmd-addr"><input type="text" id="cmd-address" placeholder="Adresse de livraison" class="mod-ta"></div>')
A('<div class="inf"><div><h3>Adresse</h3><p>134 All\u00e9e du Colonel Fabien, 93320</p></div><div><h3>Horaires</h3><p>11h30-23h / Livraison 23h-06h</p></div></div>')
A('<div style="display:flex;gap:12px;margin:16px 0;flex-wrap:wrap"><a class="ub" style="background:#25D366" id="wa-btn">WhatsApp</a><a href="https://share.google/ohtsRFBl72o22DEi4" target="_blank" class="ub" style="background:var(--p)">Avis Google</a></div>')
A(f'<div class="rv" id="rv2">{reviews_html}</div>')
A('<div class="nl"><h3>Newsletter</h3><form id="nl2"><input type="email" placeholder="ton@email.fr" required><button type="submit">\u2192</button></form></div></div></div>')

# === MODALS ===
A('<div class="mod" id="mod"><div class="mod-bx"><div class="mod-hd"><h2>Personnalise</h2><button class="mod-cl">\u2715</button></div><div class="mod-bd" id="mb"></div><div class="mod-inst"><textarea id="mi" class="mod-ta" placeholder="Instructions..." rows="2"></textarea></div><div class="mod-ft"><div class="mod-pr" id="mp"></div><button class="mod-ok">Ajouter</button></div></div></div>')
A('<div class="mod" id="mod-t"><div class="mod-bx"><div class="mod-hd"><h2>Tiramisu</h2><button class="mod-cl">\u2715</button></div><div class="mod-bd" id="mb-t"></div><div class="mod-ft"><div class="mod-pr">3,00\u20ac</div><button class="mod-ok">Ajouter</button></div></div></div>')
A('<div class="mod" id="mod-m"><div class="mod-bx"><div class="mod-hd"><h2>Milkshake</h2><button class="mod-cl">\u2715</button></div><div class="mod-bd" id="mb-m"></div><div class="mod-inst"><textarea id="mi-m" class="mod-ta" placeholder="Extra..." rows="2"></textarea></div><div class="mod-ft"><div class="mod-pr">5,00\u20ac</div><button class="mod-ok">Ajouter</button></div></div></div>')
A('<div class="mod" id="mod-pay"><div class="mod-bx"><div class="mod-hd"><h2>Paiement</h2><button class="mod-cl">\u2715</button></div><div class="mod-bd"><div style="text-align:center;padding:20px 0"><div style="font-size:2.5rem">\U0001f512</div><h3>Paiement s\u00e9curis\u00e9 Stripe</h3><p id="pay-total" style="font-size:1.2rem;font-weight:700;color:var(--p)">0,00\u20ac</p><input type="text" id="pay-name" placeholder="Votre nom" class="mod-ta" style="margin:8px 0;width:100%"><button id="pay-btn" class="mod-ok" style="width:100%">Payer</button></div></div></div></div>')

# === CART ===
A('<div class="co" id="co"></div>')
A('<div class="cp" id="cp"><div class="cp-hd"><h3>Panier</h3><span id="cp-mode"></span><button class="cp-x">\u2715</button></div>')
A('<div class="cp-its" id="ci"><div class="cp-em">Panier vide</div></div>')
A('<div class="cp-ft"><div class="cp-tr"><span>Total</span><span class="cp-ta" id="ct">0,00\u20ac</span></div><button class="cp-ck">Payer <span id="c2"></span></button></div></div>')

A('<div class="toast" id="toast"><span id="tm"></span></div>')
A('<div class="ni" id="ni">Livraison 23h-06h</div>')
A('<button id="top-btn">\u2191</button>')

# === FOOTER ===
A('<footer><div class="fi"><div><h4>FAIS TON S\'DALLE</h4><p>Sandwichs Halal 7j/7</p></div>')
A('<div><h4>Infos</h4><a href="/mentions-legales.html">Mentions l\u00e9gales</a><a href="/cgv.html">CGV</a></div></div>')
A('<div class="fb">\u00a9 2026 FAIS TON S\'DALLE</div></footer>')

# ================================================================
# CSS
# ================================================================
A('''<style>
:root{--p:#c73b2b;--p2:#a52a1c;--s:#f5a623;--bg:#f8f6f3;--c:#fff;--t:#1a1a1a;--t2:#6b6b6b;--b:#e8e2db;--r:16px;--f:"Inter","Segoe UI",sans-serif;--sh:0 2px 16px rgba(0,0,0,.06);--sh2:0 8px 30px rgba(0,0,0,.1)}
[data-theme="dark"]{--bg:#121212;--c:#1a1a1a;--t:#eee;--t2:#999;--b:#2a2a2a}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;transition:background-color .25s,border-color .25s,color .25s}
html{scroll-behavior:smooth}
body{font-family:var(--f);background:var(--bg);color:var(--t);overflow-x:hidden;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block;height:auto}
a{color:inherit;text-decoration:none}
button,input,textarea{font-family:var(--f);cursor:pointer}
.bar{background:#1a1a1a;color:#fff;padding:5px 14px;font-size:.65rem;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap}
.pg{display:block;animation:fadeIn .25s ease}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.pg.h{display:none}
header{background:rgba(255,255,255,.95);backdrop-filter:blur(20px);position:sticky;top:0;z-index:100;border-bottom:1px solid var(--b)}
[data-theme="dark"] header{background:rgba(26,26,26,.95)!important;border-bottom-color:#2a2a2a}
.hd{max-width:1100px;margin:0 auto;padding:0 16px;display:flex;align-items:center;justify-content:space-between;height:56px}
.lg{display:flex;align-items:center;gap:10px}
.lg img{height:30px;width:auto;border-radius:4px}
.br{font-weight:700;font-size:.85rem;color:#1a1a1a;line-height:1.2}
.br .sub{display:block;font-weight:500;font-size:.42rem;letter-spacing:1.2px;text-transform:uppercase;color:#1a1a1a;opacity:.5}
[data-theme="dark"] .br{color:#eee!important}[data-theme="dark"] .br .sub{color:#eee!important}
.nv{display:flex;gap:2px;align-items:center}
.nv a{padding:8px 14px;border-radius:30px;font-size:.72rem;font-weight:600;color:var(--t2);cursor:pointer;min-height:44px;display:flex;align-items:center;position:relative;transition:all .2s}
.nv a:hover{background:var(--bg);color:var(--p)}
.nv a.sl{background:var(--p);color:#fff}
.tg{background:none;border:1.5px solid var(--b);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.85rem;color:var(--t2);min-width:44px;min-height:44px}
.tg:hover{border-color:var(--s);transform:rotate(15deg)}
.ct{padding:7px 12px;border-radius:30px;display:flex;align-items:center;gap:5px;font-weight:700;font-size:.72rem;cursor:pointer;border:1.5px solid var(--b);background:var(--c);min-height:44px}
.ct:hover{border-color:var(--p)}
.cb{background:var(--p);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.58rem;font-weight:700;box-shadow:0 0 8px rgba(199,59,43,.3)}
.ct:hover .cb{transform:scale(1.2)}
.ham{display:none;background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--t2);min-width:44px;min-height:44px;align-items:center;justify-content:center}
.ham:hover{color:var(--p)}
.mn{display:none;position:fixed;top:56px;left:0;right:0;background:var(--c);z-index:99;flex-direction:column;padding:8px 0;box-shadow:0 8px 30px rgba(0,0,0,.1);border-bottom:1px solid var(--b)}
.mn.on{display:flex}
.mn a{padding:14px 20px;font-weight:600;font-size:.82rem;color:var(--t2);border-bottom:1px solid var(--b);cursor:pointer}
.mn a:hover{background:var(--bg);color:var(--p)}
[data-theme="dark"] .mn{background:#1a1a1a;border-bottom-color:#2a2a2a}[data-theme="dark"] .mn a{color:#bbb}
.hero{background:linear-gradient(135deg,#1a1a1a,#2d2d2d);color:#fff;padding:48px 16px 40px;text-align:center;position:relative;overflow:hidden}
.hero-c{position:relative;max-width:620px;margin:0 auto;z-index:1}
.hero-badge{display:inline-block;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);padding:5px 16px;border-radius:30px;font-size:.6rem;margin-bottom:14px}
.hero h1{font-size:clamp(1.5rem,5vw,2.4rem);font-weight:900;margin-bottom:8px;letter-spacing:-.5px}
.hero h1 .h{background:linear-gradient(135deg,var(--s),#fbc96a);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero-p{font-size:.78rem;opacity:.75;margin-bottom:22px}
.hero-acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.hero-btn{background:var(--p);color:#fff;padding:11px 28px;border-radius:30px;font-weight:700;font-size:.78rem;cursor:pointer;box-shadow:0 4px 14px rgba(199,59,43,.25);transition:all .25s}
.hero-btn:hover{transform:translateY(-2px)}
.hero-btn2{background:rgba(255,255,255,.1);color:#fff;padding:11px 28px;border-radius:30px;font-weight:600;font-size:.78rem;cursor:pointer;border:1px solid rgba(255,255,255,.1);transition:all .25s}
.hero-btn2:hover{background:rgba(255,255,255,.15);transform:translateY(-2px)}
.hero-particles{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0}
.hero-particle{position:absolute;font-size:clamp(1rem,3vw,1.8rem);opacity:0;bottom:-30px;animation:floatUp 8s ease-in-out infinite}
.hero-particle:nth-child(1){left:5%;animation-delay:0s;animation-duration:9s}
.hero-particle:nth-child(2){left:25%;animation-delay:2s;animation-duration:11s}
.hero-particle:nth-child(3){left:50%;animation-delay:4s;animation-duration:8s}
.hero-particle:nth-child(4){left:78%;animation-delay:1s;animation-duration:10s}
@keyframes floatUp{0%{opacity:0;transform:translateY(60px) rotate(0deg)}10%{opacity:.6}90%{opacity:.4}100%{opacity:0;transform:translateY(-250px) rotate(360deg)}}
.nb{background:linear-gradient(135deg,#1e1b4b,#312e81);padding:7px 14px;text-align:center;font-size:.65rem;color:#c7d2fe;display:none}
.w{max-width:1100px;margin:0 auto;padding:0 16px}
.sec{font-size:1.15rem;font-weight:700;margin:28px 0 4px;letter-spacing:-.2px}
.hl{color:var(--p)}
.tabs{display:flex;gap:6px;overflow-x:auto;padding:2px 0 16px;scrollbar-width:none}
.tabs button{padding:8px 20px;border-radius:30px;border:1.5px solid var(--b);background:var(--c);font-weight:600;font-size:.68rem;cursor:pointer;white-space:nowrap;color:var(--t2);flex-shrink:0}
.tabs button:hover{border-color:var(--s);color:var(--t)}
.tabs button.on{background:var(--p);color:#fff;border-color:var(--p)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;margin-bottom:28px}
.crd{background:var(--c);border-radius:var(--r);overflow:hidden;border:1px solid var(--b);cursor:pointer;transition:all .3s ease;box-shadow:var(--sh);animation:cardIn .4s ease both}
.crd:nth-child(2){animation-delay:.05s}.crd:nth-child(3){animation-delay:.1s}.crd:nth-child(4){animation-delay:.15s}.crd:nth-child(5){animation-delay:.2s}.crd:nth-child(6){animation-delay:.25s}.crd:nth-child(7){animation-delay:.3s}.crd:nth-child(8){animation-delay:.35s}.crd:nth-child(9){animation-delay:.4s}.crd:nth-child(10){animation-delay:.45s}.crd:nth-child(11){animation-delay:.5s}.crd:nth-child(12){animation-delay:.55s}.crd:nth-child(13){animation-delay:.6s}
@keyframes cardIn{from{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.crd:hover{transform:translateY(-4px);box-shadow:var(--sh2);border-color:rgba(199,59,43,.2)}
.crd-img{width:100%;height:190px;background-size:cover;background-position:center;background-color:var(--b);position:relative}
.pop-badge{position:absolute;top:8px;left:8px;background:var(--s);color:#fff;padding:3px 10px;border-radius:30px;font-size:.5rem;font-weight:700;z-index:2}
.crd-body{padding:14px 16px 16px}.crd-body h3{font-size:.9rem;font-weight:700;margin-bottom:3px;color:var(--t)}
.crd-desc{color:var(--t2);font-size:.66rem;margin-bottom:10px}
.crd-ft{display:flex;align-items:center;justify-content:space-between}
.crd-pr{font-weight:800;font-size:1.05rem;color:var(--p)}
.add-btn{background:var(--p);color:#fff;border:none;width:36px;height:36px;border-radius:50%;font-size:1.3rem;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(199,59,43,.2)}
.add-btn:hover{background:var(--p2);transform:scale(1.12)}
.rv{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:28px}
.rv-card{background:var(--c);border-radius:var(--r);padding:16px;border:1px solid var(--b);box-shadow:var(--sh)}
.rv-stars{color:#f5a623;font-size:.82rem;margin-bottom:4px}
.rv-txt{font-size:.7rem;color:var(--t2);font-style:italic}
.rv-auth{font-size:.65rem;font-weight:600}
.ap{max-width:680px;margin:0 auto;padding:20px 0}
.cd{background:var(--c);border-radius:var(--r);padding:18px 22px;margin:14px 0;border:1px solid var(--b)}
.store-img{width:100%;max-height:200px;object-fit:cover;border-radius:var(--r);margin:0 auto 16px}
.ap-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:16px 0}
.ap-gallery img{width:100%;height:100px;object-fit:cover;border-radius:var(--r);border:1px solid var(--b)}
.inf{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:28px 0}
.inf div{background:var(--c);padding:16px;border-radius:var(--r);border:1px solid var(--b)}
.cmd-toggle{display:flex;gap:8px;background:var(--b);border-radius:var(--r);padding:4px;max-width:360px}
.cmd-toggle button{flex:1;padding:10px 16px;border:none;border-radius:12px;background:transparent;font-weight:600;font-size:.78rem;color:var(--t2);cursor:pointer}
.cmd-toggle button.on{background:var(--p);color:#fff}
.cmd-addr{margin-bottom:16px;max-width:480px}
.mod-ta{width:100%;padding:10px 14px;border:1.5px solid var(--b);border-radius:12px;font-size:.72rem;font-family:var(--f);color:var(--t);background:var(--c);resize:none;outline:none}
.mod-ta:focus{border-color:var(--p)}
.ub{background:#06c;color:#fff;padding:9px 20px;border-radius:30px;font-weight:700;font-size:.72rem;display:inline-block;cursor:pointer;border:none}
.ub:hover{transform:translateY(-1px)}
.ub2{background:var(--p);color:#fff;padding:12px 28px;border-radius:30px;font-weight:700;font-size:.8rem;display:inline-block;cursor:pointer}
.ub2:hover{transform:translateY(-2px)}
.nl{background:linear-gradient(135deg,var(--p),#8a2216);border-radius:var(--r);padding:24px;color:#fff;text-align:center;margin-bottom:28px}
.nl h3{font-size:.95rem;font-weight:700;margin-bottom:3px}
.nl p{opacity:.8;font-size:.72rem;margin-bottom:12px}
.nl form{display:flex;gap:6px;max-width:300px;margin:0 auto}
.nl input{flex:1;padding:11px 16px;border-radius:30px;border:none;font-size:.75rem;outline:none}
.nl button{padding:11px 22px;background:#fff;color:var(--p);border:none;border-radius:30px;font-weight:700;font-size:.75rem;cursor:pointer}
.mod{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);z-index:200;align-items:center;justify-content:center;padding:14px}
.mod.on{display:flex}.mod-bx{background:var(--c);border-radius:var(--r);max-width:460px;width:100%;max-height:90vh;overflow-y:auto}
.mod-hd{padding:16px 20px 12px;border-bottom:1px solid var(--b);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--c);z-index:1}
.mod-hd h2{font-size:.82rem;font-weight:700}
.mod-cl{background:var(--b);border:none;width:28px;height:28px;border-radius:50%;font-size:.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--t2)}
.mod-cl:hover{background:var(--p);color:#fff}
.mod-bd{padding:14px 20px 10px}.mod-inst{padding:4px 20px 14px}
.mod-ft{padding:12px 20px 14px;border-top:1px solid var(--b);display:flex;justify-content:space-between;align-items:center;background:var(--c)}
.mod-ok{background:var(--p);color:#fff;border:none;padding:9px 24px;border-radius:30px;font-weight:700;font-size:.74rem;cursor:pointer}
.mod-ok:hover{background:var(--p2)}
.co{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);z-index:300}.co.on{display:block}
.cp{position:fixed;top:0;right:-380px;width:380px;max-width:100vw;height:100vh;background:var(--c);z-index:301;transition:right .35s;display:flex;flex-direction:column}
.cp.on{right:0}.cp-hd{padding:16px 20px;border-bottom:1px solid var(--b);display:flex;justify-content:space-between;align-items:center}
.cp-x{background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--t2)}
.cp-x:hover{color:var(--p)}
.cp-its{flex:1;overflow-y:auto;padding:8px 20px}
.cp-em{text-align:center;padding:40px 0;color:var(--t2)}
.ci{display:flex;gap:8px;padding:10px 0;border-bottom:1px solid var(--b)}
.ci:last-child{border:none}.ci-if{flex:1;min-width:0}.ci-if h4{font-size:.75rem;font-weight:600}
.ci-if .cu{font-size:.6rem;color:var(--t2)}.ci-if .up{font-size:.58rem;color:var(--t2)}
.ci-ac{display:flex;align-items:center;gap:6px;flex-shrink:0}
.ci-q{width:24px;height:24px;border-radius:50%;border:1.5px solid var(--b);background:var(--c);cursor:pointer;font-weight:700;font-size:.78rem;display:flex;align-items:center;justify-content:center;color:var(--t)}
.ci-q:hover{border-color:var(--p);color:var(--p)}
.ci-n{font-weight:600;min-width:16px;text-align:center;font-size:.75rem}
.ci-it{font-weight:700;color:var(--p);min-width:40px;text-align:right;font-size:.75rem}
.cp-ft{padding:12px 20px 16px;border-top:1px solid var(--b)}
.cp-tr{display:flex;justify-content:space-between;font-weight:700;font-size:.82rem;margin-bottom:8px}
.cp-ck{width:100%;padding:12px;background:var(--p);color:#fff;border:none;border-radius:30px;font-weight:700;font-size:.76rem;cursor:pointer}
.cp-ck:hover{background:var(--p2)}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:#1a1a1a;color:#fff;padding:12px 22px;border-radius:12px;font-size:.74rem;z-index:500;opacity:0;transition:all .4s;pointer-events:none}
[data-theme="dark"] .toast{background:#333}
.toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
.ni{display:none;position:fixed;bottom:16px;right:16px;z-index:50;background:linear-gradient(135deg,#1e1b4b,#312e81);color:#c7d2fe;padding:10px 14px;border-radius:12px;font-size:.6rem;font-weight:600}
#top-btn{display:none;position:fixed;bottom:64px;right:14px;z-index:50;width:40px;height:40px;border-radius:50%;background:var(--p);color:#fff;border:none;font-size:1.2rem;cursor:pointer;box-shadow:0 2px 12px rgba(199,59,43,.25)}
#top-btn:hover{transform:scale(1.12)}
footer{background:#1a1a1a;color:rgba(255,255,255,.6);padding:32px 16px 14px;margin-top:32px}
[data-theme="dark"] footer{background:#0d0d0d}
.fi{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px}
.fi h4{color:#fff;font-weight:700;font-size:.74rem;margin-bottom:6px}
.fi p,.fi a{font-size:.66rem;color:rgba(255,255,255,.45);display:block;margin-bottom:4px}
.fi a:hover{color:var(--s)}
.fb{max-width:1100px;margin:14px auto 0;padding-top:12px;border-top:1px solid rgba(255,255,255,.06);text-align:center;font-size:.6rem}
[data-theme="dark"] .crd{background:#1a1a1a}[data-theme="dark"] .mod-bx{background:#1a1a1a}[data-theme="dark"] .mod-hd{background:#1a1a1a}[data-theme="dark"] .mod-ft{background:#1a1a1a}[data-theme="dark"] .inf div{background:#1a1a1a}[data-theme="dark"] .rv-card{background:#1a1a1a}[data-theme="dark"] .cd{background:#1a1a1a}[data-theme="dark"] .cp{background:#1a1a1a}[data-theme="dark"] .nl input{background:#2a2a2a;color:#eee}[data-theme="dark"] .mod-ta{background:#2a2a2a;color:#eee}[data-theme="dark"] .bar{background:#0d0d0d}
@media(max-width:768px){.ham{display:flex}.nv a:not(.sl){display:none}.grid{grid-template-columns:1fr;max-width:420px}.cp{width:100vw;right:-100vw}}
@media(max-width:480px){.crd-img{height:150px}.hero h1{font-size:clamp(1.2rem,7vw,1.5rem)}}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:var(--b);border-radius:3px}
</style>''')

# ================================================================
# JS
# ================================================================
items_json = json.dumps(ITEMS, ensure_ascii=False)
A('<script>')

A(f'var M={items_json};')

A('''
var cart=JSON.parse(localStorage.getItem("c")||"[]"),ci=null,cs={},curPage="acc";
var cmdMode=localStorage.getItem("cmdMode")||"livraison",cmdAddr=localStorage.getItem("cmdAddr")||"";
var WA_NUMBERS=["33672044875","33744700167","33611924863"];
var CU=["Froid","Chaud"],VI="Tenders,Eminc\u00e9 poulet,Blanc dinde,Jambon dinde,Pastrami,Rosette,Thon".split(",");
var CR="Salade,Tomate,Concombre,Oignons,Poivrons,Ma\u00efs,Carottes r\u00e2p\u00e9es,Avocat".split(",");
var SA="Mayo,Ketchup,Alg\u00e9rienne,Samoura\u00ef,Blanche,Moutarde,Brasil,Chili,Thai".split(",");
var SP="Cheddar,Mozzarella,Feta".split(",");
var MSC="Snickers,M&Ms,KitKat,KitKat White".split(",");
var MCL="Coulis chocolat (+0,50\u20ac),Coulis caramel (+0,50\u20ac),Coulis fraise (+0,50\u20ac)".split(",");
var TIR="Caramel,Chocolat,Sp\u00e9culos".split(",");
var IMG={l:"/images/menu-leger.jpg",c:"/images/menu-classique.jpg",g:"/images/menu-gourmand.jpg",t:"/images/tiramisu.jpg",m:"/images/milkshake.png",co:"/images/coca.jpg",cz:"/images/zero.jpg",pe:"/images/pepsi.jpg",oa:"/images/oasis.jpg",li:"/images/icetea.jpg",or:"/images/orangina.jpg",cr:"/images/cristaline.jpg",sp:"/images/sanpellegrino.jpg"};

function gp(p){
  var dirs=["acc","menu","ap","con"],ci=dirs.indexOf(curPage),ni=dirs.indexOf(p),dir=ni>ci?"fwd":"bwd";
  ["acc","menu","ap","con"].forEach(function(x){var e=document.getElementById(x);if(e){e.classList.add("h")}});
  var nxt=document.getElementById(p);
  if(nxt){nxt.classList.remove("h")}
  document.querySelectorAll(".nv a").forEach(function(x){x.classList.remove("sl")});
  var n=document.getElementById("na-"+p);
  if(n){n.classList.add("sl")}
  curPage=p;
}

document.querySelectorAll(".nv a").forEach(function(a){a.addEventListener("click",function(){gp(this.id.replace("na-",""))})});
document.querySelectorAll(".hero-btn,.hero-btn2,.ub,.ub2,.cp-ck,.mod-ok,.add-btn").forEach(function(b){b.addEventListener("click",function(e){e.stopPropagation()})});
document.querySelector(".hero-btn").addEventListener("click",function(){gp("menu")});
document.querySelector(".hero-btn2").addEventListener("click",function(){
  if(window.open("https://wa.me/33672044875","_blank")){}else{alert("Autorise les pop-ups pour WhatsApp")}
});

function nl(e){
  e.preventDefault();
  var v=e.target.querySelector("input");
  if(!v||!v.value){return}
  var em=v.value.trim();
  v.disabled=true;
  var x=new XMLHttpRequest();
  x.open("POST","/api/newsletter",true);
  x.setRequestHeader("Content-Type","application/json");
  x.onload=function(){v.disabled=false;if(x.status===200){v.value="";ts("Inscrit !")}else{ts("Erreur")}};
  x.onerror=function(){v.disabled=false;ts("Erreur r\u00e9seau")};
  x.send(JSON.stringify({email:em}));
}
document.getElementById("nl1").addEventListener("submit",nl);
document.getElementById("nl2").addEventListener("submit",nl);

// Navigation helper - get function name for item
function fn(id){
  var it=null;
  for(var i=0;i<M.length;i++){if(M[i].id===id){it=M[i];break}}
  if(!it){return null}
  if(it.cs===2){return"oti"}
  if(it.cs===3){return"omm"}
  if(it.cs){return"om"}
  return"ai";
}

// Click on cards
document.querySelectorAll(".crd").forEach(function(el){
  el.addEventListener("click",function(){
    var id=this.dataset.id;
    var f=fn(id);
    if(f==="oti"){oti()}
    else if(f==="omm"){omm(id)}
    else if(f==="om"){om(id)}
    else if(f==="ai"){ai(id)}
  });
});

// Click on add buttons
document.querySelectorAll(".add-btn").forEach(function(el){
  el.addEventListener("click",function(e){
    e.stopPropagation();
    var crd=this.closest(".crd");
    if(!crd){return}
    var id=crd.dataset.id;
    var f=fn(id);
    if(f==="oti"){oti()}
    else if(f==="omm"){omm(id)}
    else if(f==="om"){om(id)}
    else if(f==="ai"){ai(id)}
  });
});

// Render menu
function rm(g,el){
  var items=g==="all"?M:M.filter(function(x){return x.c===g});
  var h="";
  for(var i=0;i<items.length;i++){
    var x=items[i];
    var oc,cs=x.cs;
    if(cs===2){oc="oti()"}else if(cs===3){oc="omm('"+x.id+"')"}else if(cs){oc="om('"+x.id+"')"}else{oc="ai('"+x.id+"')"}
    var ig=IMG[x.id]||"/images/coca.jpg";
    var badge=(x.pop&&x.c!=="boissons")?"<span class=\'pop-badge\'>Populaire</span>":"";
    h+="<div class='crd' data-id='"+x.id+"'><div class='crd-img' style='background-image:url("+ig+")' loading='lazy'>"+badge+"</div><div class='crd-body'><h3>"+x.n+"</h3><div class='crd-desc'>"+(x.d||"")+"</div><div class='crd-ft'><span class='crd-pr'>"+x.p.toFixed(2)+"\u20ac</span><button class='add-btn'>+</button></div></div></div>";
  }
  el.innerHTML=h;
  // Re-bind events
  el.querySelectorAll(".crd").forEach(function(c){
    c.addEventListener("click",function(){
      var id=this.dataset.id;
      var f=fn(id);
      if(f==="oti"){oti()}else if(f==="omm"){omm(id)}else if(f==="om"){om(id)}else if(f==="ai"){ai(id)}
    });
  });
  el.querySelectorAll(".add-btn").forEach(function(b){
    b.addEventListener("click",function(e){
      e.stopPropagation();
      var crd=this.closest(".crd");if(!crd)return;
      var id=crd.dataset.id,f=fn(id);
      if(f==="oti"){oti()}else if(f==="omm"){omm(id)}else if(f==="om"){om(id)}else if(f==="ai"){ai(id)}
    });
  });
}
rm("all",document.getElementById("mg"));
rm("all",document.getElementById("mg2"));

document.querySelectorAll(".tabs button").forEach(function(b){
  b.addEventListener("click",function(){
    var p=this.closest(".pg");
    p.querySelectorAll(".tabs button").forEach(function(x){x.classList.remove("on")});
    this.classList.add("on");
    var id=p.id==="acc"?"mg":"mg2";
    rm(this.dataset.c,document.getElementById(id));
  });
});

function setMode(m){
  cmdMode=m;localStorage.setItem("cmdMode",m);
  document.getElementById("mode-livraison").className=m==="livraison"?"on":"";
  document.getElementById("mode-emporter").className=m==="emporter"?"on":"";
  var a=document.getElementById("cmd-addr");
  if(a){a.style.display=m==="livraison"?"block":"none"}
  updateCartMode();
}
document.getElementById("mode-livraison").addEventListener("click",function(){setMode("livraison")});
document.getElementById("mode-emporter").addEventListener("click",function(){setMode("emporter")});
if(cmdMode==="livraison"){document.getElementById("mode-livraison").className="on";document.getElementById("cmd-addr").style.display="block"}

function updateCartMode(){
  var e=document.getElementById("cp-mode");
  if(e){e.textContent=cmdMode==="livraison"?"Livraison":"\u00c0 emporter"}
}

function om(id){
  var i=null;for(var j=0;j<M.length;j++){if(M[j].id===id){i=M[j];break}}
  if(!i||!i.cs)return;ci=i;cs={};
  var mb=document.getElementById("mb");
  mb.innerHTML="<div class=\"cs\"><h4>Cuisson</h4><div class=\"chips\">"+CU.map(function(v){return"<button data-k=\"cu\" data-v=\""+v+"\">"+v+"</button>"}).join("")+"</div></div>"+
  "<div class=\"cs\"><h4>Viande</h4><div class=\"chips\">"+VI.map(function(v){return"<button data-k=\"v\" data-v=\""+v+"\">"+v+"</button>"}).join("")+"</div></div>"+
  "<div class=\"cs\"><h4>Crudit\u00e9s</h4><div class=\"chips\">"+CR.map(function(v){return"<button class=\"multi\" data-k=\"r\" data-v=\""+v+"\">"+v+"</button>"}).join("")+"</div></div>"+
  "<div class=\"cs\"><h4>Suppl\u00e9ments</h4><div class=\"chips\">"+SP.map(function(v){return"<button class=\"multi\" data-k=\"p\" data-v=\""+v+"\">"+v+"</button>"}).join("")+"</div></div>"+
  "<div class=\"cs\"><h4>Sauce</h4><div class=\"chips\">"+SA.map(function(v){return"<button data-k=\"s\" data-v=\""+v+"\">"+v+"</button>"}).join("")+"</div></div>";
  document.getElementById("mp").textContent=i.p.toFixed(2)+"\u20ac";
  document.getElementById("mod").classList.add("on");document.body.style.overflow="hidden";
  document.getElementById("mi").value="";
  // Bind chip clicks
  mb.querySelectorAll(".chips button").forEach(function(b){
    b.addEventListener("click",function(){sel(this.dataset.k,this.dataset.v,this)});
  });
}

function oti(){
  ci=null;for(var j=0;j<M.length;j++){if(M[j].id==="t"){ci=M[j];break}}
  cs={};
  var mb=document.getElementById("mb-t");
  mb.innerHTML="<div class=\"cs\"><h4>Parfum</h4><div class=\"chips\">"+TIR.map(function(v){return"<button data-k=\"ti\" data-v=\""+v+"\">"+v+"</button>"}).join("")+"</div></div>";
  document.getElementById("mod-t").classList.add("on");document.body.style.overflow="hidden";
  mb.querySelectorAll(".chips button").forEach(function(b){
    b.addEventListener("click",function(){sel(this.dataset.k,this.dataset.v,this)});
  });
}

function omm(id){
  var i=null;for(var j=0;j<M.length;j++){if(M[j].id===id){i=M[j];break}}
  if(!i||!i.cs)return;ci=i;cs={};
  var mb=document.getElementById("mb-m");
  mb.innerHTML="<div class=\"cs\"><h4>Choix</h4><div class=\"chips\">"+MSC.map(function(v){return"<button data-k=\"ch\" data-v=\""+v+"\">"+v+"</button>"}).join("")+"</div></div>"+
  "<div class=\"cs\"><h4>Coulis (+0,50\u20ac)</h4><div class=\"chips\">"+MCL.map(function(v){return"<button class=\"multi\" data-k=\"cl\" data-v=\""+v+"\">"+v+"</button>"}).join("")+"</div></div>";
  document.getElementById("mp-m").textContent="5,00\u20ac";
  document.getElementById("mod-m").classList.add("on");document.body.style.overflow="hidden";
  document.getElementById("mi-m").value="";
  mb.querySelectorAll(".chips button").forEach(function(b){
    b.addEventListener("click",function(){sel(this.dataset.k,this.dataset.v,this)});
  });
}

function sel(k,v,el){
  if(k==="r"||k==="p"||k==="cl"){
    el.classList.toggle("sel");
    cs[k]=[].map.call(el.parentNode.querySelectorAll(".sel"),function(b){return b.textContent||b.dataset.v});
  }else{
    el.parentNode.querySelectorAll("button").forEach(function(b){b.classList.remove("sel")});
    el.classList.add("sel");cs[k]=v;
  }
  if(ci&&ci.cs===3){var extra=0;if(cs.cl)extra=0.5*cs.cl.length;document.getElementById("mp-m").textContent=(5+extra).toFixed(2).replace(".",",")+"\u20ac"}
}

function cm(){document.getElementById("mod").classList.remove("on");document.body.style.overflow="";ci=null;cs={}}
function cmt(){document.getElementById("mod-t").classList.remove("on");document.body.style.overflow="";ci=null;cs={}}
function cmm(){document.getElementById("mod-m").classList.remove("on");document.body.style.overflow="";ci=null;cs={}}

document.querySelectorAll(".mod .mod-cl").forEach(function(b){
  b.addEventListener("click",function(){
    var m=this.closest(".mod");
    if(m){m.classList.remove("on");document.body.style.overflow="";ci=null;cs={}}
  });
});
document.querySelectorAll(".mod").forEach(function(m){
  m.addEventListener("click",function(e){if(e.target===this){this.classList.remove("on");document.body.style.overflow="";ci=null;cs={}}});
});

// Confirm functions
function addToCart(label,price,custom){
  var idx=-1;
  for(var i=0;i<cart.length;i++){if(cart[i].n===label&&cart[i].cu===custom){idx=i;break}}
  if(idx>=0){cart[idx].q+=1}else{cart.push({n:label,p:price,cu:custom,q:1})}
  sv();ts("Ajout\u00e9 !");
}

document.querySelector("#mod .mod-ok").addEventListener("click",function(){
  if(!ci||!cs.cu||!cs.v||!cs.s){ts("Choisis cuisson, viande et sauce");return}
  var ins=document.getElementById("mi").value.trim();
  var t=(cs.cu||"")+" | "+(cs.v||"")+" | "+(cs.r?cs.r.join(", "):"-")+(cs.p?" | "+cs.p.join(", "):"")+" | "+(cs.s||"")+(ins?" | "+ins:"");
  addToCart(ci.n,ci.p,t);cm();
});

document.querySelector("#mod-t .mod-ok").addEventListener("click",function(){
  if(!cs.ti){ts("Choisis un parfum");return}
  addToCart("Tiramisu "+cs.ti,3,"Parfum: "+cs.ti);cmt();
});

document.querySelector("#mod-m .mod-ok").addEventListener("click",function(){
  if(!cs.ch){ts("Choisis un type");return}
  var ins=document.getElementById("mi-m").value.trim();var extra=0;if(cs.cl)extra=0.5*cs.cl.length;
  var t=(cs.ch||"")+(cs.cl?" + "+cs.cl.join(", "):"")+(ins?" | "+ins:"");
  addToCart(ci.n+" ("+cs.ch+")",5+extra,t);cmm();
});

function ai(id){
  var i=null;for(var j=0;j<M.length;j++){if(M[j].id===id){i=M[j];break}}
  if(!i)return;
  var idx=-1;
  for(var j=0;j<cart.length;j++){if(cart[j].n===i.n&&!cart[j].cu){idx=j;break}}
  if(idx>=0){cart[idx].q+=1}else{cart.push({n:i.n,p:i.p,cu:null,q:1})}
  sv();ts(i.n+" ajout\u00e9 !");
}

function sv(){
  try{localStorage.setItem("c",JSON.stringify(cart))}catch(e){}
  uc();
}

function uc(){
  var n=0,t=0;
  for(var i=0;i<cart.length;i++){n+=cart[i].q;t+=cart[i].p*cart[i].q}
  document.getElementById("cc").textContent=n;
  document.getElementById("ct").textContent=t.toFixed(2)+"\u20ac";
  document.getElementById("c2").textContent=t.toFixed(2)+"\u20ac";
  var c=document.getElementById("ci");
  if(!cart.length){c.innerHTML="<div class=\"cp-em\">Panier vide</div>";return}
  c.innerHTML=cart.map(function(i,idx){
    return "<div class=\"ci\"><div class=\"ci-if\"><h4>"+i.n+"</h4>"+(i.cu?"<div class=\"cu\">"+i.cu.substring(0,50)+"</div>":"")+"<div class=\"up\">"+i.p.toFixed(2)+"\u20ac</div></div><div class=\"ci-ac\"><button class=\"ci-q\" data-idx=\""+idx+"\" data-d=\"-1\">\u2212</button><span class=\"ci-n\">"+i.q+"</span><button class=\"ci-q\" data-idx=\""+idx+"\" data-d=\"1\">+</button><span class=\"ci-it\">"+(i.p*i.q).toFixed(2)+"\u20ac</span></div></div>";
  }).join("");
  c.querySelectorAll(".ci-q").forEach(function(x){
    x.addEventListener("click",function(){
      var idx=parseInt(this.dataset.idx),d=parseInt(this.dataset.d);
      try{cart[idx].q+=d;if(cart[idx].q<=0)cart.splice(idx,1);sv()}catch(e){}
    });
  });
}
uc();

function tc(){
  document.getElementById("co").classList.toggle("on");
  document.getElementById("cp").classList.toggle("on");
  document.body.style.overflow=document.getElementById("co").classList.contains("on")?"hidden":"";
  updateCartMode();
}
document.getElementById("ct").addEventListener("click",tc);
document.getElementById("co").addEventListener("click",tc);
document.querySelector(".cp-x").addEventListener("click",tc);

document.querySelector(".cp-ck").addEventListener("click",function(){
  if(!cart.length)return;
  saveAddr();
  document.getElementById("pay-total").textContent=cart.reduce(function(s,i){return s+i.p*i.q},0).toFixed(2)+"\u20ac";
  document.getElementById("mod-pay").classList.add("on");
  document.body.style.overflow="hidden";
});

document.getElementById("pay-btn").addEventListener("click",function(){
  var btn=this;btn.textContent="Traitement...";btn.disabled=true;
  var name=document.getElementById("pay-name").value.trim()||"Client";
  var t=0;for(var i=0;i<cart.length;i++){t+=cart[i].p*cart[i].q}
  var items=cart.map(function(i){return{name:i.n,price:Math.round(i.p*100),qty:i.q,custom:i.cu||null}});
  var x=new XMLHttpRequest();
  x.open("POST","/api/create-checkout",true);
  x.setRequestHeader("Content-Type","application/json");
  x.onload=function(){
    btn.textContent="Payer";btn.disabled=false;
    if(x.status===200){var r=JSON.parse(x.responseText);if(r.url){window.location.href=r.url}else{ts("Erreur paiement")}}
    else{ts("Erreur serveur")}
  };
  x.onerror=function(){btn.textContent="Payer";btn.disabled=false;ts("Erreur r\u00e9seau")};
  x.send(JSON.stringify({items:items,total:t,customerName:name,mode:cmdMode,address:cmdAddr}));
});

function saveAddr(){
  var a=document.getElementById("cmd-address");
  if(a){cmdAddr=a.value.trim();localStorage.setItem("cmdAddr",cmdAddr)}
}

function ts(m){
  var t=document.getElementById("toast");
  document.getElementById("tm").textContent=m;
  t.classList.add("on");
  clearTimeout(window._tt);
  window._tt=setTimeout(function(){t.classList.remove("on")},2500);
}

document.addEventListener("keydown",function(e){
  if(e.key==="Escape"){
    var mods=["mod","mod-t","mod-m","mod-pay"];
    for(var i=0;i<mods.length;i++){
      var m=document.getElementById(mods[i]);
      if(m&&m.classList.contains("on")){m.classList.remove("on");document.body.style.overflow="";ci=null;cs={};return}
    }
    if(document.getElementById("cp").classList.contains("on")){tc()}
  }
});

window.addEventListener("scroll",function(){
  var b=document.getElementById("top-btn");
  b.style.display=window.scrollY>400?"flex":"none";
});
document.getElementById("top-btn").addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"})});

// Theme
(function(){
  var h=new Date().getHours(),n=(h>=23||h<6);
  document.getElementById("nb").style.display=n?"block":"none";
  document.getElementById("ni").style.display=n?"flex":"none";
})();

window.matchMedia("(prefers-color-scheme:dark)").addEventListener("change",function(e){
  if(!localStorage.getItem("t")){
    document.documentElement.dataset.theme=e.matches?"dark":"light";
  }
});
setInterval(function(){
  var h=new Date().getHours();
  document.getElementById("nb").style.display=(h>=23||h<6)?"block":"none";
  document.getElementById("ni").style.display=(h>=23||h<6)?"flex":"none";
},60000);

var st=localStorage.getItem("t")||(window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");
document.documentElement.dataset.theme=st;

document.getElementById("tt").addEventListener("click",function(){
  var t=document.documentElement.dataset.theme,n=t==="dark"?"light":"dark";
  document.documentElement.dataset.theme=n;
  localStorage.setItem("t",n);
});

// Mobile menu
document.getElementById("ham").addEventListener("click",function(){
  var m=document.getElementById("mn");
  m.classList.toggle("on");
  this.textContent=m.classList.contains("on")?"\u2715":"\u2630";
});
document.addEventListener("click",function(e){
  var m=document.getElementById("mn"),h=document.getElementById("ham");
  if(m.classList.contains("on")&&!m.contains(e.target)&&!h.contains(e.target)){
    m.classList.remove("on");h.textContent="\u2630";
  }
});

// Build mobile nav links
["acc","menu","ap","con"].forEach(function(p){
  var a=document.createElement("a");
  a.textContent={acc:"Accueil",menu:"Menu",ap:"Infos",con:"Contact"}[p];
  a.addEventListener("click",function(){gp(p);document.getElementById("mn").classList.remove("on");document.getElementById("ham").textContent="\u2630"});
  document.getElementById("mn").appendChild(a);
});

// WhatsApp
document.getElementById("wa-btn").addEventListener("click",function(){
  if(!window.open("https://wa.me/33672044875","_blank")){
    alert("WhatsApp: https://wa.me/33672044875");
  }
});

// Service worker
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("/sw.js").catch(function(){});
}

// Payment success handler
(function(){
  var p=new URLSearchParams(window.location.search);
  if(p.get("payment")==="success"){
    var t=0;for(var i=0;i<cart.length;i++){t+=cart[i].p*cart[i].q}
    var mode=cmdMode==="livraison"?"Livraison ["+cmdAddr+"]":"\u00c0 emporter";
    var its=cart.map(function(i){return i.q+"x "+i.n+(i.cu?" ("+i.cu.substring(0,50)+")":"")+" - "+(i.p*i.q).toFixed(2)+"\u20ac"}).join("%0a");
    var msg="NOUVELLE COMMANDE (PAY\u00c9E)%0a%0a"+mode+"%0a%0a"+its+"%0a%0aTotal: "+t.toFixed(2)+"\u20ac%0aPAYE";
    for(var wi=0;wi<WA_NUMBERS.length;wi++){
      try{window.open("https://wa.me/"+WA_NUMBERS[wi]+"?text="+encodeURIComponent(msg),wi===0?"_self":"_blank")}catch(e){}
    }
    cart=[];sv();tc();ts("Commande envoy\u00e9e !");
  }
})();

updateCartMode();
''')
A('</script>')
A('</body>')
A('</html>')

# ================================================================
# WRITE FILE
# ================================================================
full = '\n'.join(parts)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(full)
print(f"✅ Written: {len(full)} bytes")

# TEST with node
import subprocess, tempfile, os
with tempfile.NamedTemporaryFile(suffix='.js', mode='w', delete=False, encoding='utf-8') as f:
    # Extract JS from the generated HTML
    js_start = full.rfind('<script>')
    js_end = full.rfind('</script>')
    js = full[js_start+8:js_end]
    f.write(js)
    fname = f.name

result = subprocess.run(['node', '--check', fname], capture_output=True, text=True)
if result.returncode == 0:
    print(f"✅ Node check PASSED ({len(js)} chars JS)")
else:
    print(f"❌ Node check FAILED: {result.stderr[:200]}")
    
os.unlink(fname)

# Close brace check
o = full.count('{')
c = full.count('}')
print(f"✅ Braces: {o}/{c} {'OK' if o==c else 'MISMATCH!'}")
print(f"✅ Total file: {len(full)} chars")
