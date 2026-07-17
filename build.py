# ===========================================================
# FAIS TON S'DALLE — Variables d'environnement (réelles)
# Copier ces valeurs depuis Supabase Dashboard
# ===========================================================

# --- SUPABASE (obligatoire) ---
# Project Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"

# Project Settings > API > anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx"

# Project Settings > API > service_role (PRIVÉ - jamais dans le frontend)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx"

# Project Settings > Database > Connection string (direct Postgres)
SUPABASE_DB_URL="postgres://postgres:xxx@db.xxx.supabase.co:5432/postgres"

# --- SITE ---
SITE_URL="https://faistonsdalle.fr"
NEXT_PUBLIC_SITE_URL="https://faistonsdalle.fr"

# --- CONTACT ---
CONTACT_EMAIL="contact@faistonsdalle.com"
WHATSAPP_NUMBER="33672044875"

# --- UBER EATS (URL de redirection) ---
UBER_STORE_URL="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g"

# --- RESEND (optionnel - pour emails de notification) ---
# Aller sur https://resend.com → API Keys
# RESEND_API_KEY="re_xxx"
# EMAIL_FROM="contact@faistonsdalle.com"
# EMAIL_TO="contact@faistonsdalle.com"

# --- STRIPE (obligatoire pour les paiements) ---
# Créer un compte Stripe → Dashboard → Developers → API Keys
# STRIPE_SECRET_KEY="sk_live_xxxxxxxxxxxxx"  # 🔒 Clé secrète (PRIVÉE)
# NEXT_PUBLIC_STRIPE_KEY="pk_live_xxxxxxxxxxxxx"  # Clé publiable

# --- GOOGLE ANALYTICS (optionnel) ---
# NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
