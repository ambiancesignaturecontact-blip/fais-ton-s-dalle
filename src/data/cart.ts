export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customization?: string;
  image: string;
}

export interface CartState {
  items: CartItem[];
  mode: "livraison" | "emporter";
  address: string;
  name: string;
  phone: string;
}

export const DELIVERY_FEE = 2.9;
export const MIN_DELIVERY_ORDER = 15;

// Ces valeurs par défaut sont utilisées quand l'adresse n'est pas encore connue.
// Le calcul intelligent se fait dans data/delivery.ts avec findZone(address).
export { findZone, getMinOrder, getDeliveryFee, isInZone, DELIVERY_ZONES } from "./delivery";

export function getSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getDelivery(mode: "livraison" | "emporter"): number {
  return mode === "livraison" ? DELIVERY_FEE : 0;
}

export function getTotal(items: CartItem[], mode: "livraison" | "emporter"): number {
  return getSubtotal(items) + getDelivery(mode);
}
