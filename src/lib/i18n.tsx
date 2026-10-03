"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "fr" | "en";

const STORAGE_KEY = "ftsd_lang";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<string, any> = {
  fr: {
    "site.name": "FAIS TON S'DALLE",
    "site.tagline": "Sandwichs sur mesure Halal",
    "nav.home": "Accueil",
    "nav.menu": "Menu",
    "nav.infos": "Infos",
    "nav.contact": "Contact",
    "nav.avis": "Avis",
    "nav.blog": "Blog",
    "nav.histoire": "Histoire",
    "hero.slogan": "Sur mesure, halal, livraison {hours}",
    "hero.cta": "Voir le menu",
    "hero.order": "Commander",
    "menu.title": "NOTRE MENU",
    "menu.subtitle": "Chaque sandwich est préparé à la commande avec des ingrédients frais",
    "menu.formules": "formules disponibles",
    "menu.produits": "produits",
    "menu.cat.all": "Tout",
    "menu.cat.sandwichs": "Sandwichs",
    "menu.cat.bowls": "Bowls",
    "menu.cat.desserts": "Desserts",
    "menu.cat.boissons": "Boissons",
    "menu.results": "résultat",
    "menu.noresults": "Aucun produit dans cette catégorie",
    "cart.title": "Panier",
    "cart.empty": "Votre panier est vide",
    "cart.pay": "Payer",
    "cart.whatsapp": "Commander par WhatsApp",
    "cart.subtotal": "Sous-total",
    "cart.delivery": "Livraison",
    "cart.total": "Total",
    "cart.min": "Min.",
    "cart.missing": "manquants",
    "cart.quickadd": "Ajoutez vite :",
    "cart.name": "Nom",
    "cart.phone": "Téléphone",
    "cart.address": "Adresse",
    "cart.clear": "Vider",
    "cart.parrain": "Code parrainage (-10%)",
    "cart.promo": "Code promo",
    "cart.apply": "Appliquer",
    "cart.remove": "Retirer",
    "fidelity.title": "Fidélité -10%",
    "fidelity.progress": "Progression vers 10% de réduction",
    "fidelity.active": "10% de réduction actif !",
    "checkout.secure": "Paiement sécurisé",
    "hours.service": "Service",
    "hours.delivery": "Livraison",
    "hours.7j": "7j/7",
    "contact.phone": "Téléphone",
    "contact.email": "Email",
    "contact.address": "Adresse",
    "contact.form.title": "Nous écrire",
    "contact.form.name": "Votre nom",
    "contact.form.email": "Votre email",
    "contact.form.phone": "Votre téléphone",
    "contact.form.message": "Votre message",
    "contact.form.send": "Envoyer",
    "contact.form.sent": "Message envoyé !",
    "contact.form.success": "Nous vous répondrons dans les plus brefs délais.",
    "avis.title": "Ce qu'ils disent",
    "avis.submit": "Laisser un avis",
    "avis.yournote": "Votre note",
    "avis.yourname": "Votre prénom",
    "avis.youremail": "Votre email (optionnel)",
    "avis.yourcomment": "Votre commentaire",
    "avis.send": "Envoyer mon avis",
    "avis.thanks": "Merci pour votre avis !",
    "suivi.title": "Suivi de commande",
    "suivi.placeholder": "Numéro de commande",
    "suivi.track": "Suivre",
    "suivi.pending": "Commande reçue",
    "suivi.confirmed": "Confirmée",
    "suivi.preparing": "En préparation",
    "suivi.ready": "Prête",
    "suivi.enroute": "En livraison",
    "suivi.delivered": "Livraison effectuée",
    "common.back": "Retour",
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.close": "Fermer",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.delete": "Supprimer",
    "common.yes": "Oui",
    "common.no": "Non",
    "common.copy": "Copier",
    "common.copied": "Copié !",
    "common.share": "Partager",
    "common.required": "obligatoire",
    "about.title": "LE CONCEPT",
    "about.desc": "FAIS TON S'DALLE - Le concept sandwich sur mesure 100% Halal incontournable aux Pavillons-sous-Bois depuis 2026.",
    "about.how": "Comment ça marche ?",
    "about.step1": "Choisissez votre menu : Léger (6,90€), Classique avec boisson (7,90€) ou Gourmand avec boisson + dessert (9,90€)",
    "about.step2": "Personnalisez votre sandwich : 7 viandes, 6 crudités, 9 sauces, 3 suppléments",
    "about.step3": "Ajoutez un Tiramisu maison ou un Milkshake personnalisable",
    "about.step4": "Nous préparons, vous dégustez - Livraison {hours} ou à emporter",
    "about.bowls": "Les Bowls",
    "about.bowls.desc": "Composez votre bowl comme votre sandwich : 7 viandes, 6 crudités, 9 sauces. Bowl seul à partir de 10,90€.",
    "about.night": "Les soirées, notre spécialité. Service de livraison {deA}, {days}.",
    "footer.rights": "Tous droits réservés",
    "footer.links": "Liens",
    "footer.infos": "Infos",
    "footer.legal": "Mentions légales",
    "footer.cgv": "CGV",
    "footer.privacy": "Confidentialité",
    "footer.quality": "Engagement qualité",
    "delivery.title": "Livraison",
    "delivery.pickup": "À emporter",
    "delivery.free": "Livraison",
    "delivery.zone": "Zone",
    "delivery.min": "min",
    "delivery.hours": "{hours}",
    "delivery.schedule": "Programmer",
    "delivery.now": "Tout de suite",
    "cart.youritems": "Vos articles",
    "cart.deleteall": "Tout supprimer ?",
    "cart.yes": "Oui",
    "cart.no": "Non",
    "cart.emptymsg": "Votre panier est vide",
    "cart.recent": "Vos dernières commandes",
    "cart.quickorder": "Re-commander",
    "cart.infos": "Ajouter mes infos",
    "cart.addname": "Nom",
    "cart.addphone": "Téléphone",
    "cart.addaddress": "Adresse",
    "cart.deliverynote": "Note de livraison",
    "cart.schedule": "Programmer la livraison",
    "cart.now": "Tout de suite",
    "cart.later": "Plus tard",
    "cart.zones": "Zones de livraison",
    "cart.93": "93",
    "cart.secure": "Paiement sécurisé",
    "cart.fidelity": "Fidélité -10%",
    "cart.parrainage": "Parrainage",
    "suivi.search": "Rechercher une commande",
    "suivi.notfound": "Commande non trouvée",
    "suivi.details": "Détails",
    "suivi.yourorders": "Vos dernières commandes",
    "suivi.notifications": "Notifications activées",
    "suivi.activate": "Activer les notifications",
    "suivi.deactivate": "Désactiver les notifications",
    "account.title": "Mon compte",
    "account.login": "Connexion",
    "account.register": "Inscription",
    "account.logout": "Déconnexion",
    "account.infos": "Informations",
    "account.fidelity": "Fidélité",
    "account.orders": "Commandes",
    "account.security": "Sécurité",
    "account.creations": "Créations",
    "account.parrainage": "Parrainage",
    "contact.send": "Envoyer le message",
    "contact.sent": "Message envoyé !",
    "contact.write": "Nous écrire",
    "contact.hours": "Horaires",
    "contact.schedule": "{hours}",
    "contact.itinerary": "Itinéraire",
    "contact.map": "Carte",
  },
  en: {
  },
};

export function getTranslation(key: string, lang: Lang): string {
  return translations[lang]?.[key] || translations["fr"]?.[key] || key;
}

export function getSavedLang(): Lang {
  if (typeof window === "undefined") return "fr";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "fr") return saved;
  } catch {}
  return "fr";
}

export function saveLang(lang: Lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
}

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "fr",
  setLang: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getSavedLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    saveLang(l);
  }, []);

  const t = useCallback((key: string) => getTranslation(key, lang), [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
