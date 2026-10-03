// ─── Types partagés pour tout le projet ──────────────────────

export interface OrderItem {
  id: number;
  item_name: string;
  item_price: number;
  quantity: number;
  customization: string | null;
  subtotal: number;
  category: string | null;
}

export interface Order {
  id: number; uuid: string; created_at: string; status: string;
  customer_name: string | null; customer_phone: string | null;
  total: number; notes: string | null; source: string | null;
  mode: string | null; address: string | null;
  delivery_fee: number | null; is_paid: boolean;
  scheduled_time: string | null;
  order_items: OrderItem[];
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "en-route" | "delivered" | "cancelled";

export const STATUS_FLOW: readonly OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "en-route", "delivered", "cancelled"];

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  preparing: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  ready: "bg-green-500/20 text-green-300 border-green-500/30",
  "en-route": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  delivered: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "En attente", confirmed: "Confirmée", preparing: "En prépa",
    ready: "Prête", "en-route": "En route 🛵", delivered: "Livrée", cancelled: "Annulée",
  };
  return map[status] || status;
}
