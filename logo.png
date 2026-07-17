import re
with open('index.html','r') as f:
    h = f.read()

checks = [
    ('Favicon SVG visible (sandwich)', 'image/svg+xml' in h),
    ('Favicon apple-touch', 'apple-touch-icon' in h),
    ('Texte "FAIS TON S\'DALLE" en noir', '.brand{font-weight:800' in h),
    ('Plus de barre <s>', '<s>' not in h.split('Sandwichs sur mesure')[0]),
    ('Cuisson chaud/froid dans om()', 'CU=' in h and 'Chaud' in h and 'Froid' in h),
    ('Selecteur chips design', '.chips button' in h and 'border-radius:20px' in h),
    ('Telephone bien affiche', 'font-size:1.3rem' in h and '06 72 04 48 75' in h),
    ('Commande WhatsApp avec recapitulatif', 'wa.me/33672044875?text=' in h),
    ('Temps estime 20-30 min', '20-30 min' in h),
    ('Infos livraison section', 'Infos livraison' in h or 'Zone' in h),
    ('Images en fichiers statiques', 'data:image' not in h.split('</head>')[0]),
    ('Taille sous 50KB', len(h) < 50000),
]

# JS braces
js = re.findall(r'<script>(?!.*application)(.*?)</script>', h, re.DOTALL)
for s in js:
    if 'function tt' in s:
        braces_ok = s.count('{') == s.count('}')
        checks.append(('JS braces equilibrees', braces_ok))
        break

for name, ok in checks:
    print(f'  {"OK" if ok else "X"} {name}')

print(f'\nTaille: {len(h)} bytes ({len(h)/1024:.1f}KB)')
print(f'Total: {sum(1 for _,v in checks if v)}/{len(checks)}')
