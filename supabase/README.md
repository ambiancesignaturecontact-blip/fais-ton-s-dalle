# Configuration Supabase — FAIS TON S'DALLE

## 1. Créer le projet Supabase

1. Va sur https://supabase.com → Sign in
2. Clique **"New project"**
3. Nom : `faistonsdalle`
4. Database password : **copie-la dans `.env`**
5. Region : **Paris (West Europe)** — `eu-west-3`
6. Clique **"Create new project"** (compte ~30s)

## 2. Récupérer les identifiants

Dans Supabase → Project Settings → API :

| Variable | Où la trouver |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (https://xxxxx.supabase.co) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon public** (commence par eyJ...) |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (clé privée, à cacher !) |

## 3. Exécuter le schéma SQL

Dans Supabase → **SQL Editor**, copie-colle le contenu de `sql/schema.sql` et exécute.

## 4. Copier les variables dans Vercel

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Ton URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ta clé anon |
| `SITE_URL` | `https://faistonsdalle.fr` |
| `CONTACT_EMAIL` | `contact@faistonsdalle.fr` |
| `WHATSAPP_NUMBER` | `33672044875` |

## 5. Variables optionnelles

| Variable | Utilité |
|----------|---------|
| `RESEND_API_KEY` | Pour envoyer les commandes par email aussi |
| `NEXT_PUBLIC_GA_ID` | Google Analytics |
