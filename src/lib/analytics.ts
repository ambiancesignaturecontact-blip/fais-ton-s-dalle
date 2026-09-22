"use client";

const STORAGE_KEY = "ftsd_analytics";

interface AnalyticsData {
  pageViews: Record<string, number>;
  productClicks: Record<string, number>;
  orders: { date: string; items: { name: string; qty: number }[]; total: number }[];
  dailyVisits: Record<string, number>;
  hourlyActivity: Record<string, number>;
}

function getData(): AnalyticsData {
  if (typeof window === "undefined") return { pageViews: {}, productClicks: {}, orders: [], dailyVisits: {}, hourlyActivity: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial: AnalyticsData = { pageViews: {}, productClicks: {}, orders: [], dailyVisits: {}, hourlyActivity: {} };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveData(data: AnalyticsData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function trackPageView(path: string) {
  const data = getData();
  data.pageViews[path] = (data.pageViews[path] || 0) + 1;
  const today = new Date().toISOString().slice(0, 10);
  data.dailyVisits[today] = (data.dailyVisits[today] || 0) + 1;
  const hour = `${new Date().getHours()}h`;
  data.hourlyActivity[hour] = (data.hourlyActivity[hour] || 0) + 1;
  saveData(data);
}

export function trackProductClick(productName: string) {
  const data = getData();
  data.productClicks[productName] = (data.productClicks[productName] || 0) + 1;
  saveData(data);
}

export function trackOrder(items: { name: string; qty: number }[], total: number) {
  const data = getData();
  data.orders.push({ date: new Date().toISOString(), items, total });
  saveData(data);
}

export function getAnalytics() {
  const data = getData();
  
  // Top produits (depuis les clics + commandes)
  const productSales: Record<string, number> = {};
  
  data.orders.forEach(order => {
    order.items.forEach(item => {
      productSales[item.name] = (productSales[item.name] || 0) + item.qty;
    });
  });
  
  // Combiner avec les clics
  Object.entries(data.productClicks).forEach(([name, count]) => {
    productSales[name] = (productSales[name] || 0) + Math.round(count * 0.3);
  });

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      count,
      revenue: count * (name.includes("Royal") ? 15.9 : name.includes("Gourmand") ? 9.9 : name.includes("Classique") ? 7.9 : name.includes("Léger") ? 6.9 : name.includes("Tiramisu") ? 3.0 : name.includes("Milkshake") ? 5.0 : 5.0),
    }));

  // Activité horaire
  const hourlyEntries = Object.entries(data.hourlyActivity).sort((a, b) => {
    const ha = parseInt(a[0]), hb = parseInt(b[0]);
    return ha - hb;
  });
  
  const hourlyActivity = [
    { hour: "11h-14h", visits: 0, orders: 0 },
    { hour: "14h-17h", visits: 0, orders: 0 },
    { hour: "17h-20h", visits: 0, orders: 0 },
    { hour: "20h-23h", visits: 0, orders: 0 },
    { hour: "23h-02h", visits: 0, orders: 0 },
    { hour: "02h-03h", visits: 0, orders: 0 },
  ];
  
  hourlyEntries.forEach(([hour, count]) => {
    const h = parseInt(hour);
    if (h >= 11 && h < 14) hourlyActivity[0].visits += count;
    else if (h >= 14 && h < 17) hourlyActivity[1].visits += count;
    else if (h >= 17 && h < 20) hourlyActivity[2].visits += count;
    else if (h >= 20 && h < 23) hourlyActivity[3].visits += count;
    else if (h >= 23 || h < 2) hourlyActivity[4].visits += count;
    else if (h >= 2 && h < 3) hourlyActivity[5].visits += count;
  });

  // Commandes par tranche horaire
  data.orders.forEach(order => {
    const h = new Date(order.date).getHours();
    if (h >= 11 && h < 14) hourlyActivity[0].orders++;
    else if (h >= 14 && h < 17) hourlyActivity[1].orders++;
    else if (h >= 17 && h < 20) hourlyActivity[2].orders++;
    else if (h >= 20 && h < 23) hourlyActivity[3].orders++;
    else if (h >= 23 || h < 2) hourlyActivity[4].orders++;
    else if (h >= 2 && h < 3) hourlyActivity[5].orders++;
  });

  // Stats périodes
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

  const ordersToday = data.orders.filter(o => o.date.slice(0, 10) === today);
  const ordersWeek = data.orders.filter(o => o.date.slice(0, 10) >= weekAgo);
  const ordersMonth = data.orders.filter(o => o.date.slice(0, 10) >= monthAgo);

  const visitsToday = Object.entries(data.dailyVisits).filter(([d]) => d === today).reduce((s, [, c]) => s + c, 0);
  const visitsWeek = Object.entries(data.dailyVisits).filter(([d]) => d >= weekAgo).reduce((s, [, c]) => s + c, 0);
  const visitsMonth = Object.entries(data.dailyVisits).reduce((s, [, c]) => s + c, 0);

  const calcStats = (orders: typeof data.orders, visits: number) => ({
    visits,
    orders: orders.length,
    revenue: orders.reduce((s, o) => s + o.total, 0),
    avgCart: orders.length > 0 ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0,
    conversionRate: visits > 0 ? Math.round((orders.length / visits) * 1000) / 10 : 0,
  });

  return {
    today: calcStats(ordersToday, visitsToday),
    week: calcStats(ordersWeek, visitsWeek),
    month: calcStats(ordersMonth, visitsMonth),
    topProducts,
    hourlyActivity,
    topZones: [{ ville: "Les Pavillons-sous-Bois", count: data.orders.length }, { ville: "Bondy", count: Math.round(data.orders.length * 0.4) }],
    totalOrders: data.orders.length,
  };
}

export function resetAnalytics(): void {
  const empty: AnalyticsData = { pageViews: {}, productClicks: {}, orders: [], dailyVisits: {}, hourlyActivity: {} };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(empty)); } catch {}
}
