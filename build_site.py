#!/usr/bin/env python3
"""Generate the complete index.html for FAIS TON S'DALLE"""
import json, os

# ============================================================
# DATA
# ============================================================
IMAGES = {
    'l': '/images/logo.jpg',
    'a': '/images/menu-leger.jpg',
    'b': '/images/menu-classique.jpg',
    'c': '/images/menu-gourmand.jpg',
    'd': '/images/tiramisu.jpg',
    'm': '/images/milkshake.png',
    'co': '/images/coca.jpg',
    'cz': '/images/zero.jpg',
    'pe': '/images/pepsi.jpg',
    'oa': '/images/oasis.jpg',
    'li': '/images/icetea.jpg',
    'or': '/images/orangina.jpg',
    'cr': '/images/cristaline.jpg',
    'sp': '/images/sanpellegrino.jpg',
}

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

IMG_MAP = {
    'l': IMAGES['a'], 'c': IMAGES['b'], 'g': IMAGES['c'],
    't': IMAGES['d'], 'm': IMAGES['m'],
    'co': IMAGES['co'], 'cz': IMAGES['cz'], 'pe': IMAGES['pe'],
    'oa': IMAGES['oa'], 'li': IMAGES['li'], 'or': IMAGES['or'],
    'cr': IMAGES['cr'], 'sp': IMAGES['sp'],
}

ITEM_HTML = """<div class="crd" onclick="oc(this)"><div class="crd-img" style="background-image:url(IMG)" loading="lazy">BADGE</div><div class="crd-body"><h3>NAME</h3><div class="crd-desc">DESC</div><div class="crd-ft"><span class="crd-pr">PRICE</span><button class="add-btn" onclick="event.stopPropagation();oc(this)">+</button></div></div></div>"""

ITEMS_JSON = json.dumps(ITItems, ensure_ascii=False)

# ============================================================
# HTML GENERATION
# ============================================================
def build():
    lines = []
    ap = lines.append
    
    ap('<!DOCTYPE html>')
    ap('<html lang="fr" data-theme="light">')
    ap('<head>')
    ap('<meta charset="UTF-8">')
    ap('<meta name="viewport" content="width=device-width,initial-scale=1">')
    ap('<title>FAIS TON S\'DALLE — Sandwichs sur mesure Halal | Les Pavillons-sous-Bois 93320</title>')
    ap('<meta name="description" content="Crée ton sandwich sur mesure chez FAIS TON S\'DALLE. Halal. Sandwich tenders, poulet, dinde, pastrami, rosette, thon. Livraison 23h-06h aux Pavillons-sous-Bois 93320. À emporter ou livraison. Paiement Stripe.">')
    ap('<meta name="author" content="FAIS TON S\'DALLE">')
    ap('<meta name="geo.placename" content="Les Pavillons-sous-Bois">')
    ap('<meta name="geo.region" content="FR-93">')
    ap('<meta name="geo.position" content="48.906;2.511">')
    ap('<meta name="ICBM" content="48.906, 2.511">')
    ap('<meta name="bingbot" content="index,follow">')
    ap('<meta name="robots" content="index,follow">')
    ap('<link rel="canonical" href="https://faistonsdalle.com">')
    ap('<link rel="alternate" href="https://faistonsdalle.com" hreflang="fr">')
    ap('<link rel="alternate" href="https://faistonsdalle.com" hreflang="x-default">')
    ap('<meta property="og:type" content="restaurant.menu">')
    ap('<meta property="og:site_name" content="FAIS TON S\'DALLE">')
    ap('<meta property="og:locale" content="fr_FR">')
    ap('<meta property="og:url" content="https://faistonsdalle.com">')
    ap('<meta property="og:title" content="FAIS TON S\'DALLE">')
    ap('<meta property="og:description" content="Crée ton sandwich sur mesure chez FAIS TON S\'DALLE. Halal. Tenders, poulet, dinde, pastrami, thon, rosette. Livraison nocturne 23h-06h.">')
    ap('<meta property="og:image" content="https://faistonsdalle.com/images/logo.jpg">')
    ap('<meta name="twitter:card" content="summary_large_image">')
    ap('<meta name="twitter:title" content="FAIS TON S\'DALLE">')
    ap('<meta name="theme-color" content="#c73b2b">')
    ap('<link rel="manifest" href="/manifest.json">')
    ap('<link rel="icon" type="image/jpeg" sizes="48x48" href="/images/favicon.jpg">')
    ap('<link rel="icon" type="image/jpeg" sizes="180x180" href="/images/apple-icon.jpg">')
    ap('<link rel="apple-touch-icon" sizes="180x180" href="/images/apple-icon.jpg">')
    ap('<link rel="preconnect" href="https://fonts.googleapis.com">')
    ap('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>')
    ap('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">')
    ap('<script src="https://js.stripe.com/v3/"></script>')
    
    # JSON-LD
    ap('<script type="application/ld+json">')
    ap(json.dumps({
        "@context": "https://schema.org",
        "@type": "FastFoodRestaurant",
        "@id": "https://faistonsdalle.com",
        "name": "FAIS TON S'DALLE",
        "url": "https://faistonsdalle.com",
        "telephone": "+33672044875",
        "image": "https://faistonsdalle.com/images/logo.jpg",
        "servesCuisine": ["Sandwichs", "Fast Food", "Halal", "Street Food", "French"],
        "priceRange": "\u20ac-\u20ac\u20ac",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "134 Allee du Colonel Fabien",
            "addressLocality": "Les Pavillons-sous-Bois",
            "postalCode": "93320",
            "addressCountry": "FR"
        },
        "geo": {"@type": "GeoCoordinates", "latitude": "48.906", "longitude": "2.511"},
        "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.5", "ratingCount": "47", "bestRating": "5"},
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "name": "Service jour", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "11:30", "closes": "23:00"},
            {"@type": "OpeningHoursSpecification", "name": "Livraison nuit", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "23:00", "closes": "06:00"}
        ],
        "sameAs": ["https://www.tiktok.com/@faistonsdalle", "https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g", "https://share.google/ohtsRFBl72o22DEi4"]
    }, ensure_ascii=False))
    ap('</script>')
    ap('<link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml">')
    ap('</head>')
    ap('<body>')
    
    # BAR
    ap('<div class="bar"><span>\u2600\ufe0f 11h30\u201323h</span><span class="n">\U0001f319 Livraison 23h\u201306h</span><span class="h-badge">\U0001f54c Halal</span><span>\u2b50 4.5 \u00b7 93320</span></div>')
    
    # HEADER
    ap('<header><div class="hd"><a href="#" class="lg"><img src="/images/logo.jpg" alt="FAIS TON S\'DALLE" id="logo"><div class="br">FAIS TON S\'DALLE<span class="sub">Sandwichs sur mesure</span></div></a><nav class="nv"><a class="sl" id="na-acc">Accueil</a><a id="na-menu">Menu</a><a id="na-ap">Infos</a><a id="na-con">Contact</a><button class="ham" id="ham" aria-label="Menu">\u2630</button><button class="tg" id="tt">\U0001f319</button><div class="ct" id="ct">\U0001f6d2<span class="cb" id="cc">0</span></div></nav></div></header>')
    ap('<div class="mn" id="mn"></div>')
    
    # NIGHT BANNER
    ap('<div class="nb" id="nb">\U0001f319 Livraison 23h-06h \u00b7 <a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" rel="noopener">Uber Eats</a></div>')
    
    # HERO
    ap('<div class="hero"><div class="hero-c"><div class="hero-badge">\u2b50 4.5 \u00b7 \U0001f54c Halal \u00b7 Les Pavillons-sous-Bois \u00b7 Livraison 23h-06h</div><h1>Cr\u00e9e ton <span class="h">sandwich</span> sur mesure</h1><p class="hero-p">\U0001f969 Tenders \u00b7 poulet \u00b7 dinde \u00b7 pastrami \u00b7 thon \u00b7 \U0001f957 8 crudit\u00e9s \u00b7 \U0001f9c2 9 sauces</p><div class="hero-acts"><a class="hero-btn">Voir le menu</a><a class="hero-btn2">\U0001f4f1 WhatsApp</a></div></div><div class="hero-particles"><div class="hero-particle">\U0001f96a</div><div class="hero-particle">\U0001f969</div><div class="hero-particle">\U0001f957</div><div class="hero-particle">\U0001f964</div></div></div>')
    
    # PAGE: ACCUEIL
    ap('<div class="pg" id="acc"><div class="w"><div class="sec"><span class="hl">Menu</span></div>')
    ap('<div class="tabs"><button class="on" data-c="all">\U0001f525 Tout</button><button data-c="menus">\U0001f96a Sandwichs</button><button data-c="desserts">\U0001f370 Desserts</button><button data-c="boissons">\U0001f964 Boissons</button></div>')
    ap('<div class="grid" id="mg"></div>')
    ap('<div class="sec"><span class="hl">Avis</span></div>')
    ap('<div class="rv" id="rv"></div>')
    ap('<div style="text-align:center;margin:0 0 24px"><a href="https://share.google/ohtsRFBl72o22DEi4" target="_blank" rel="noopener" class="ub" style="background:var(--p)">\u2b50 Laisser un avis Google</a></div>')
    ap('<div class="nl"><h3>\U0001f4ec Newsletter</h3><p>Promos et nouveaut\u00e9s.</p><form id="nl1"><input type="email" id="nlmail" placeholder="ton@email.fr" required><button type="submit">\u2192</button></form></div></div></div>')
    
    # PAGE: MENU
    ap('<div class="pg h" id="menu"><div class="w" style="padding-top:16px"><div class="sec"><span class="hl">Carte</span></div>')
    ap('<div class="tabs"><button class="on" data-c="all">\U0001f525 Tout</button><button data-c="menus">\U0001f96a Sandwichs</button><button data-c="desserts">\U0001f370 Desserts</button><button data-c="boissons">\U0001f964 Boissons</button></div>')
    ap('<div class="grid" id="mg2"></div>')
    ap('<div style="text-align:center;margin:24px 0"><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" rel="noopener" class="ub2">\U0001f6f5 Commander sur Uber Eats</a></div></div></div>')
    
    # PAGE: A PROPOS
    ap('<div class="pg h" id="ap"><div class="w"><div class="ap"><div class="im"><img src="/images/store-front.jpeg" alt="FAIS TON S\'DALLE" id="about" class="store-img"><p style="font-size:.6rem;color:var(--t2);margin-top:4px">\U0001f4cd 134 All\u00e9e du Colonel Fabien, 93320</p></div>')
    ap('<h2>\u00c0 propos</h2>')
    ap('<p><strong>FAIS TON S\'DALLE</strong> \u2013 Sandwichs sur mesure <strong>Halal</strong> \u00e0 <strong>Les Pavillons-sous-Bois</strong> (93320). Paiement 100% s\u00e9curis\u00e9 par <strong>Stripe</strong>.</p>')
    ap('<div class="ap-gallery"><img src="/images/google-photo-1.jpeg" alt="" loading="lazy"><img src="/images/google-photo-2.jpeg" alt="" loading="lazy"><img src="/images/google-photo-3.jpeg" alt="" loading="lazy"><img src="/images/google-photo-4.jpeg" alt="" loading="lazy"></div>')
    ap('<div class="cd"><h3>\U0001f969 Viandes</h3><p>Tenders, Eminc\u00e9 de poulet, Blanc de dinde, Jambon de dinde, Pastrami, Rosette, Thon</p></div>')
    ap('<div class="cd"><h3>\U0001f957 Crudit\u00e9s & \U0001f9c0 Suppl\u00e9ments</h3><p>Salade, Tomate, Concombre, Oignons, Poivrons, Ma\u00efs, Carottes r\u00e2p\u00e9es, Avocat \u00b7 Cheddar, Mozzarella, Feta</p></div>')
    ap('<div class="cd"><h3>\U0001f9c2 9 Sauces</h3><p>Mayo, Ketchup, Alg\u00e9rienne, Samoura\u00ef, Blanche, Moutarde, Brasil, Chili, Thai</p></div>')
    ap('<div class="cd"><h3>\U0001f370 Desserts</h3><p>Tiramisu (Caramel/Chocolat/Sp\u00e9culos) \u00b7 Milkshake (Snickers/M&Ms/KitKat + coulis 0,50\u20ac)</p></div>')
    ap('<div class="cd"><h3>Carte & Horaires</h3><p><strong>Menu L\u00e9ger 6,90\u20ac</strong> \u00b7 <strong>Menu Classique 7,90\u20ac</strong> \u00b7 <strong>Menu Gourmand 9,90\u20ac</strong></p><p>Tiramisu 3\u20ac \u00b7 Milkshake 5\u20ac \u00b7 Boissons 1\u20ac \u00b7 \u2600\ufe0f Service 11h30-23h \u00b7 \U0001f319 Livraison 23h-06h \u00b7 \U0001f54c Halal</p></div>')
    ap('<div class="cd"><h3>\U0001f4cd Contact</h3><p>134 All\u00e9e du Colonel Fabien, 93320 \u00b7 \U0001f4de <a href="tel:+33672044875" class="btl">06 72 04 48 75</a> \u00b7 <a href="https://maps.google.com/maps?q=FAIS+TON+S%E2%80%99DALLE+134+All%C3%A9e+du+Colonel+Fabien+93320" target="_blank" rel="noopener" style="color:var(--p)">\U0001f4cd Google Maps</a></p><div class="qr-section"><div class="qr-img">\U0001f4cd</div><div><h3 style="font-size:.82rem;font-weight:600;margin-bottom:4px">Nous trouver</h3><p style="font-size:.7rem;color:var(--t2);margin-bottom:6px">134 All\u00e9e du Colonel Fabien, 93320 Les Pavillons-sous-Bois</p><a href="https://maps.google.com/maps?q=FAIS+TON+S%27DALLE+134+All%C3%A9e+du+Colonel+Fabien+93320" target="_blank" rel="noopener" class="ub" style="background:var(--p);font-size:.65rem;padding:6px 14px">\U0001f4cd Ouvrir dans Google Maps</a></div></div></div>')
    ap('</div></div></div>')
    
    # PAGE: CONTACT
    ap('<div class="pg h" id="con"><div class="w" style="padding-top:16px"><div class="sec"><span class="hl">Commander</span></div>')
    ap('<div class="cmd-mode"><div class="cmd-toggle"><button class="on" id="mode-livraison">\U0001f69a Livraison</button><button id="mode-emporter">\U0001f961 \u00c0 emporter</button></div></div>')
    ap('<div class="cmd-addr" id="cmd-addr"><h3>\U0001f4cd Adresse</h3><input type="text" id="cmd-address" placeholder="Ex: 10 Rue de Paris, 93320" class="mod-ta"><p class="cmd-zone">\U0001f69a Les Pavillons-sous-Bois \u00b7 20-30 min</p></div>')
    ap('<div class="inf"><div><div class="ic">\U0001f4cd</div><h3>Adresse</h3><p>134 All\u00e9e du Colonel Fabien<br>93320</p></div><div><div class="ic">\U0001f550</div><h3>Horaires</h3><div class="hg"><div><span>\u2600\ufe0f Service</span><span>11h30-23h</span></div><div class="nt"><span>\U0001f319 Livraison</span><span>23h-06h</span></div></div><span class="hb">7j/7</span></div><div><div class="ic">\U0001f4de</div><h3>T\u00e9l\u00e9phone</h3><p class="phone-num"><a href="tel:+33672044875">06 72 04 48 75</a></p></div><div><div class="ic">\U0001f69a</div><h3>Commander</h3><p>Uber Eats \u00b7 T\u00e9l\u00e9phone</p><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" rel="noopener" class="ub" style="margin-top:6px">\U0001f6f5 Uber Eats</a></div></div>')
    ap('<div style="display:flex;gap:12px;justify-content:center;margin:16px 0;flex-wrap:wrap"><a class="ub" style="background:#25D366">\U0001f4f1 WhatsApp</a><a href="https://share.google/ohtsRFBl72o22DEi4" target="_blank" rel="noopener" class="ub" style="background:var(--p)">\u2b50 Avis Google</a></div>')
    ap('<div class="sec"><span class="hl">Avis clients</span></div><div class="rv" id="rv2"></div>')
    ap('<div class="nl" style="margin-top:20px"><h3>\U0001f4ec Newsletter</h3><p>Promos.</p><form id="nl2"><input type="email" placeholder="ton@email.fr" required><button type="submit">\u2192</button></form></div></div></div>')
    
    # MODAL: SANDWICH
    ap('<div class="mod" id="mod"><div class="mod-bx"><div class="mod-hd"><h2>\U0001f96a Personnalise</h2><button class="mod-cl" id="mc1">\u2715</button></div><div class="mod-bd" id="mb"></div><div class="mod-inst"><h4>\u270f\ufe0f Instructions</h4><textarea id="mi" class="mod-ta" placeholder="Ex: pas d\'oignons..." rows="2"></textarea></div><div class="mod-ft"><div class="mod-pr" id="mp"></div><button class="mod-ok" id="mo1">Ajouter \u2192</button></div></div></div>')
    
    # MODAL: TIRAMISU
    ap('<div class="mod" id="mod-t"><div class="mod-bx"><div class="mod-hd"><h2>\U0001f370 Tiramisu</h2><button class="mod-cl" id="mc2">\u2715</button></div><div class="mod-bd" id="mb-t"></div><div class="mod-ft"><div class="mod-pr" id="mp-t">3,00\u20ac</div><button class="mod-ok" id="mo2">Ajouter \u2192</button></div></div></div>')
    
    # MODAL: MILKSHAKE
    ap('<div class="mod" id="mod-m"><div class="mod-bx"><div class="mod-hd"><h2>\U0001f964 Milkshake</h2><button class="mod-cl" id="mc3">\u2715</button></div><div class="mod-bd" id="mb-m"></div><div class="mod-inst"><h4>\u270f\ufe0f Instructions</h4><textarea id="mi-m" class="mod-ta" placeholder="Extra..." rows="2"></textarea></div><div class="mod-ft"><div class="mod-pr" id="mp-m">5,00\u20ac</div><button class="mod-ok" id="mo3">Ajouter \u2192</button></div></div></div>')
    
    # MODAL: PAYMENT
    ap('<div class="mod" id="mod-pay"><div class="mod-bx"><div class="mod-hd"><h2>\U0001f4b3 Paiement s\u00e9curis\u00e9</h2><button class="mod-cl" id="mc4">\u2715</button></div><div class="mod-bd" id="mb-pay">')
    ap('<div style="text-align:center;padding:10px 0"><div style="font-size:2.5rem;margin-bottom:6px">\U0001f512</div><h3 style="font-size:.95rem;font-weight:700;margin-bottom:4px">Paiement 100% s\u00e9curis\u00e9</h3><p style="font-size:.72rem;color:var(--t2);margin-bottom:16px">CB \u00b7 Apple Pay \u00b7 Google Pay</p>')
    ap('<div style="display:flex;justify-content:center;gap:8px;margin-bottom:16px"><span style="font-size:1.5rem;opacity:.6">\U0001f4b3</span><span style="font-size:1.5rem;opacity:.6">\U0001f34e</span><span style="font-size:1.5rem;opacity:.6">\u25b6\ufe0f</span></div>')
    ap('<div class="pay-summary" style="background:var(--bg);border-radius:12px;padding:12px;margin-bottom:16px;border:1px solid var(--b)"><div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:4px"><span>Articles</span><span id="pay-count">0</span></div><div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:4px"><span>Livraison</span><span>Offerte</span></div><div style="display:flex;justify-content:space-between;font-size:.9rem;font-weight:700;color:var(--p);padding-top:6px;border-top:1px solid var(--b)"><span>Total</span><span id="pay-total">0,00\u20ac</span></div></div>')
    ap('<div style="display:flex;gap:6px;max-width:300px;margin:0 auto"><input type="text" id="pay-name" placeholder="Votre nom" class="mod-ta" style="margin-bottom:8px;width:100%"></div>')
    ap('<button id="pay-btn" class="mod-ok" style="width:100%;padding:12px;font-size:.82rem;margin-top:6px">\U0001f4b3 Payer maintenant</button>')
    ap('<p style="font-size:.6rem;color:var(--t2);margin-top:8px">Paiement via Stripe \u00b7 \U0001f512 Donn\u00e9es bancaires crypt\u00e9es</p>')
    ap('</div></div></div></div>')
    
    # CART OVERLAY
    ap('<div class="co" id="co"></div>')
    
    # CART PANEL
    ap('<div class="cp" id="cp"><div class="cp-hd"><div><h3>\U0001f6d2 Ton panier</h3><span id="cp-mode" style="font-size:.6rem;color:var(--t2);margin-left:6px"></span></div><button class="cp-x" id="cx">\u2715</button></div>')
    ap('<div class="cp-addr" id="cp-addr" style="display:none;padding:8px 20px;border-bottom:1px solid var(--b);font-size:.65rem;color:var(--t2)">\U0001f4cd <span id="cp-addr-text"></span></div>')
    ap('<div class="cp-its" id="ci"><div class="cp-em">\U0001f96a Panier vide</div></div>')
    ap('<div class="cp-ft"><div class="cp-tr"><span>Total</span><span class="cp-ta" id="ct"></span></div><button class="cp-ck" id="cpc">\U0001f4b3 Payer et commander <span id="c2"></span></button></div></div>')
    
    # TOAST
    ap('<div class="toast" id="toast">\u2705 <span id="tm"></span></div>')
    
    # NIGHT INDICATOR
    ap('<div class="ni" id="ni"><span>\U0001f319</span><span>Livraison<br><strong>23h-06h</strong></span></div>')
    
    # TOP BUTTON
    ap('<button id="top-btn">\u2191</button>')
    
    # FOOTER
    ap('<footer><div class="fi"><div><h4>FAIS TON S\'DALLE</h4><p>Sandwichs Halal. 7j/7.</p><p>\u2b50 4.5/5 \u00b7 47 avis \u00b7 \U0001f4b3 Stripe</p></div><div><h4>Contact</h4><p>\U0001f4de <a href="tel:+33672044875">06 72 04 48 75</a></p><p>\U0001f4cd 134 All\u00e9e du Colonel Fabien, 93320</p></div><div><h4>Suivez</h4><a href="https://www.tiktok.com/@faistonsdalle" target="_blank" rel="noopener">\U0001f3b5 TikTok</a><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" rel="noopener">\U0001f6f5 Uber Eats</a><a href="https://share.google/ohtsRFBl72o22DEi4" target="_blank" rel="noopener">\u2b50 Google Avis</a></div><div><h4>Infos</h4><a href="/mentions-legales.html">Mentions l\u00e9gales</a><a href="/cgv.html">CGV</a><a href="/mentions-legales.html#donnees">Politique confidentialit\u00e9</a></div></div>')
    ap('<div class="fb">\u00a9 2026 FAIS TON S\'DALLE \u2013 Les Pavillons-sous-Bois 93320</div></footer>')
    
    # ============================================================
    # CSS
    # ============================================================
    ap('<style>')
    ap(open('/dev/stdin').read() if False else '')
    # CSS will be appended from file
    ap('</style>')
    
    # ============================================================
    # JS  
    # ============================================================
    ap('<script>')
    ap(open('/dev/stdin').read() if False else '')
    ap('</script>')
    
    ap('</body>')
    ap('</html>')
    
    return '\n'.join(lines)

print("Building...")
# Write CSS from the old correct version
# Actually let me just inline the CSS and JS properly
print("Done")
PYEOF
