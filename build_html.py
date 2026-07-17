# 📊 ANALYSE COMPLÈTE DU PROJET — FAIS TON S'DALLE

**Date :** 15 juillet 2026  
**Projet :** Site web vitrine + commande pour restaurant de sandwichs  
**Adresse :** 134 Allée du Colonel Fabien, 93320 Les Pavillons-sous-Bois  
**Concept :** Sandwichs sur mesure (viande froide + crudités + sauce) — Livraison jour & nuit

---

## 📍 CONTEXTE & POSITIONNEMENT

| Critère | État |
|---------|------|
| **Marché** | Street food / Fast food sandwich |
| **Zone** | Les Pavillons-sous-Bois, Seine-Saint-Denis (93) |
| **Concept** | "Crée ton sandwich sur mesure" — Personnalisation totale |
| **Horaires** | Jour 11h-00h / Nuit 00h-06h (livraison) — 7j/7 |
| **Plateformes** | Uber Eats, Deliveroo, TikTok |
| **Note Google** | ⭐ 4.4/5 (14 avis) |
| **Téléphone** | 06 72 04 48 75 |
| **Concurrents directs** | Le Spécial, H Burger and Pizza, snacks locaux |

**Force concurrentielle unique :** Livraison nocturne 00h-06h — quasi aucun concurrent ne propose ça dans le secteur. Le concept "sur mesure" est aussi un gros plus.

---

## 🏗️ ARCHITECTURE TECHNIQUE DU PROJET

```
faistonsdalle/
├── index.html              ← Site complet (single page)
├── favicon.png              ← Logo = favicon (copie de logo.png)
├── logo.png                 ← Logo officiel du commerce (644×220)
│
├── images/
│   ├── menu-leger.jpeg      ← Photo Uber Eats (Menu Léger)
│   ├── menu-classique.jpeg  ← Photo Uber Eats (Menu Classique)
│   ├── menu-gourmand.jpeg   ← Photo Uber Eats (Menu Gourmand)
│   ├── tiramisu.jpeg        ← Photo Uber Eats (Tiramisu)
│   ├── store-front.jpeg     ← Photo Uber Eats (façade)
│   ├── google-photo-1~4.jpeg← Photos Google Business Profile
│   └── og-image.jpeg        ← Image partage réseaux
│
├── sql/
│   └── schema.sql           ← Tables PostgreSQL (8 tables + seed)
│
├── api/
│   └── order.js             ← Serverless Function Vercel
│
├── vercel.json              ← Config déploiement Vercel
├── .env.example             ← Variables d'environnement
├── robots.txt               ← SEO
├── sitemap.xml              ← SEO
├── manifest.json            ← PWA
│
└── analyse-complete-site.md ← Analyse complète
```

**Stack technique actuelle :**
- Frontend : HTML5 / CSS3 / JavaScript (vanilla, single file)
- Backend : Serverless (Vercel) via `/api/order.js`
- Base de données : PostgreSQL (Vercel Postgres)
- Déploiement : Vercel
- Images : Base64 inline (pour compatibilité preview)
- PWA : Manifest.json + theme-color

---

## 1. 🔴 POINTS FAIBLES & PROBLÈMES CRITIQUES

### 1.1 — Architecture monolithique (fichier unique)

**⚠️ Problème :** Tout le site est dans **un seul fichier HTML** (912 lignes, 1MB+). Le CSS, le JS, et les images base64 sont tous mélangés.

**🔧 Correction recommandée :** 
- Séparer le CSS (`styles.css`), le JS (`app.js`)
- Les images base64 devraient être chargées depuis le serveur, pas inline (sauf pour la preview)

**Priorité : 🔴 Haute**

---

### 1.2 — Fichier HTML trop volumineux (1MB+)

**⚠️ Problème :** Le fichier `index.html` fait **1MB** à cause des images base64. Un utilisateur sur mobile 4G attend 5-8 secondes.

**🔧 Correction recommandée :**
- **Sur Vercel :** Utiliser des vrais fichiers images (`images/xxx.jpeg`) + le cache HTTP (max-age=31536000 déjà dans vercel.json)
- Le base64 n'est nécessaire que pour la preview locale (sandbox)

**Priorité : 🔴 Haute**

**Solution concrète :** Faire 2 versions :
- `index.html` → version base64 (preview)
- `production.html` ou servir les images normalement

---

### 1.3 — Pas de vraie commande en ligne (panier factice)

**⚠️ Problème :** Le bouton "Commander" essaye d'appeler l'API `/api/order`. Si ça échoue (pas de backend), il redirige vers un appel téléphonique. Pas de paiement en ligne.

**🔧 Correction :**
- Déployer l'API Vercel (`/api/order.js`)
- Ajouter Stripe pour le paiement en ligne
- Ou utiliser un service comme SumUp / Square

**Priorité : 🔴 Haute**

---

### 1.4 — Pas de responsive parfait

**⚠️ Problème :** Les breakpoints sont définis (900px, 768px, 480px) mais :
- Pas testé sur iPhone SE / petit écran
- Le panier en plein écran sur mobile peut être mal positionné
- Les polices peuvent être trop petites

**🔧 Correction :** Tester et ajuster avec les devtools navigateur

**Priorité : 🟡 Moyenne**

---

## 2. 🟡 POINTS MOYENS / AMÉLIORABLES

### 2.1 — SEO : Manque de contenu textuel

**✅ Déjà OK :**
- ✅ Meta title & description optimisées (avec mots-clés : sandwich, crudités, 93320, livraison nuit)
- ✅ Open Graph + Twitter Cards
- ✅ JSON-LD Schema.org (FastFoodRestaurant + AggregateRating + FAQ)
- ✅ Hreflang (fr + x-default)
- ✅ Canonical, robots.txt, sitemap.xml
- ✅ Geo tags, phone, email
- ✅ Section "Notre Histoire" (200+ mots)

**❌ Manque :**
- **Page "Plan du site"** ou plusieurs pages (Google aime les sites avec 5+ pages)
- **Blog / actualités** (possibilité de poster des articles sur les nouveaux menus)
- **Liens externes** vers les avis Google (backlinks naturels)

**Priorité : 🟡 Moyenne**

---

### 2.2 — Section "Notre Histoire" trop courte

**⚠️ Problème :** Environ 200 mots. Google préfère 500+ mots pour bien référencer.

**🔧 Solution :** Ajouter plus de détails (histoire du fondateur, les valeurs, le processus de fabrication, les ingrédients locaux, etc.)

**Priorité : 🟡 Moyenne**

---

### 2.3 — Menu statique en dur (hardcodé)

**⚠️ Problème :** Les items du menu sont codés en dur en JavaScript. Pour modifier un prix ou ajouter un plat, il faut éditer le HTML.

**🔧 Solution :**
- Charger le menu depuis l'API PostgreSQL (`GET /api/menu`)
- Interface admin pour gérer le menu
- Les modifications apparaissent en temps réel

**Priorité : 🟡 Moyenne**

---

### 2.4 — Le panier est en localStorage

**⚠️ Problème :** Le panier est stocké dans localStorage : si l'utilisateur change de navigateur ou efface ses données, le panier est perdu. Pas de synchronisation entre appareils.

**🔧 Solution :** 
- Associer le panier à un email / téléphone (compte client)
- Stocker en base de données avec un UUID

**Priorité : 🟡 Basse**

---

### 2.5 — Pas de géolocalisation / zone de livraison

**⚠️ Problème :** Impossible de vérifier si l'adresse de livraison est dans la zone de couverture.

**🔧 Solution :**
- Ajouter une carte interactive avec la zone de livraison
- Utiliser l'API Google Maps pour vérifier l'adresse
- Afficher un message "Pas de livraison dans votre secteur" le cas échéant

**Priorité : 🟡 Basse**

---

## 3. 🟢 POINTS BONS / DÉJÀ SATISFAISANTS

### 3.1 — Design & UI

✅ Design moderne, épuré, proche d'Uber Eats  
✅ Palette couleur cohérente (rouge #c73b2b, doré #f5a623)  
✅ Typo propre (Inter / Segoe UI)  
✅ Animations fluides (fadeUp, modalIn, slideIn, skeleton loading)  
✅ Dark mode complet (toggle 🌙☀️)  
✅ Glassmorphism header (backdrop-filter: blur)  
✅ Responsive (3 breakpoints)  
✅ Tri des prix (défaut, asc, desc)  
✅ Scroll progress bar  

### 3.2 — UX & Fonctionnalités

✅ Personnalisation complète du sandwich (viande, crudités, sauce)  
✅ Panier dynamique avec quantités  
✅ Fidélité localStorage "10 sandwichs = 1 offert"  
✅ Newsletter (formulaire + stockage)  
✅ Avis clients visibles  
✅ Mode nuit automatique (00h-06h)  
✅ Toast notifications  
✅ Raccourci clavier (Échap pour fermer)  
✅ Section héros accrocheuse  

### 3.3 — SEO & Marketing

✅ JSON-LD complet (Schema.org FastFoodRestaurant)  
✅ AggregateRating (4.4/5, 14 avis)  
✅ FAQ structurée  
✅ BreadcrumbList  
✅ Open Graph + Twitter Cards  
✅ Hreflang  
✅ Robots.txt + Sitemap  
✅ Manifest PWA  
✅ Liens Uber Eats, Deliveroo, TikTok  
✅ Geo position + adresse complète  

### 3.4 — Images & Média

✅ Vraies photos depuis Uber Eats (4 items du menu)  
✅ Photos Google Business Profile  
✅ Logo officiel du commerce  
✅ Favicon complète (16px → 512px + Apple)  
✅ OG Image pour les réseaux sociaux  

### 3.5 — Technique

✅ Base de données PostgreSQL prête (8 tables, seed, indexes)  
✅ API Serverless Vercel  
✅ Variables d'environnement documentées  
✅ Config Vercel (headers sécurité, cache)  
✅ PWA (manifest.json + theme-color)  
✅ 1 fichier = tout le site (simplicité de déploiement)  

---

## 4. 📊 PERFORMANCE — ESTIMATION

| Métrique | Estimation | Commentaire |
|----------|-----------|-------------|
| **Taille HTML** | ~1MB | Trop lourd (base64) → 300KB max recommandé |
| **Taille JS** | ~15KB | Correct |
| **Taille CSS** | ~12KB | Correct |
| **Requêtes** | 1 (1 fichier) | Excellent |
| **Lighthouse mobile** | ~50-60/100 | À cause du poids des images base64 |
| **Lighthouse desktop** | ~70-80/100 | Correct |
| **Accessibilité** | ~85/100 | Balises aria, rôles, attributs alt |

---

## 5. 🚀 PLAN D'ACTION RECOMMANDÉ

### Phase 1 — Ce mois-ci (juillet 2026)

| # | Action | Effort | Impact | Détails |
|---|--------|--------|--------|---------|
| 1 | **Déployer sur Vercel** | 30 min | 🔟 | `vercel` dans le dossier + configurer les vars |
| 2 | **Ajouter le site dans Google Business** | 5 min | 9/10 | Mettre l'URL dans la fiche Google |
| 3 | **Soumettre à Google Search Console** | 10 min | 9/10 | Indexer le sitemap.xml |
| 4 | **Créer Instagram** @faistonsdalle | 15 min | 8/10 | Publier les photos Google + Uber |

### Phase 2 — Août 2026

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 5 | **Déployer PostgreSQL** (Vercel Storage) + API | 1h | 9/10 |
| 6 | **Système de commande Stripe** | 4h | 9/10 |
| 7 | **Campagne d'avis Google** (viser 50+) | 2h | 8/10 |
| 8 | **Photos pro des plats** | 2h | 7/10 |

### Phase 3 — Automne 2026

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 9 | **Ajouter menu végétarien / wraps** | 1h | 7/10 |
| 10 | **Happy hour (14h-16h)** | 30min | 6/10 |
| 11 | **Split CSS/JS (optimisation)** | 2h | 5/10 |
| 12 | **Système de commande SMS** | 4h | 6/10 |

---

## 6. 💡 SUGGESTIONS CRÉATIVES

### Fonctionnalités "game-changer"

1. **🔔 QR Code en boutique** "Scanne pour commander à emporter" → Prêt en arrivant
2. **📲 Ordre vocal** "Dis Siri, commande un Menu Gourmand chez Fais Ton S'Dalle"
3. **👨‍🍳 Build Your Own** : Afficher en live le sandwich qui se construit avec les choix
4. **🌙 Night Dashboard** : Pendant la nuit (00h-06h), le site passe en mode ultra simplifié (juste le menu nuit + numéro)
5. **🎰 Sandwich random** : "T'as la dalle mais pas d'idée ? Laisse-nous choisir pour toi !"
6. **📅 Menu de la semaine** : Chaque jour une suggestion spéciale (ex: "Jeudi Jambon-Beurre revisité")
7. **📍 Zone de livraison interactive** : Carte Google Maps avec zone de livraison colorée

### Marketing

1. **TikTok** : Vidéo "Choix des crudités" en time-lapse
2. **Google My Business** : Publier une photo par jour pendant 30 jours
3. **Fidélité augmentée** : "Parrainage = 1 sandwich offert quand ton pote commande"
4. **Badge "NIGHT OWL"** : Les clients qui commandent entre minuit et 6h gagnent des points bonus

---

## 7. 📐 MÉTRIQUES CLÉS (KPIs) À SUIVRE

| KPI | Cible | Comment mesurer |
|-----|-------|-----------------|
| Avis Google | 50+ (vs 14 aujourd'hui) | Google My Business |
| Temps de chargement | <2s (vs ~5s actuel) | Google PageSpeed |
| Commandes/jour via site | 10+ | API logs |
| Taux de rebond | <50% | Google Analytics |
| Pages vues/session | 3+ | Google Analytics |
| Inscrits newsletter | 200+ / mois | Base de données |
| Sandwichs fidélité | 100+/mois | localStorage aggregate |
| Note Google | 4.5+ | Google My Business |

---

## 8. 🧮 ESTIMATION DES COÛTS

| Poste | Coût/mois | Fournisseur |
|-------|-----------|-------------|
| Nom de domaine (faistonsdalle.fr) | ~1€ | OVH / Gandi |
| Hébergement Vercel | Gratuit | Vercel (Hobby) |
| Base de données PostgreSQL | Gratuit | Vercel Storage (jusqu'à 256MB) |
| Certificat SSL | Inclus | Vercel (auto) |
| Photos | ~200€ en one-shot | Photographe pro |
| **Total** | **1€/mois** | - |

---

## 🔄 CORRECTIONS APPLIQUÉES (15 Juillet 2026)

| # | Problème | Correction |
|---|----------|------------|
| 1 | Horaires 00h-06h erronés | ✅ **23h-06h livraison uniquement** — Service jour 11h-23h |
| 2 | Boissons sans image (fond gris) | ✅ **Arrière-plan coloré** + icône émoji pour chaque boisson/dessert |
| 3 | Émojis superposés sur photos menu | ✅ Supprimés — que les vraies photos Uber Eats |
| 4 | Fichier 1MB+ (images dupliquées) | ✅ **180KB** — 5 images, objet JS unique `_IMG` |
| 5 | Logo mal affiché | ✅ `height:36px;width:auto` — bonnes proportions |
| 6 | Panier simulé | ✅ localStorage + fallback appel téléphonique |
| 7 | SEO manquant | ✅ JSON-LD, OG, Twitter, FAQ, Breadcrumb |

## 9. ✅ CONCLUSION

### Forces 🟢
- Concept unique (sandwich sur mesure + livraison nocturne)
- Design moderne et professionnel
- SEO technique excellent
- Panier + personnalisation complets
- Base de données et API prêtes
- Dark mode, animations, responsive
- Fidélité intégrée

### Faiblesses 🔴
- Fichier unique trop lourd (base64)
- Pas de vrai système de commande (panier = simulation)
- Pas de paiement en ligne
- Dépendance aux plateformes Uber/Deliveroo
- Pas encore en ligne
- Contenu textuel insuffisant pour SEO
- Pas de système de gestion admin

### Risques ⚠️
- Si Uber/Deliveroo augmentent leurs commissions, la marge fond
- La concurrence locale peut copier le "sur mesure"
- Pas de présence Instagram (les jeunes sont sur Insta + TikTok)
- 14 avis Google = fragile (un mauvais avis peut faire baisser la moyenne)

### Opportunités 🚀
- Le seul à livrer entre minuit et 6h dans le secteur → **avantage concurrentiel MONSTRUEUX**
- Positionnement "night food" unique
- TikTok déjà actif → à coupler avec Instagram
- Fort potentiel de croissance sur Les Pavillons-sous-Bois + alentours
- Le site peut devenir la plateforme de commande principale (marge 100% vs 70% sur Uber)

---

*Analyse générée le 15 juillet 2026 — Projet FAIS TON S'DALLE*
