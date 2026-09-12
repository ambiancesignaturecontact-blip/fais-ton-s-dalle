# Site complet, corrigé et vérifié

Ce dossier est votre dépôt GitHub **au commit `7e2e184`**, avec les
corrections appliquées. Il est prêt à être poussé tel quel.

> ⚠️ Supprimez ce fichier avant de pousser, ou laissez-le : il est
> inoffensif. Mais ne poussez **pas** `node_modules` ni `.next`
> (ils ne sont pas dans ce dossier, et `.gitignore` les exclut déjà).

---

## Comment pousser

Le plus sûr, en ligne de commande — **évitez le glisser-déposer
GitHub**, c'est lui qui a causé les deux inversions précédentes :

```bash
cd /home/user/SITE-COMPLET
git init
git remote add origin https://github.com/ambiancesignaturecontact-blip/fais-ton-s-dalle.git
git add -A
git commit -m "Retablit /api/suivi, corrige /suivi et ajoute /support"
git branch -M main
git push -u origin main --force
```

> `--force` est nécessaire : ce dossier n'a pas l'historique Git.
> Votre historique distant sera remplacé par un commit unique. Si vous
> tenez à le conserver, copiez plutôt les fichiers dans votre clone
> existant :
>
> ```bash
> cp -r /home/user/SITE-COMPLET/src/* VOTRE-CLONE/src/
> cp /home/user/SITE-COMPLET/package.json VOTRE-CLONE/
> ```

---

## Ce qui a été corrigé

### 1. 🔴 Route `/api/suivi` restaurée

Elle avait été supprimée par le commit `9dc223f`
(« Delete src/app/api/suivi directory »). En production elle renvoyait
la page 404 HTML de Next au lieu du JSON attendu — le suivi de
commande était cassé côté serveur.

### 2. 🔴 Inversion `/suivi` ↔ `/support` réparée

Le contenu de la page d'aide s'était retrouvé dans `suivi/page.tsx`, et
`src/app/support/` n'existait pas.

Les trois fichiers sont désormais bien distincts :

| Fichier | Première ligne |
|---|---|
| `src/app/suivi/page.tsx` | `"use client";` |
| `src/app/support/page.tsx` | `import type { Metadata } from "next";` |
| `src/app/api/suivi/route.ts` | `import { NextRequest, NextResponse }…` |

### 3. ✅ Bonus — erreur TypeScript historique résolue

```
src/__tests__/CartEmpty.test.tsx(6,18): error TS2305:
Module '"@testing-library/react"' has no exported member 'screen'.
```

Cette erreur traînait depuis plusieurs sessions. **Cause trouvée** :
`@testing-library/react` réexporte `screen` depuis
`@testing-library/dom`, déclaré en *peer dependency* et donc jamais
installé automatiquement.

Corrigé en ajoutant une seule ligne à `package.json` :

```json
"@testing-library/dom": "^10.4.1"
```

C'est la seule modification hors `src/`.

---

## Vérifications réellement effectuées

Pas de supposition : tout a été exécuté sur ce dossier.

| Contrôle | Résultat |
|---|---|
| `tsc --noEmit` sur tout le projet | **0 erreur** ✅ |
| `eslint` sur les 5 fichiers touchés | **0 erreur, 0 warning** ✅ |
| `jest` | **85 tests passent**, 7 suites ✅ |
| `next build --webpack` | **Compiled successfully** ✅ |
| `/api/suivi` présent dans le build | ✅ |
| `/api/auth/apple` présent dans le build | ✅ |

### Rendu réel, serveur de production lancé en local

```
/suivi                200   <title>Suivi de Commande | FAIS TON S'DALLE</title>
/support              200   <title>Aide et assistance | FAIS TON S'DALLE</title>
/suppression-compte   200   <title>Supprimer mon compte | FAIS TON S'DALLE</title>
```

Les titres correspondent enfin à leurs pages.

### Réponses des API

```
POST /api/auth/apple  {}   →  400  {"error":"Jeton requis"}
GET  /api/suivi            →  503  {"error":"Service indisponible"}
```

Les deux répondent en **JSON**, preuve que les routes existent. Le 503
est normal en local : les variables Supabase ne sont pas définies. Sur
Vercel, elles le sont.

---

## À vérifier après déploiement

```bash
curl -s -o /dev/null -w "support  %{http_code}\n" https://www.faistonsdalle.com/support
curl -s https://www.faistonsdalle.com/suivi | grep -o "<title>[^<]*</title>"
curl -s "https://www.faistonsdalle.com/api/suivi?ref=1" | head -c 60
```

Attendu :

```
support  200
<title>Suivi de Commande | FAIS TON S'DALLE</title>
{"error":"Commande introuvable"}        ← du JSON, pas du HTML
```

Les trois doivent être bons **en même temps**.

---

## Variable d'environnement Vercel

Facultative, le code a déjà la bonne valeur par défaut :

```
APPLE_BUNDLE_ID = com.faistonsdalle.app
```

---

## Ensuite : l'application

Une fois le site vérifié :

```bash
cd /home/user
bash eas-init.sh                              # 1. crée le projet Expo
cd ftsd-ios && npx jest __tests__/ota.test.ts # 2. les 7 tests doivent passer
npx eas-cli build --platform ios --profile production   # 3. 20-40 min
npx eas-cli submit --platform ios --profile production --latest
```

Les notes de revue à coller dans App Store Connect sont prêtes dans
`../NOTES-POUR-APPLE.txt`.
