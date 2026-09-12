// ─── Authentification UNIQUEMENT Supabase ────────────────────
// Plus de fallback localStorage — sécurité renforcée
import { supabase, isSupabaseConfigured } from "./supabase";

export interface UserAccount {
  email: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
}

const SESSION_KEY = "ftsd_session";
const ORDERS_KEY = "ftsd_order_history";

// ─── Session ─────────────────────────────────────────────────
export function getSession(): { email: string; name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveSession(email: string, name: string) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, name })); } catch {}
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

// ─── Inscription (Supabase uniquement) ─────────────────────────
export async function register(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
  if (password.length < 6) return { success: false, error: "Mot de passe trop court (min 6 caractères)" };
  if (!email.includes("@")) return { success: false, error: "Email invalide" };
  if (!name.trim()) return { success: false, error: "Nom requis" };

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Inscription indisponible sans connexion à Supabase" };
  }

  try {
    const { data, error } = await supabase!.auth.signUp({
      email, password,
      options: { data: { name } },
    });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: "Erreur d'inscription" };

    await supabase!.from("customers").insert({
      email, name,
      phone: "", address: "",
      is_verified: false, password_hash: "supabase-auth",
      fidelity_menu_count: 0, fidelity_discount_active: false,
      fidelity_discount_used: 0, fidelity_total_savings: 0,
    }).maybeSingle();

    return { success: true };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

// ─── Connexion (Supabase uniquement) ───────────────────────────
export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; name?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Connexion indisponible sans Supabase" };
  }

  try {
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: "Email ou mot de passe incorrect" };
    if (!data.user) return { success: false, error: "Compte introuvable" };
    const name = data.user.user_metadata?.name || email.split("@")[0];
    saveSession(email, name);
    return { success: true, name };
  } catch {
    return { success: false, error: "Erreur réseau" };
  }
}

// ─── Déconnexion ─────────────────────────────────────────────
export async function logout() {
  if (isSupabaseConfigured()) {
    try { await supabase!.auth.signOut(); } catch {}
  }
  clearSession();
}

// ─── Récupérer le compte connecté ────────────────────────────
export async function getCurrentAccount(): Promise<UserAccount | null> {
  const session = getSession();
  if (!session) return null;

  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase!.from("customers").select("*").eq("email", session.email).single();
    if (!error && data) return data as UserAccount;
  } catch {}
  return null;
}

// ─── Mettre à jour le compte ─────────────────────────────────
export async function updateAccount(updates: { name?: string; phone?: string; address?: string }): Promise<boolean> {
  const session = getSession();
  if (!session) return false;

  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase!.from("customers").update(updates).eq("email", session.email);
    if (!error) {
      if (updates.name) saveSession(session.email, updates.name);
      return true;
    }
  } catch {}
  return false;
}

// ─── Changer d'email ─────────────────────────────────────────
export async function changeEmail(newEmail: string): Promise<{ success: boolean; error?: string }> {
  const session = getSession();
  if (!session) return { success: false, error: "Non connecté" };
  if (!newEmail.includes("@")) return { success: false, error: "Email invalide" };

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Disponible uniquement avec Supabase" };
  }

  try {
    const { error } = await supabase!.auth.updateUser({ email: newEmail });
    if (error) return { success: false, error: error.message };
    await supabase!.from("customers").update({ email: newEmail }).eq("email", session.email);
    saveSession(newEmail, session.name);
    return { success: true };
  } catch { return { success: false, error: "Erreur réseau" }; }
}

// ─── Changer de mot de passe ─────────────────────────────────
export async function changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  const session = getSession();
  if (!session) return { success: false, error: "Non connecté" };
  if (newPassword.length < 6) return { success: false, error: "Nouveau mot de passe trop court" };

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Disponible uniquement avec Supabase" };
  }

  try {
    const { error } = await supabase!.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch { return { success: false, error: "Erreur réseau" }; }
}

// ─── Supprimer le compte ─────────────────────────────────────
export async function deleteAccount(): Promise<boolean> {
  const session = getSession();
  if (!session) return false;

  if (isSupabaseConfigured()) {
    try {
      await supabase!.from("customers").delete().eq("email", session.email);
      const { data: userData } = await supabase!.auth.getUser();
      if (userData?.user?.id) {
        await supabase!.auth.admin.deleteUser(userData.user.id);
      }
    } catch {}
  }

  clearSession();
  return true;
}

// ─── Vérification email ──────────────────────────────────────
export async function verifyEmailWithSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { data, error } = await supabase!.auth.getUser();
    if (error || !data?.user) return false;
    return data.user.email_confirmed_at !== null;
  } catch { return false; }
}

// ─── Historique commandes (localStorage) ─────────────────────
export interface OrderHistoryItem {
  id: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  mode: string;
  wasDiscounted: boolean;
  saved: number;
}

export function getOrderHistory(): OrderHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function addOrderToHistory(order: OrderHistoryItem) {
  const history = getOrderHistory();
  history.unshift(order);
  try { localStorage.setItem(ORDERS_KEY, JSON.stringify(history.slice(0, 50))); } catch {}
}
