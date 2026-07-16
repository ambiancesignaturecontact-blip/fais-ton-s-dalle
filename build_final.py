# Ce script génère le index.html final avec TOUTES les améliorations
import json, os

# ============================================================
# DONNÉES
# ============================================================
M_JSON = json.dumps([
 {'id':'l','n':'Menu Léger','c':'menus','p':6.9,'d':'Sandwich (viande + crudités + sauce)','cs':1},
 {'id':'c','n':'Menu Classique','c':'menus','p':7.9,'d':'Sandwich + boisson + crudités + sauce','cs':1},
 {'id':'g','n':'Menu Gourmand','c':'menus','p':9.9,'d':'Sandwich + boisson + dessert + crudités + sauce','cs':1},
 {'id':'t','n':'Tiramisu Maison','c':'desserts','p':3,'d':'Fait maison'},
 {'id':'m','n':'Milkshake','c':'desserts','p':5,'d':'Crémeux et rafraîchissant'},
 {'id':'co','n':'Coca-Cola','c':'boissons','p':1},{'id':'cz','n':'Coca Zéro','c':'boissons','p':1},
 {'id':'pe','n':'Pepsi','c':'boissons','p':1},{'id':'oa','n':'Oasis Tropical','c':'boissons','p':1},
 {'id':'li','n':'Ice Tea','c':'boissons','p':1},{'id':'or','n':'Orangina','c':'boissons','p':1},
 {'id':'cr','n':'Cristaline','c':'boissons','p':1},{'id':'sp','n':'San Pellegrino','c':'boissons','p':1}
], ensure_ascii=False)

IMG_FILES = {
    'l':'/images/menu-leger.jpg','c':'/images/menu-classique.jpg','g':'/images/menu-gourmand.jpg',
    't':'/images/tiramisu.jpg','m':'/images/milkshake.png',
    'co':'/images/coca.jpg','cz':'/images/zero.jpg','pe':'/images/pepsi.jpg','oa':'/images/oasis.jpg',
    'li':'/images/icetea.jpg','or':'/images/orangina.jpg','cr':'/images/cristaline.jpg','sp':'/images/sanpellegrino.jpg'
}

# === FAVICON SVG — Sandwich with F ===
FAV_SVG = '''data:image/svg+xml;base64,''' + base64.b64encode(b'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#c73b2b"/>
  <path d="M14 34 Q50 23 86 34 L86 46 Q50 40 14 46 Z" fill="#f5a623"/>
  <path d="M16 46 Q50 50 84 46 Q50 54 16 46 Z" fill="#4caf50"/>
  <path d="M18 52 Q50 56 82 52 Q50 60 18 52 Z" fill="#e53935"/>
  <path d="M20 58 Q50 62 80 58 Q50 66 20 58 Z" fill="#ffd54f"/>
  <path d="M14 66 Q50 78 86 66 L86 78 Q50 88 14 78 Z" fill="#f5a623"/>
  <text x="50" y="49" text-anchor="middle" font-family="Arial" font-size="13" font-weight="900" fill="#c73b2b" opacity=".7">F</text>
</svg>''').decode()

# Let me just write the base64 inline
import base64
favicon_data = base64.b64encode(b'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#c73b2b"/><path d="M14 34Q50 23 86 34L86 46Q50 40 14 46Z" fill="#f5a623"/><path d="M16 46Q50 50 84 46Q50 54 16 46Z" fill="#4caf50"/><path d="M18 52Q50 56 82 52Q50 60 18 52Z" fill="#e53935"/><path d="M20 58Q50 62 80 58Q50 66 20 58Z" fill="#ffd54f"/><path d="M14 66Q50 78 86 66L86 78Q50 88 14 78Z" fill="#f5a623"/><text x="50" y="49" text-anchor="middle" font-family="Arial" font-size="13" font-weight="900" fill="#c73b2b" opacity=".7">F</text></svg>''').decode()

# ============================================================
# CONSTRUCTION HTML
# ============================================================

def card(x):
    oc = "om('"+x['id']+"')" if x.get('cs') else "ai('"+x['id']+"')"
    return '<div class="mc" onclick="'+oc+'"><div class="mi" style="background-image:url('+IMG_FILES[x['id']]+')"></div><div class="mb"><h3>'+x['n']+'</h3><div class="d">'+x.get('d','')+'</div><div class="mf"><span class="pr">'+f"{x['p']:.2f}"+'\u20ac</span><button class="bt" onclick="event.stopPropagation();'+oc+'">+</button></div></div></div>'

CARDS = ''.join(card(x) for x in json.loads(M_JSON))
RVS = '<div><div class="sr">⭐⭐⭐⭐⭐</div><div class="tx">"Les meilleurs sandwichs du 93 ! Personnalisation top."</div><div class="au">- Sophie M.</div></div><div><div class="sr">⭐⭐⭐⭐⭐</div><div class="tx">"Service de nuit incroyable ! Sandwich frais à 3h du matin."</div><div class="au">- Karim D.</div></div><div><div class="sr">⭐⭐⭐⭐</div><div class="tx">"Le gourmand à 9,90€, qualité-prix imbattable."</div><div class="au">- Léa T.</div></div><div><div class="sr">⭐⭐⭐⭐</div><div class="tx">"Large choix de sauces et crudités fraîches. Excellent !"</div><div class="au">- Alexandre P.</div></div>'

I_DECL = 'var I={l:"/images/logo.jpg",a:"/images/menu-leger.jpg",b:"/images/menu-classique.jpg",c:"/images/menu-gourmand.jpg",d:"/images/tiramisu.jpg",m:"/images/milkshake.png",co:"/images/coca.jpg",cz:"/images/zero.jpg",pe:"/images/pepsi.jpg",oa:"/images/oasis.jpg",li:"/images/icetea.jpg",or:"/images/orangina.jpg",cr:"/images/cristaline.jpg",sp:"/images/sanpellegrino.jpg"};'
IMGJS = 'var IMG={l:I.a,c:I.b,g:I.c,t:I.d,m:I.m,co:I.co,cz:I.cz,pe:I.pe,oa:I.oa,li:I.li,or:I.or,cr:I.cr,sp:I.sp};'

print("Génération du HTML final...")

with open('index.html', 'w', encoding='utf-8') as f:
    # === HEAD ===
    f.write('<!DOCTYPE html>\n<html lang="fr" data-theme="light">\n<head>\n')
    f.write('<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n')
    f.write('<title>FAIS TON S\'DALLE — Sandwichs sur mesure | Les Pavillons-sous-Bois 93320</title>\n')
    f.write('<meta name="description" content="Crée ton sandwich sur mesure chez FAIS TON S\'DALLE à Les Pavillons-sous-Bois. Viandes, crudités, sauces. Livraison nocturne 23h-06h.">\n')
    f.write('<meta name="robots" content="index,follow"><meta name="geo.position" content="48.906;2.511"><link rel="canonical" href="https://faistonsdalle.fr">\n')
    f.write('<link rel="alternate" href="https://faistonsdalle.fr" hreflang="fr"><link rel="alternate" href="https://faistonsdalle.fr" hreflang="x-default">\n')
    f.write('<meta property="og:type" content="restaurant.menu"><meta property="og:title" content="FAIS TON S\'DALLE"><meta property="og:url" content="https://faistonsdalle.fr"><meta property="og:locale" content="fr_FR">\n')
    f.write('<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="FAIS TON S\'DALLE">\n')
    f.write('<meta name="theme-color" content="#c73b2b"><link rel="manifest" href="/manifest.json">\n')
    f.write('<link rel="icon" type="image/svg+xml" sizes="any" href="data:image/svg+xml;base64,'+favicon_data+'">\n')
    f.write('<link rel="icon" type="image/png" sizes="32x32" href="data:image/png;base64,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">\n')
    f.write('<link rel="apple-touch-icon" sizes="180x180" href="data:image/svg+xml;base64,'+favicon_data+'">\n')
    f.write('</head>\n<body>\n')

    # === HEADER ===
    f.write('<div class="bar"><span>☀️ 11h30–23h</span><span class="n">🌙 Livraison 23h–06h</span><span>⭐ 4.4 · 93320</span></div>\n')
    # Logo text now in black (#1a1a1a) by default since root variable --t is #1a1a1a
    f.write('<header><div class="hd"><a href="#" class="lg" id="logo-link"><img src="" alt="FAIS TON S\'DALLE" id="logo"><div class="brand">FAIS TON S\'DALLE<span class="sub">Sandwichs sur mesure</span></div></a><nav class="nv"><a class="sl" onclick="gp(\'acc\')" id="na-acc">Accueil</a><a onclick="gp(\'menu\')" id="na-menu">Menu</a><a onclick="gp(\'ap\')" id="na-ap">Infos</a><a onclick="gp(\'con\')" id="na-con">Contact</a><button class="tg" onclick="tt()" id="tt">🌙</button><div class="ct" onclick="tc()">🛒<span class="cb" id="cc">0</span></div></nav></div></header>\n')
    f.write('<div class="nb" id="nb">🌙 Livraison 23h–06h – <a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" rel="noopener">Uber Eats</a></div>\n')

    # === PAGE ACCUEIL ===
    f.write('<div class="pg" id="acc"><section class="hero"><h1>Crée ton <span class="h">sandwich</span> sur mesure</h1><p>🥩 Viandes · 🥗 Crudités · 🧂 Sauces</p><div class="s"><span><strong>⭐ 4.4</strong> 14 avis</span><span><strong>📍</strong> Les Pavillons-sous-Bois</span><span><strong>🌙</strong> Livraison 6h</span><span><strong>🚚</strong> Uber Eats</span></div></section>\n')
    f.write('<div class="w"><h2 class="sec">Notre <span class="hl">Menu</span></h2><p class="sd">Chaque sandwich est préparé à la commande — <strong>chaud ou froid</strong>.</p>\n')
    f.write('<div class="tb" role="tablist"><button class="on" data-c="all" role="tab" aria-selected="true">🔥 Tout</button><button data-c="menus" role="tab">🥪 Sandwichs</button><button data-c="desserts" role="tab">🍰 Desserts</button><button data-c="boissons" role="tab">🥤 Boissons</button></div>\n')
    f.write('<div class="mg" id="mg">'+CARDS+'</div>\n')
    f.write('<h2 class="sec">Ils nous <span class="hl">adorent</span></h2><div class="rv" id="rv">'+RVS+'</div>\n')
    f.write('<h2 class="sec">Restons <span class="hl">connectés</span></h2>\n')
    f.write('<div class="nl"><h3>Ne rate aucune actu</h3><p>Reçois les offres exclusives.</p><form onsubmit="nl(event)"><input type="email" id="nlmail" placeholder="ton@email.fr" required><button type="submit">→</button></form></div></div></div>\n')

    # === PAGE MENU ===
    f.write('<div class="pg h" id="menu"><div class="w" style="padding-top:20px">\n')
    f.write('<h2 class="sec">Notre <span class="hl">Carte</span></h2><p class="sd">Personnalise ton sandwich — <strong>chaud ou froid</strong>.</p>\n')
    f.write('<div class="tb"><button class="on" data-c="all">🔥 Tout</button><button data-c="menus">🥪 Sandwichs</button><button data-c="desserts">🍰 Desserts</button><button data-c="boissons">🥤 Boissons</button></div>\n')
    f.write('<div class="mg" id="mg2">'+CARDS+'</div>\n')
    f.write('<div style="text-align:center;margin:24px 0"><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" rel="noopener" class="ub2">🛵 Commander sur Uber Eats</a></div></div></div>\n')

    # === PAGE À PROPOS ===
    f.write('<div class="pg h" id="ap"><div class="w"><div class="ap">\n')
    f.write('<div class="im"><img src="" alt="FAIS TON S\'DALLE" id="about"></div>\n')
    f.write('<h2>À propos</h2>\n')
    f.write('<p><strong>FAIS TON S\'DALLE</strong> – Le spécialiste du sandwich sur mesure à <strong>Les Pavillons-sous-Bois</strong> (93320). <strong>Froid ou chaud</strong>, tu décides tout : la cuisson, la viande, les crudités, la sauce.</p>\n')
    f.write('<h3>À la carte</h3><div class="cd"><p><strong>Menu Léger 6,90€</strong> — Sandwich (viande + crudités + sauce)</p><p><strong>Menu Classique 7,90€</strong> — Sandwich + boisson</p><p><strong>Menu Gourmand 9,90€</strong> — Sandwich + boisson + dessert</p><p><strong>Tiramisu maison 3,00€</strong></p><p><strong>Milkshake 5,00€</strong></p><p><strong>Boissons 1,00€</strong> (Coca, Zéro, Pepsi, Oasis, Ice Tea, Orangina, Cristaline, San Pellegrino)</p></div>\n')
    f.write('<h3>Horaires 7j/7</h3><div class="cd"><p>☀️ Service : <strong>11h30–23h00</strong></p><p>🌙 Livraison : <strong>23h00–06h00</strong></p></div>\n')
    f.write('<h3>Coordonnées</h3><div class="cd"><p>134 Allée du Colonel Fabien, 93320</p><p>📞 <a href="tel:+33672044875" class="btl">06 72 04 48 75</a></p><p><a href="https://maps.google.com/maps?q=FAIS+TON+S%E2%80%99DALLE+134+All%C3%A9e+du+Colonel+Fabien+93320" target="_blank" rel="noopener" style="color:var(--p)">📍 Google Maps</a></p></div>\n')
    f.write('<h3>Infos livraison</h3><div class="cd"><p>🚚 <strong>Zone de livraison :</strong> Les Pavillons-sous-Bois et communes limitrophes (Livry-Gargan, Aulnay, Bondy, Bobigny).</p><p>⏱️ <strong>Temps estimé :</strong> 20-30 min selon votre adresse.</p><p>💰 <strong>Frais de livraison :</strong> Offerts à partir de 15€ d\'achat.</p></div>\n')
    f.write('</div></div></div>\n')

    # === PAGE CONTACT ===
    f.write('<div class="pg h" id="con"><div class="w" style="padding-top:20px">\n')
    f.write('<h2 class="sec">Nous <span class="hl">contacter</span></h2>\n')
    f.write('<div class="inf"><div><div class="ic">📍</div><h3>Adresse</h3><p>134 Allée du Colonel Fabien<br>93320 Les Pavillons-sous-Bois</p><a href="https://maps.google.com/maps?q=FAIS+TON+S\u2019DALLE+134+All\u00e9e+du+Colonel+Fabien+93320" target="_blank" rel="noopener" style="color:var(--p);font-size:.68rem">Google Maps →</a></div>\n')
    f.write('<div><div class="ic">🕐</div><h3>Horaires 7j/7</h3><div class="hg"><div><span>☀️ Service</span><span>11h30–23h</span></div><div class="nt"><span>🌙 Livraison</span><span>23h–06h</span></div></div><span class="hb">7j/7</span></div>\n')
    # Phone with emoji properly aligned
    f.write('<div><div class="ic">📞</div><h3>Téléphone</h3><p style="font-size:1.3rem;font-weight:800;color:var(--p);display:flex;align-items:center;gap:6px"><a href="tel:+33672044875" style="color:var(--p)">06 72 04 48 75</a></p><p style="font-size:.65rem;color:var(--t2)">Appel ou SMS — réponse sous 5 min</p></div>\n')
    f.write('<div><div class="ic">🚚</div><h3>Commander</h3><p>Uber Eats · Téléphone</p><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" rel="noopener" class="ub" style="margin-top:6px">🛵 Uber Eats</a></div></div>\n')
    f.write('<div style="display:flex;gap:12px;justify-content:center;margin:16px 0;flex-wrap:wrap"><a href="https://wa.me/33672044875" target="_blank" rel="noopener" class="ub" style="background:#25D366;display:flex;align-items:center;gap:6px">📱 Commander par WhatsApp</a><a href="javascript:void(0)" onclick="shareMenu()" class="ub" style="background:#666">📤 Partager</a></div>\n')
    f.write('<h2 class="sec">Avis <span class="hl">clients</span></h2><div class="rv" id="rv2">'+RVS+'</div>\n')
    f.write('<div class="nl" style="margin-top:20px"><h3>Newsletter</h3><p>Reçois les actualités et offres.</p><form onsubmit="nl(event)"><input type="email" placeholder="ton@email.fr" required><button type="submit">→</button></form></div></div></div>\n')

    # === MODALS ===
    f.write('<div class="mod" id="mod"><div class="bx"><div class="hd"><h2 id="mt" style="font-size:.85rem">🥪 Personnalise ton sandwich</h2><button class="cl" onclick="cm()">✕</button></div><div class="bd" id="mb"></div><div class="ft"><div class="tp" id="mp">0,00€</div><button class="ok" onclick="cf()">Ajouter →</button></div></div></div>\n')
    f.write('<div class="co" id="co" onclick="tc()"></div>\n')
    f.write('<div class="cp" id="cp"><div class="hd"><div><h3>🛒 Ton panier</h3></div><button style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--t2);padding:4px" onclick="tc()">✕</button></div><div class="its" id="ci"><div class="em">🥪 Panier vide</div></div><div class="ft"><div class="tr"><span>Total</span><span class="ta" id="ct">0,00€</span></div><button class="ck" onclick="ck()">🛵 Commander – <span id="c2">0,00€</span></button></div></div>\n')
    f.write('<div class="toast" id="toast">✅ <span id="tm"></span></div>\n')
    f.write('<div class="ni" id="ni"><span>🌙</span><span>Livraison<br><strong>23h–06h</strong></span></div>\n')

    # === FOOTER ===
    f.write('<footer><div class="fi"><div><h4>FAIS TON S\'DALLE</h4><p>Sandwichs sur mesure. 7j/7.</p><p>⭐ 4.4/5 – 14 avis</p></div><div><h4>Contact</h4><p>📞 <a href="tel:+33672044875">06 72 04 48 75</a></p><p>📍 134 Allée du Colonel Fabien, 93320</p><p>☀️ 11h30–23h · 🌙 23h–06h</p></div><div><h4>Suivez</h4><a href="https://www.tiktok.com/@faistonsdalle" target="_blank" rel="noopener">🎵 TikTok</a><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" rel="noopener">🛵 Uber Eats</a></div></div>\n')
    f.write('<div class="fb">© 2026 FAIS TON S\'DALLE – Les Pavillons-sous-Bois 93320</div></footer>\n')

    # === CSS ===
    f.write('<style>\n')
    f.write('''
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--p:#c73b2b;--p2:#a52a1c;--s:#f5a623;--bg:#f8f6f3;--c:#fff;--t:#1a1a1a;--t2:#6b6b6b;--b:#e8e2db;--r:16px;--f:Inter,"Segoe UI",system-ui,sans-serif;--sh:0 2px 12px rgba(0,0,0,.06);--sh2:0 8px 30px rgba(0,0,0,.1)}
[data-theme="dark"]{--bg:#121212;--c:#1a1a1a;--t:#eee;--t2:#999;--b:#2a2a2a}
html{scroll-behavior:smooth}body{font-family:var(--f);background:var(--bg);color:var(--t);transition:.25s;overflow-x:hidden}
img{max-width:100%;display:block}a{color:inherit;text-decoration:none}button{font-family:var(--f);cursor:pointer}
.bar{background:#1a1a1a;color:#fff;padding:5px 14px;font-size:.65rem;text-align:center;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;position:relative;z-index:101}
.bar .n{background:linear-gradient(135deg,#1e1b4b,#312e81);color:#c7d2fe;padding:2px 10px;border-radius:12px;font-size:.55rem;font-weight:600}
header{background:rgba(255,255,255,.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);position:sticky;top:0;z-index:100;border-bottom:1px solid var(--b)}
.hd{max-width:1200px;margin:0 auto;padding:0 16px;display:flex;align-items:center;justify-content:space-between;height:60px}
.lg{display:flex;align-items:center;gap:10px;flex-shrink:0}
.lg img{height:36px;width:auto}
.brand{font-weight:800;font-size:.9rem;line-height:1.1;color:var(--t)} /* EN NOIR */
.brand .sub{display:block;font-weight:500;font-size:.45rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--t2)}
.nv{display:flex;gap:4px;align-items:center}.nv a{padding:7px 14px;border-radius:30px;font-size:.7rem;font-weight:600;color:var(--t2);transition:.25s;cursor:pointer}
.nv a:hover{background:var(--bg);color:var(--p)}.nv a.sl{background:var(--p);color:#fff}
.tg{background:none;border:1.5px solid var(--b);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.85rem;color:var(--t2);transition:.25s}
.tg:hover{border-color:var(--s)}
.ct{padding:6px 12px;border-radius:30px;display:flex;align-items:center;gap:5px;font-weight:700;font-size:.72rem;cursor:pointer;border:1.5px solid var(--b);background:var(--c);transition:.25s}
.ct:hover{border-color:var(--p)}.cb{background:var(--p);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.58rem;font-weight:800}
.pg{display:block}.pg.h{display:none}
.hero{background:linear-gradient(135deg,#1a1a1a,#2d2d2d);color:#fff;padding:48px 14px 36px;text-align:center;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;top:-60%;right:-30%;width:500px;height:500px;background:radial-gradient(circle,rgba(245,166,35,.08),transparent 70%);pointer-events:none}
.hero h1{font-size:clamp(1.4rem,4.5vw,2.4rem);font-weight:900;line-height:1.05;margin-bottom:6px;position:relative}
.hero h1 .h{background:linear-gradient(135deg,var(--s),#fbc96a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p{font-size:.85rem;opacity:.75;margin-bottom:14px}.hero .s{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.hero .s span{font-size:.68rem;background:rgba(255,255,255,.07);padding:4px 12px;border-radius:30px;border:1px solid rgba(255,255,255,.05)}.hero .s strong{color:var(--s)}
.nb{background:linear-gradient(135deg,#1e1b4b,#312e81);padding:8px 14px;text-align:center;font-size:.68rem;color:#c7d2fe;display:none}
.w{max-width:1200px;margin:0 auto;padding:0 16px}
.sec{font-size:1.2rem;font-weight:800;margin:28px 0 4px;line-height:1.3}.sec .hl{color:var(--p)}.sd{color:var(--t2);font-size:.75rem;margin-bottom:14px}
.tb{display:flex;gap:6px;overflow-x:auto;padding:2px 0 16px;scrollbar-width:none}.tb::-webkit-scrollbar{display:none}
.tb button{padding:7px 18px;border-radius:30px;border:1.5px solid var(--b);background:var(--c);font-weight:600;font-size:.7rem;cursor:pointer;white-space:nowrap;color:var(--t2);flex-shrink:0;transition:.25s}
.tb button:hover{border-color:var(--s)}.tb button.on{background:var(--p);color:#fff;border-color:var(--p);box-shadow:0 2px 8px rgba(199,59,43,.2)}
.mg{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin-bottom:28px}
.mc{background:var(--c);border-radius:var(--r);overflow:hidden;border:1px solid var(--b);cursor:pointer;transition:transform .3s,box-shadow .3s;box-shadow:var(--sh)}
.mc:hover{transform:translateY(-4px);box-shadow:var(--sh2);border-color:rgba(199,59,43,.15)}
.mi{width:100%;height:145px;background-size:cover;background-position:center;position:relative;background-color:var(--bg)}
.mb{padding:12px 14px 14px}.mb h3{font-size:.88rem;font-weight:700;margin-bottom:2px}.mb .d{color:var(--t2);font-size:.66rem;line-height:1.35}
.mf{display:flex;align-items:center;justify-content:space-between;margin-top:8px}.pr{font-weight:800;font-size:.95rem;color:var(--p)}
.bt{background:var(--p);color:#fff;border:none;padding:6px 16px;border-radius:30px;font-weight:700;font-size:.68rem;cursor:pointer;transition:.25s}
.bt:hover{background:var(--p2);transform:scale(1.04)}
.ap{max-width:780px;margin:0 auto;padding:20px 0}.ap .cd{background:var(--c);border-radius:var(--r);padding:20px;margin:14px 0;border:1px solid var(--b);box-shadow:var(--sh)}
.ap h2{font-size:1.2rem;font-weight:800;margin-bottom:8px}.ap h3{font-size:.88rem;font-weight:700;color:var(--p);margin-bottom:6px}
.ap p{color:var(--t2);font-size:.78rem;line-height:1.65;margin-bottom:6px}.ap .im{text-align:center;margin:18px 0}.ap .im img{max-width:200px;max-height:70px;margin:0 auto;border-radius:8px}
.rv{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:28px}
.rv div{background:var(--c);border-radius:var(--r);padding:14px;border:1px solid var(--b);box-shadow:var(--sh)}
.rv .sr{color:var(--s);font-size:.82rem;margin-bottom:3px}.rv .tx{font-size:.7rem;color:var(--t2);font-style:italic;line-height:1.45;margin-bottom:4px}.rv .au{font-size:.65rem;font-weight:600}
.inf{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:28px 0}
.inf div{background:var(--c);padding:16px;border-radius:var(--r);border:1px solid var(--b);box-shadow:var(--sh)}
.inf .ic{font-size:1.4rem;margin-bottom:4px}.inf h3{font-weight:700;font-size:.78rem;margin-bottom:4px}
.inf p{color:var(--t2);font-size:.7rem;line-height:1.45}.inf .hb{display:inline-block;background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e;padding:3px 10px;border-radius:20px;font-size:.55rem;font-weight:700}
.hg{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:4px}.hg div{display:flex;justify-content:space-between;padding:4px 10px;border-radius:6px;font-size:.68rem;background:var(--b)}
.hg .nt{background:linear-gradient(135deg,#eef2ff,#e0e7ff)}[data-theme="dark"] .hg .nt{background:linear-gradient(135deg,#1e1b4b,#2e2a5e);color:#c7d2fe}
.ub{background:#06c;color:#fff!important;padding:9px 20px;border-radius:30px;font-weight:700;font-size:.75rem;display:inline-block;cursor:pointer;transition:.25s;border:none}
.ub:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,102,204,.3)}.ub2{background:#06c;color:#fff!important;padding:12px 28px;border-radius:30px;font-weight:700;font-size:.85rem;display:inline-block;cursor:pointer;transition:.25s;border:none}
.ub2:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,102,204,.3)}.btl{font-weight:800;font-size:1.1rem;color:var(--p)!important}
.nl{background:linear-gradient(135deg,var(--p),#8a2216);border-radius:var(--r);padding:24px;margin-bottom:28px;color:#fff;text-align:center;position:relative;overflow:hidden}
.nl h3{font-size:1rem;font-weight:700;margin-bottom:4px}.nl p{opacity:.85;font-size:.75rem;margin-bottom:14px}
.nl form{display:flex;gap:8px;max-width:380px;margin:0 auto}.nl input{flex:1;padding:11px 16px;border-radius:30px;border:none;font-size:.8rem;outline:none}
.nl button{padding:11px 24px;background:#fff;color:var(--p);border:none;border-radius:30px;font-weight:700;font-size:.8rem;cursor:pointer;transition:.25s}
.nl button:hover{transform:scale(1.04)}
.mod{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:200;align-items:center;justify-content:center;padding:14px}
.mod.on{display:flex}.mod .bx{background:var(--c);border-radius:var(--r);max-width:480px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.15)}
.mod .hd{padding:16px 20px 12px;border-bottom:1px solid var(--b);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--c);z-index:1}
.mod .hd h2{font-size:.9rem;font-weight:700}.mod .cl{background:var(--b);border:none;width:30px;height:30px;border-radius:50%;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--t2);transition:.25s}
.mod .cl:hover{background:var(--p);color:#fff}.mod .bd{padding:14px 20px 12px}
.cs{margin-bottom:16px}.cs h4{font-size:.76rem;font-weight:700;margin-bottom:6px}
/* CHIP SELECTION - BEAUTIFUL */
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chips button{padding:6px 14px;border:1.5px solid var(--b);border-radius:20px;background:var(--c);cursor:pointer;font-size:.65rem;font-weight:500;color:var(--t);transition:.2s;display:flex;align-items:center;gap:4px}
.chips button:hover{border-color:var(--s);background:rgba(245,166,35,.04)}
.chips button.sel{border-color:var(--p);background:rgba(199,59,43,.08);color:var(--p);font-weight:600}
.chips button.sel::before{content:"✓ ";font-size:.55rem}
.chips button.multi{padding:6px 14px}
.chips button.multi.sel{background:rgba(199,59,43,.06);border-color:var(--p)}
.mod .ft{padding:12px 20px 14px;border-top:1px solid var(--b);display:flex;justify-content:space-between;align-items:center;background:var(--c);position:sticky;bottom:0}
.mod .ft .tp{font-weight:800;font-size:1rem;color:var(--p)}.mod .ft .ok{background:var(--p);color:#fff;border:none;padding:9px 24px;border-radius:30px;font-weight:700;font-size:.75rem;cursor:pointer;transition:.25s}
.mod .ft .ok:hover{background:var(--p2);transform:scale(1.04)}
.co{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);z-index:300}.co.on{display:block}
.cp{position:fixed;top:0;right:-360px;width:360px;max-width:100vw;height:100vh;background:var(--c);z-index:301;transition:right .35s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;box-shadow:-4px 0 30px rgba(0,0,0,.1)}
.cp.on{right:0}.cp .hd{padding:16px 20px;border-bottom:1px solid var(--b);display:flex;justify-content:space-between;align-items:center}
.cp .hd h3{font-size:.82rem;font-weight:700}.cp .its{flex:1;overflow-y:auto;padding:8px 20px}
.cp .em{text-align:center;padding:40px 0;color:var(--t2);font-size:.85rem}
.ci{display:flex;gap:8px;padding:10px 0;border-bottom:1px solid var(--b)}.ci:last-child{border:none}
.ci .if{flex:1;min-width:0}.ci .if h4{font-size:.76rem;font-weight:600}.ci .if .cu{font-size:.62rem;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ci .ac{display:flex;align-items:center;gap:6px;flex-shrink:0}
.ci .ac .q{width:24px;height:24px;border-radius:50%;border:1.5px solid var(--b);background:var(--c);cursor:pointer;font-weight:700;font-size:.8rem;display:flex;align-items:center;justify-content:center;color:var(--t);transition:.2s}
.ci .ac .q:hover{border-color:var(--p);color:var(--p)}.ci .ac .n{font-weight:600;min-width:16px;text-align:center;font-size:.76rem}
.ci .ac .it{font-weight:700;color:var(--p);min-width:40px;text-align:right;font-size:.76rem}
.cp .ft{padding:12px 20px 16px;border-top:1px solid var(--b)}.cp .tr{display:flex;justify-content:space-between;font-weight:700;font-size:.82rem;margin-bottom:8px}
.cp .tr .ta{color:var(--p)}.cp .ck{width:100%;padding:12px;background:var(--p);color:#fff;border:none;border-radius:30px;font-weight:700;font-size:.76rem;cursor:pointer;transition:.25s}
.cp .ck:hover{background:var(--p2);transform:translateY(-1px);box-shadow:0 4px 12px rgba(199,59,43,.3)}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:var(--t);color:#fff;padding:12px 22px;border-radius:12px;font-size:.74rem;z-index:500;opacity:0;transition:.4s;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.15)}
.toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
.ni{display:none;position:fixed;bottom:16px;right:16px;z-index:50;background:linear-gradient(135deg,#1e1b4b,#312e81);color:#c7d2fe;padding:10px 14px;border-radius:12px;font-size:.6rem;font-weight:600;gap:6px;align-items:center;box-shadow:0 4px 16px rgba(0,0,0,.15)}
footer{background:#1a1a1a;color:rgba(255,255,255,.65);padding:32px 16px 16px;margin-top:32px}
[data-theme="dark"] footer{background:#0d0d0d}.fi{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px}
.fi h4{color:#fff;font-weight:700;font-size:.76rem;margin-bottom:6px}.fi p,.fi a{font-size:.68rem;color:rgba(255,255,255,.5);display:block;margin-bottom:4px}.fi a:hover{color:var(--s)}
.fb{max-width:1200px;margin:16px auto 0;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);text-align:center;font-size:.62rem}
@media(max-width:1024px){.mg{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}.hero h1{font-size:clamp(1.3rem,3.8vw,1.8rem)}}
@media(max-width:768px){.nv a:not(.ct):not(.tg){display:none}.mg{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}.cp{width:100vw;right:-100vw}.nl form{flex-direction:column}.hd{height:54px;padding:0 12px}.lg img{height:28px}.brand{font-size:.78rem}.hero{padding:32px 12px 28px}.mi{height:120px}}
@media(max-width:480px){.mi{height:100px}.mb{padding:8px 10px 10px}.sec{font-size:.9rem}.hero h1{font-size:clamp(1rem,6.5vw,1.2rem)}}
@media(max-width:360px){.mi{height:85px}}
@media(max-height:500px) and (orientation:landscape){.hero{padding:18px 14px 14px}.mi{height:90px}.hd{height:48px}header{position:relative}}
''')
    f.write('</style>\n')

    # === JS ===
    f.write('<script>\n')
    f.write(I_DECL+'\n')
    f.write("document.getElementById('logo').src=I.l;document.getElementById('about').src=I.l;\n")
    f.write('var M='+M_JSON+';\n')
    f.write(IMGJS+'\n')
    f.write("var cart=JSON.parse(localStorage.getItem('c')||'[]'),ci=null,cs={};\n")
    f.write("function rm(g,el){var items=g=='all'?M:M.filter(function(x){return x.c===g});var h='';for(var i=0;i<items.length;i++){var x=items[i];var ig=IMG[x.id]||I.co;var oc=x.cs?\"om('\"+x.id+\"')\":\"ai('\"+x.id+\"')\";h+='<div class=\"mc\" onclick=\"'+oc+'\"><div class=\"mi\" style=\"background-image:url('+ig+')\"></div><div class=\"mb\"><h3>'+x.n+'</h3><div class=\"d\">'+(x.d||'')+'</div><div class=\"mf\"><span class=\"pr\">'+x.p.toFixed(2)+'\\u20ac</span><button class=\"bt\" onclick=\"event.stopPropagation();'+oc+'\">+</button></div></div></div>';}el.innerHTML=h;}\n")
    f.write("['mg','mg2'].forEach(function(g){var e=document.getElementById(g);if(e)rm('all',e)});\n")
    f.write("document.querySelectorAll('.tb button').forEach(function(b){b.addEventListener('click',function(){var p=b.closest('.pg');p.querySelectorAll('.tb button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');var id=p.id=='acc'?'mg':'mg2';rm(b.dataset.c,document.getElementById(id))})});\n")
    f.write("function gp(p){document.querySelectorAll('.pg').forEach(function(x){x.classList.add('h')});document.getElementById(p).classList.remove('h');document.querySelectorAll('.nv a').forEach(function(x){x.classList.remove('sl')});var n=document.getElementById('na-'+p);if(n)n.classList.add('sl')}\n")
    f.write("function nl(e){e.preventDefault();var v=document.getElementById('nlmail')||e.target.querySelector('input');if(v.value){ts('✅ '+v.value+' inscrit !');v.value='';try{localStorage.setItem('nl_'+v.value,'1')}catch(e){}}}\n")
    # Options arrays
    f.write("var CU=['Froid','Chaud'];var VI=['Jambon blanc','Jambon fum\u00e9','Poulet r\u00f4ti','Dinde','Salami','Pastrami','Rosbif','Thon'];var CR=['Salade','Tomates','Concombre','Oignons','Poivrons','Ma\u00efs','Carottes','Cornichons'];var SA=['Mayo','Ketchup','Moutarde','Blanche','Alg\u00e9rienne','Andalouse','Samoura\u00ef','Huile olive'];\n")
    # om() with CHIPS style (beautiful!)
    f.write("function om(id){var i=M.find(function(x){return x.id===id});if(!i||!i.cs)return;ci=i;cs={};document.getElementById('mt').textContent='🥪 '+i.n;var mb=document.getElementById('mb');mb.innerHTML='<div class=\"cs\"><h4>🔥 Cuisson</h4><div class=\"chips\">'+CU.map(function(v){return '<button onclick=\"sel(\\'cu\\',\\''+v+'\\',this)\">'+v+'</button>'}).join('')+'</div></div><div class=\"cs\"><h4>🥩 Viande</h4><div class=\"chips\">'+VI.map(function(v){return '<button onclick=\"sel(\\'v\\',\\''+v+'\\',this)\">'+v+'</button>'}).join('')+'</div></div><div class=\"cs\"><h4>🥗 Crudit\u00e9s <span style=\"font-weight:400;color:var(--t2);font-size:.65rem\">(plusieurs)</span></h4><div class=\"chips\">'+CR.map(function(v){return '<button class=\"multi\" onclick=\"sel(\\'r\\',\\''+v+'\\',this)\">'+v+'</button>'}).join('')+'</div></div><div class=\"cs\"><h4>🧂 Sauce</h4><div class=\"chips\">'+SA.map(function(v){return '<button onclick=\"sel(\\'s\\',\\''+v+'\\',this)\">'+v+'</button>'}).join('')+'</div></div>';document.getElementById('mp').textContent=i.p.toFixed(2)+'€';document.getElementById('mod').classList.add('on');document.body.style.overflow='hidden'}\n")
    f.write("function sel(k,v,el){if(k=='r'){el.classList.toggle('sel');cs[k]=[].map.call(el.parentNode.querySelectorAll('.sel'),function(b){return b.textContent})}else{el.parentNode.querySelectorAll('button').forEach(function(b){b.classList.remove('sel')});el.classList.add('sel');cs[k]=v}}\n")
    f.write("function cm(){document.getElementById('mod').classList.remove('on');document.body.style.overflow='';ci=null;cs={}}\n")
    f.write("function cf(){if(!ci||!cs.cu||!cs.v||!cs.s)return;var t='🔥 '+cs.cu+' . 🥩 '+cs.v+' . 🥗 '+(cs.r||['-']).join(', ')+' . 🧂 '+cs.s;var idx=cart.findIndex(function(i){return i.id===ci.id&&i.cu===t});if(idx>-1)cart[idx].q+=1;else cart.push({id:ci.id,n:ci.n,p:ci.p,cu:t,q:1});cm();sv();ts('🥪 '+ci.n+' ajout\u00e9 !')}\n")
    f.write("document.getElementById('mod').addEventListener('click',function(e){if(e.target===this)cm()});\n")
    f.write("function ai(id){var i=M.find(function(x){return x.id===id});if(!i)return;var idx=cart.findIndex(function(x){return x.id===id&&!x.cu});if(idx>-1)cart[idx].q+=1;else cart.push({id:i.id,n:i.n,p:i.p,cu:null,q:1});sv();ts('🍽️ '+i.n+' ajout\u00e9 !')}\n")
    f.write("function sv(){try{localStorage.setItem('c',JSON.stringify(cart))}catch(e){}uc()}\n")
    f.write("function uc(){var n=cart.reduce(function(s,i){return s+i.q},0),t=cart.reduce(function(s,i){return s+i.p*i.q},0);document.getElementById('cc').textContent=n;document.getElementById('ct').textContent=t.toFixed(2)+'€';document.getElementById('c2').textContent=t.toFixed(2)+'€';var c=document.getElementById('ci');if(!cart.length){c.innerHTML='<div class=\"em\">🥪 Panier vide</div>';return}c.innerHTML=cart.map(function(i,idx){return '<div class=\"ci\"><div class=\"if\"><h4>'+i.n+'</h4>'+(i.cu?'<div class=\"cu\">'+i.cu+'</div>':'')+'</div><div class=\"ac\"><button class=\"q\" onclick=\"cq('+idx+',-1)\">−</button><span class=\"n\">'+i.q+'</span><button class=\"q\" onclick=\"cq('+idx+',1)\">+</button><span class=\"it\">'+(i.p*i.q).toFixed(2)+'€</span></div></div>'}).join('')}\n")
    f.write("function cq(idx,d){try{cart[idx].q+=d;if(cart[idx].q<=0)cart.splice(idx,1);sv()}catch(e){}}\n")
    f.write("function tc(){document.getElementById('co').classList.toggle('on');document.getElementById('cp').classList.toggle('on');document.body.style.overflow=document.getElementById('co').classList.contains('on')?'hidden':''}\n")
    # ck() - Commande avec WhatsApp comme canal principal, avec lien API admin
    f.write("function ck(){if(!cart.length)return;var t=cart.reduce(function(s,i){return s+i.p*i.q},0);var its=cart.map(function(i){return '* '+i.q+'x '+i.n+(i.cu?' ('+i.cu.substring(0,30)+'...)':'')+' - '+(i.p*i.q).toFixed(2)+'€'}).join('%0a');var msg='🥪 *NOUVELLE COMMANDE*%0a%0a'+its+'%0a%0a📦 *Total: '+t.toFixed(2)+'€*%0a%0a⏱️ Livraison estimée: 20-30 min%0a📞 Réponse sous 5 min';if(confirm('📦 Total: '+t.toFixed(2)+'€%0a⏱️ Livraison estimée: 20-30 min%0a%0a📱 Commander par WhatsApp ?')){window.location.href='https://wa.me/33672044875?text='+encodeURIComponent(msg).replace(/%0A/g,'%0a');cart=[];sv();tc();ts('✅ Commande envoyée par WhatsApp !')}}\n")
    f.write("function ts(m){var t=document.getElementById('toast');t.classList.add('on');document.getElementById('tm').textContent=m;clearTimeout(window._tt);window._tt=setTimeout(function(){t.classList.remove('on')},3000)}\n")
    f.write("document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(document.getElementById('mod').classList.contains('on'))cm();else if(document.getElementById('cp').classList.contains('on'))tc()}});\n")
    f.write("function shareMenu(){if(navigator.share){navigator.share({title:\"FAIS TON S'DALLE\",text:\"🥪 Crée ton sandwich sur mesure ! Chaud ou froid !\",url:\"https://faistonsdalle.fr\"}).catch(function(){})}else{prompt(\"Copie ce lien :\",\"https://faistonsdalle.fr\")}}\n")
    f.write("uc();\n(function(){var h=new Date().getHours(),n=(h>=23||h<6);document.getElementById('nb').style.display=n?'block':'none';document.getElementById('ni').style.display=n?'flex':'none'})();\n")
    f.write("window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(e){if(!localStorage.getItem('t')){document.documentElement.dataset.theme=e.matches?'dark':'light';document.getElementById('tt').textContent=e.matches?'☀️':'🌙'}});\n")
    f.write("setInterval(function(){var h=new Date().getHours();document.getElementById('nb').style.display=(h>=23||h<6)?'block':'none';document.getElementById('ni').style.display=(h>=23||h<6)?'flex':'none'},60000);\n")
    f.write("var st=localStorage.getItem('t')||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.dataset.theme=st;document.getElementById('tt').textContent=st==='dark'?'☀️':'🌙';\n")
    f.write("function tt(){var t=document.documentElement.dataset.theme,n=t==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem('t',n);document.getElementById('tt').textContent=n==='dark'?'☀️':'🌙'}\n")
    f.write('</script>\n</body>\n</html>')

print("✅ FINI !")
import re
size = os.path.getsize('index.html')
print(f'Taille: {size} bytes ({size/1024:.1f}KB)')
with open('index.html','r') as f: h=f.read()
js = re.findall(r'<script>(?!.*application)(.*?)</script>', h, re.DOTALL)
for s in js:
    if 'function rm(' in s or 'function ck' in s:
        print(f'Braces: {s.count(chr(123))} vs {s.count(chr(125))} {"OK" if s.count(chr(123))==s.count(chr(125)) else "FAIL"}')
        break
