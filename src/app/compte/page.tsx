"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User, Mail, Lock, Phone, MapPin, Trash2, LogOut,
  Package, Gift, ShoppingBag, Star, Plus, Users, Copy,
  Save, AlertTriangle, CheckCircle, Eye, EyeOff,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { isLoggedIn, getCurrentAccount, updateAccount, logout, changeEmail, changePassword, deleteAccount, getOrderHistory } from "@/lib/auth";
import { getFidelity } from "@/data/fidelite";
import type { FidelityData } from "@/data/fidelite";
import { getFavorites, deleteFavorite } from "@/data/favorites";
import { getParrainage } from "@/data/parrainage";
import { toast } from "sonner";

export default function ComptePage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [account, setAccount] = useState<{ email: string; name: string; phone: string; address: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders] = useState(getOrderHistory());
  const [fidelity, setFidelity] = useState<FidelityData | null>(null);
  const [parrainage, setParrainage] = useState(getParrainage());
  const [favorites, setFavorites] = useState(getFavorites());

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const [activeTab, setActiveTab] = useState<"infos" | "fidelite" | "commandes" | "securite" | "creations" | "parrainage">("infos");

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/connexion"); return; }
    getCurrentAccount().then(acc => {
      if (acc) { setAccount(acc); setName(acc.name || ""); setPhone(acc.phone || ""); setAddress(acc.address || ""); setParrainage(getParrainage(acc.name)); }
      setLoading(false);
    });
    getFidelity().then(setFidelity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0d0808] flex items-center justify-center"><p className="text-white/50">Chargement...</p></div>;
  if (!account) return null;

  const handleUpdate = async () => {
    setSaving(true);
    const ok = await updateAccount({ name, phone, address });
    if (ok) { const acc = await getCurrentAccount(); if (acc) setAccount(acc); toast.success("Informations mises a jour"); }
    setSaving(false);
  };

  const handleChangeEmail = async () => {
    const r = await changeEmail(newEmail);
    if (r.success) { setNewEmail(""); setShowEmailForm(false); toast.success("Email modifie !"); }
    else { toast.error(r.error || "Erreur"); }
  };

  const handleChangePassword = async () => {
    const r = await changePassword(newPwd);
    if (r.success) { setNewPwd(""); setShowPwdForm(false); toast.success("Mot de passe modifie !"); }
    else { toast.error(r.error || "Erreur"); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Supprimer ton compte ?")) return;
    if (!confirm("Derniere chance ?")) return;
    await deleteAccount();
    toast.success("Compte supprime");
    router.push("/");
  };

  const handleLogout = async () => { await logout(); router.push("/"); toast.success("Deconnecte"); };

  return (
    <div className="min-h-screen bg-[#0d0808] py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-brand-red font-bold text-sm hover:underline mb-6 inline-block">← Retour au site</Link>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center text-white font-heading text-xl shadow-lg">
            {(account.name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-heading text-2xl tracking-wider text-white">Mon compte</h1>
            <p className="text-white/40 text-sm">{account.email}</p>
          </div>
          <button onClick={handleLogout}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/50 hover:text-red-400 text-xs font-bold hover:bg-red-500/10 transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Deconnexion
          </button>
        </div>

        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-0.5 overflow-x-auto">
          {[
            { id: "infos" as const, label: "Infos", icon: User },
            { id: "fidelite" as const, label: "Fidelite", icon: Gift },
            { id: "commandes" as const, label: "Commandes", icon: ShoppingBag },
            { id: "securite" as const, label: "Securite", icon: Lock },
            { id: "creations" as const, label: "Creations", icon: Star },
          ].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${activeTab === t.id ? "bg-brand-red text-white" : "text-white/50 hover:bg-white/5"}`}>
              <t.icon className="h-3 w-3" /> {t.label}
            </button>
          ))}
        </div>

        {activeTab === "infos" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-heading text-lg tracking-wider text-white">Mes informations</h2>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input type="text" placeholder="Prenom" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-red/50" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input type="tel" placeholder="Telephone" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-red/50" />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input type="text" placeholder="Adresse" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-red/50" />
            </div>
            <button onClick={handleUpdate} disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-brand-red to-red-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? "..." : "Enregistrer"}
            </button>
          </div>
        )}

        {activeTab === "fidelite" && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="h-5 w-5 text-amber-400" />
                <h2 className="font-heading text-lg tracking-wider text-white">Programme fidelite</h2>
              </div>
              {fidelity?.discountActive ? (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                  className="p-5 rounded-xl bg-gradient-to-r from-amber-600/30 to-orange-600/20 border-2 border-amber-500/30 text-center">
                  <Gift className="h-10 w-10 text-amber-400 mx-auto mb-2" />
                  <p className="text-white font-bold text-lg mb-1">10% de reduction actif !</p>
                  <p className="text-amber-300 text-sm">Valable sur ta prochaine commande</p>
                </motion.div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70 text-sm">Progression vers 10% de reduction</span>
                    <span className="text-amber-400 font-bold">{fidelity?.menuCount || 0}/6 menus</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${((fidelity?.menuCount || 0) / 6) * 100}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-red to-amber-400" />
                  </div>
                  <p className="text-white/40 text-xs mt-2">6 menus achetes → 10% de reduction</p>
                </div>
              )}
              {(fidelity?.discountUsed || 0) > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                  <p className="text-green-300 text-xs flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> {fidelity?.discountUsed || 0} reduction(s) utilisee(s) • {Number(fidelity?.totalSavings || 0).toFixed(2)}€ economises
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "commandes" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5 text-brand-red" />
              <h2 className="font-heading text-lg tracking-wider text-white">Mes commandes</h2>
              <span className="text-[10px] text-white/30 ml-auto">{orders.length} commande(s)</span>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Aucune commande pour le moment</p>
                <Link href="/" className="text-brand-red font-bold text-sm hover:underline mt-2 inline-block">Commander maintenant →</Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-white/80 font-semibold">#{order.id}</span>
                      <span className="text-white/40">{new Date(order.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <p className="text-[10px] text-white/50 truncate">{order.items.map(i => `${i.qty}x ${i.name}`).join(", ")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "creations" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-yellow-400" />
              <h2 className="font-heading text-lg tracking-wider text-white">Mes créations</h2>
              <span className="text-[10px] text-white/30 ml-auto">{favorites.length} composition(s)</span>
            </div>
            {favorites.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Aucune composition enregistrée</p>
                <p className="text-white/30 text-xs">Personnalise un sandwich et clique sur <Star className="h-3 w-3 inline" /> pour le sauvegarder !</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {favorites.map((fav) => (
                  <div key={fav.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-brand-red/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{fav.name}</p>
                        <p className="text-[10px] text-white/50">{fav.itemName} · Utilisée {fav.useCount} fois</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => {
                          const parts: string[] = [];
                          Object.entries(fav.selections).forEach(([key, vals]) => {
                            if (vals.length > 0) parts.push(`${key}: ${vals.join(", ")}`);
                          });
                          addItem({ id: fav.itemId, name: fav.itemName, price: 0, quantity: 1, customization: parts.join(" | "), image: "" });
                          toast.success(`${fav.itemName} ajouté au panier !`);
                          router.push("/");
                        }}
                          className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                          title="Ajouter au panier">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => { deleteFavorite(fav.id); setFavorites(getFavorites()); toast.success("Composition supprimée"); }}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {fav.selections && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {Object.entries(fav.selections).map(([key, vals]) =>
                          vals.slice(0, 3).map((v: string) => (
                            <span key={key+v} className="text-[8px] bg-brand-red/10 text-white/60 px-1.5 py-0.5 rounded-full border border-white/5">{v}</span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "parrainage" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-indigo-400" />
              <h2 className="font-heading text-lg tracking-wider text-white">Parrainage</h2>
            </div>
            <p className="text-sm text-white/60 mb-4">Parrainez vos amis et recevez -10% sur votre prochaine commande !</p>

            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 mb-4 text-center">
              <p className="text-[10px] text-white/40 mb-1">Votre code parrainage</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-heading text-2xl tracking-widest text-indigo-300">{parrainage.code || "FTSD-XXXXX"}</span>
                <button onClick={() => { navigator.clipboard.writeText(parrainage.code); toast.success("Code copie !"); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 text-center">
                <p className="text-2xl font-bold text-green-400">{parrainage.parrainCount}</p>
                <p className="text-[10px] text-white/40">Filleul(s)</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
                <p className="text-2xl font-bold text-amber-400">{parrainage.totalDiscounts}</p>
                <p className="text-[10px] text-white/40">Reduction(s)</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-white/40 font-medium mb-2">Partagez votre lien</p>
              <div className="flex gap-2">
                <input type="text" readOnly value={"https://faistonsdalle.com?ref=" + parrainage.code}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-[10px] focus:outline-none" />
                <button onClick={() => { navigator.clipboard.writeText("https://faistonsdalle.com?ref=" + parrainage.code); toast.success("Lien copie !"); }}
                  className="px-3 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-bold hover:bg-indigo-500/30">
                  Copier
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-[10px] text-amber-300/80">
                <strong>🎁 Comment ca marche ?</strong><br />
                1. Partagez votre code ou lien<br />
                2. Votre filleul commande avec votre code<br />
                3. Vous recevez -10% sur votre prochaine commande<br />
                4. Votre filleul a aussi -10% sur sa commande
              </p>
            </div>
          </div>
        )}

        {activeTab === "parrainage" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-indigo-400" />
              <h2 className="font-heading text-lg tracking-wider text-white">Parrainage</h2>
            </div>
            <p className="text-sm text-white/60 mb-4">Parrainez vos amis et recevez -10% sur votre prochaine commande !</p>
            
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 mb-4 text-center">
              <p className="text-[10px] text-white/40 mb-1">Votre code parrainage</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-heading text-2xl tracking-widest text-indigo-300">{parrainage.code || "FTSD-XXXXX"}</span>
                <button onClick={() => { navigator.clipboard.writeText(parrainage.code); toast.success("Code copie !"); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 text-center">
                <p className="text-2xl font-bold text-green-400">{parrainage.parrainCount}</p>
                <p className="text-[10px] text-white/40">Filleul(s)</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
                <p className="text-2xl font-bold text-amber-400">{parrainage.totalDiscounts}</p>
                <p className="text-[10px] text-white/40">Reduction(s)</p>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 mb-4">
              <p className="text-[10px] text-white/40 font-medium mb-2">Partagez votre lien</p>
              <div className="flex gap-2">
                <input type="text" readOnly value={"https://faistonsdalle.com?ref=" + parrainage.code}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-[10px] focus:outline-none" />
                <button onClick={() => { navigator.clipboard.writeText("https://faistonsdalle.com?ref=" + parrainage.code); toast.success("Lien copie !"); }}
                  className="px-3 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-bold hover:bg-indigo-500/30">
                  Copier
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-[10px] text-amber-300/80">
                <strong>🎁 Comment ca marche ?</strong><br />
                1. Partagez votre code ou lien<br />
                2. Votre filleul commande avec votre code<br />
                3. Vous recevez -10% sur votre prochaine commande<br />
                4. Votre filleul a aussi -10% sur sa commande
              </p>
            </div>
          </div>
        )}

        {activeTab === "securite" && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-heading text-base tracking-wider text-white mb-3">Adresse email</h3>
              <p className="text-sm text-white/50 mb-3">{account.email}</p>
              {showEmailForm ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input type="email" placeholder="Nouvel email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-red/50" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleChangeEmail} className="flex-1 py-2 rounded-xl bg-brand-red text-white text-xs font-bold">Confirmer</button>
                    <button onClick={() => setShowEmailForm(false)} className="px-4 py-2 rounded-xl bg-white/10 text-white/50 text-xs font-bold">Annuler</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowEmailForm(true)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/70 text-xs font-bold hover:bg-white/10 transition-colors">Changer email</button>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-heading text-base tracking-wider text-white mb-3">Mot de passe</h3>
              {showPwdForm ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input type={showNewPwd ? "text" : "password"} placeholder="Nouveau mot de passe" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-red/50" />
                    <button onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                      {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleChangePassword} className="flex-1 py-2 rounded-xl bg-brand-red text-white text-xs font-bold">Modifier</button>
                    <button onClick={() => setShowPwdForm(false)} className="px-4 py-2 rounded-xl bg-white/10 text-white/50 text-xs font-bold">Annuler</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowPwdForm(true)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/70 text-xs font-bold hover:bg-white/10 transition-colors">Changer le mot de passe</button>
              )}
            </div>

            <div className="bg-white/5 border border-red-500/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="font-heading text-base tracking-wider text-red-400">Zone dangereuse</h3>
              </div>
              <p className="text-sm text-white/50 mb-3">Supprime definitivement ton compte.</p>
              <button onClick={handleDeleteAccount}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/25 transition-colors">
                <Trash2 className="h-4 w-4" /> Supprimer mon compte
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
