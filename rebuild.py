#!/usr/bin/env python3
"""Regenerate index.html - safe version"""
import json, os, subprocess, tempfile

with open('index.html', 'r') as f:
    content = f.read()

# Find what's left: head, CSS, JS 
head_end = content.find('</head>')
style_end = content.find('</style>')
script_start = content.rfind('<script>')
script_end = content.rfind('</script>')

head = content[:head_end+7]  # <head>...</head>
css = content[content.find('<style>'):style_end+8]
js = content[script_start:script_end+9]
tail = content[script_end+9:]

# Verify we have valid CSS
if '<style>' not in css:
    print("❌ CSS missing!")
    exit(1)
if '<script>' not in js:
    print("❌ JS missing!")
    exit(1)

# Now rebuild: put everything back together with the HTML body
# Read the body from a template or reconstruct it

# Let me use a different approach - just extract and fix the HTML body
# from the original 81KB version by checking what's missing

# The problem is I have CSS and JS but no HTML body content between </style> and <script>
# I need to insert all the HTML content

body_html = r'''
<div class="bar"><span>☀️ 11h30–23h</span><span class="n">🌙 Livraison 23h–06h</span><span class="h-badge">🕌 Halal</span><span>⭐ 4.5</span></div>
<header><div class="hd"><a href="#" class="lg"><img src="/images/logo.jpg" alt="FAIS TON S\'DALLE" id="logo"><div class="br">FAIS TON S'DALLE<span class="sub">Sandwichs sur mesure</span></div></a>
<nav class="nv"><a class="sl" id="na-acc">Accueil</a><a id="na-menu">Menu</a><a id="na-ap">Infos</a><a id="na-con">Contact</a>
<button class="ham" id="ham">☰</button><button class="tg" id="tt">🌙</button><div class="ct" id="ct">🛒<span class="cb" id="cc">0</span></div></nav></div></header>
<div class="mn" id="mn"></div>
<div class="nb" id="nb">🌙 Livraison 23h-06h</div>
<div class="hero"><div class="hero-c"><div class="hero-badge">⭐ 4.5 · Halal · Les Pavillons-sous-Bois · 23h-06h</div>
<h1>Crée ton <span class="h">sandwich</span> sur mesure</h1>
<p class="hero-p">🥩 Tenders · poulet · dinde · pastrami · thon · 8 crudités · 9 sauces</p>
<div class="hero-acts"><a class="hero-btn">Voir le menu</a><a class="hero-btn2">📱 WhatsApp</a></div></div>
<div class="hero-particles"><div class="hero-particle">🥪</div><div class="hero-particle">🥩</div><div class="hero-particle">🥗</div><div class="hero-particle">🥤</div></div></div>
'''

# This approach is too complex. Let me just write the minimal missing HTML.
# Actually the best approach is to write the ENTIRE file from scratch.

print("Need to write full file - CSS and JS preserved but HTML body lost")
print(f"CSS length: {len(css)}")
print(f"JS length: {len(js)}")
print(f"Head length: {len(head)}")

# Let me take a different approach: write the CSS and JS to files, 
# then use the Python generator to create the complete file
with open('style_backup.css', 'w', encoding='utf-8') as f:
    f.write(css.replace('<style>','').replace('</style>',''))

with open('script_backup.js', 'w', encoding='utf-8') as f:
    f.write(js.replace('<script>','').replace('</script>',''))

print("✅ CSS and JS backed up")
print(f"✅ CSS: {len(css)} chars -> style_backup.css")
print(f"✅ JS: {len(js)} chars -> script_backup.js")
