"use client";

// ─── Carte de suivi du livreur (site) ─────────────────────────
//
// L'application montrait le livreur avancer en direct, le site se
// contentait d'un statut : le client passait sur l'app… ou appelait
// le restaurant. Le site a maintenant la même carte.
//
// Volontairement SANS bibliothèque de cartographie : des tuiles
// OpenStreetMap chargées en simples images, et des repères placés
// par calcul. Pas de clé d'API, pas de compte à créer, pas de
// mégaoctets de JavaScript en plus — et ça marche tout de suite.

import { useCallback, useEffect, useState } from "react";
import { Navigation, MapPin, RefreshCw } from "lucide-react";

const RESTAURANT = { lat: 48.9047, lng: 2.5045 };
const TAILLE_TUILE = 256;
const ZOOM = 14;

type Position = { lat: number; lng: number; updated_at: string };

/** Conversion latitude/longitude → coordonnées de tuile (Web Mercator) */
function versTuile(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

/** Distance à vol d'oiseau, en kilomètres */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 100) / 100;
}

/** Scooter urbain : 18 km/h de moyenne, plus 2 min de stationnement */
export function etaMinutes(km: number): number {
  return Math.max(1, Math.round((km / 18) * 60) + 2);
}

export function SuiviCarte({
  uuid,
  statut,
}: {
  uuid: string;
  statut: string;
}) {
  const [pos, setPos] = useState<Position | null>(null);
  // L'âge de la position se calcule à chaque relecture, pas pendant
  // le rendu : appeler Date.now() en plein rendu rend le composant
  // imprévisible (et React le signale).
  const [ageMin, setAgeMin] = useState(0);
  const [erreur, setErreur] = useState(false);
  const [chargement, setChargement] = useState(true);

  const relire = useCallback(async () => {
    try {
      const res = await fetch(`/api/driver/position/${encodeURIComponent(uuid)}`, {
        cache: "no-store",
      });
      if (!res.ok) { setPos(null); setErreur(res.status !== 404); return; }
      const data = await res.json();
      if (typeof data?.lat === "number" && typeof data?.lng === "number") {
        setPos(data as Position);
        setAgeMin(
          Math.round((Date.now() - new Date(data.updated_at).getTime()) / 60000)
        );
        setErreur(false);
      } else {
        setPos(null);
      }
    } catch {
      setErreur(true);
    } finally {
      setChargement(false);
    }
  }, [uuid]);

  useEffect(() => {
    // Différé d'un tick : pas de setState synchrone dans un effet
    const t = setTimeout(() => { relire(); }, 0);
    const id = setInterval(relire, 15000);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [relire]);

  // La carte n'a de sens que pendant la course
  if (!["ready", "en-route", "arrived"].includes(statut)) return null;

  if (chargement) {
    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-xs text-white/40">
        Recherche du livreur…
      </div>
    );
  }

  if (!pos) {
    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
        <p className="text-sm text-white/70">
          {erreur
            ? "Position momentanément indisponible."
            : "Le livreur n'a pas encore démarré le partage de sa position."}
        </p>
        <button onClick={relire}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-bold text-white/70 hover:bg-white/10">
          <RefreshCw className="h-3 w-3" /> Actualiser
        </button>
      </div>
    );
  }

  // ─── Cadrage : le livreur au centre, 2 × 2 tuiles ──────────
  const centre = versTuile(pos.lat, pos.lng, ZOOM);
  const tuileX = Math.floor(centre.x);
  const tuileY = Math.floor(centre.y);
  const decalageX = (centre.x - tuileX) * TAILLE_TUILE;
  const decalageY = (centre.y - tuileY) * TAILLE_TUILE;

  /** Position en pixels d'un point, dans le cadre de 512 × 320 */
  const enPixels = (lat: number, lng: number) => {
    const p = versTuile(lat, lng, ZOOM);
    return {
      left: (p.x - tuileX) * TAILLE_TUILE - decalageX + 256,
      top: (p.y - tuileY) * TAILLE_TUILE - decalageY + 160,
    };
  };

  const livreur = enPixels(pos.lat, pos.lng);
  const resto = enPixels(RESTAURANT.lat, RESTAURANT.lng);
  const km = distanceKm(pos.lat, pos.lng, RESTAURANT.lat, RESTAURANT.lng);
  const minutes = etaMinutes(km);
  const perimee = ageMin > 3;

  const tuiles: { x: number; y: number }[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      tuiles.push({ x: tuileX + dx, y: tuileY + dy });
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#141414]">
      <div className="relative h-[320px] w-full overflow-hidden bg-[#1a1a1a]">
        {tuiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${t.x}-${t.y}`}
            src={`https://tile.openstreetmap.org/${ZOOM}/${t.x}/${t.y}.png`}
            alt=""
            width={TAILLE_TUILE}
            height={TAILLE_TUILE}
            loading="lazy"
            className="pointer-events-none absolute opacity-80"
            style={{
              left: (t.x - tuileX) * TAILLE_TUILE - decalageX + 256,
              top: (t.y - tuileY) * TAILLE_TUILE - decalageY + 160,
            }}
          />
        ))}

        {/* Restaurant */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: resto.left, top: resto.top }} title="Le restaurant">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-black/70 text-sm">
            🥖
          </div>
        </div>

        {/* Livreur */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: livreur.left, top: livreur.top }} title="Votre livreur">
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand-red/40" />
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-red text-base shadow-lg">
            🛵
          </div>
        </div>

        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] text-white/60">
          © OpenStreetMap
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 p-3">
        <div>
          <p className="text-sm font-bold text-white">
            {statut === "arrived"
              ? "Votre livreur est arrivé 📍"
              : `À ${km.toString().replace(".", ",")} km du restaurant`}
          </p>
          <p className="text-[11px] text-white/45">
            {perimee
              ? `Dernière position il y a ${ageMin} min`
              : statut === "arrived"
              ? "Préparez votre code de livraison"
              : `Arrivée estimée dans ${minutes} min`}
          </p>
        </div>
        <a
          href={`https://maps.google.com/?q=${pos.lat},${pos.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-[11px] font-bold text-white/70 transition-colors hover:bg-white/10"
        >
          <Navigation className="h-3 w-3" /> Ouvrir
        </a>
      </div>
    </div>
  );
}

export function AdresseLivraison({ adresse }: { adresse: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-white/60">
      <MapPin className="h-3.5 w-3.5 text-brand-red" /> {adresse}
    </p>
  );
}

export default SuiviCarte;
