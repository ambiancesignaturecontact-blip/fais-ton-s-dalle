export interface MenuItem {
  id: string;
  name: string;
  category: "menus" | "desserts" | "boissons" | "bowls";
  price: number;
  description?: string;
  customSteps?: number;
  popular?: boolean;
  image: string;
  allergens?: string[];
}

export const CUISSON = ["Froid", "Chaud"] as const;

export const VIANDES = [
  "Tenders",
  "Émincé poulet",
  "Blanc dinde",
  "Jambon dinde",
  "Pastrami",
  "Rosette",
  "Thon",
] as const;

export const CRUDITES = [
  "Salade",
  "Tomate",
  "Oignons",
  "Mais",
  "Carottes râpées",
  "Avocat",
] as const;

export const SAUCES = [
  "Mayo",
  "Ketchup",
  "Algérienne",
  "Samouraï",
  "Blanche",
  "Moutarde",
  "Brésil",
  "Chili",
  "Thai",
] as const;

export const SUPPLEMENTS = ["Cheddar", "Mozzarella", "Feta"] as const;

export const TIRAMISU_PARFUMS = ["Caramel speculos", "Chocolat", "Oreo"] as const;

export const MILKSHAKE_CHOIX = [
  "Kinder Bueno",
  "Kinder Bueno White",
  "Snickers",
  "Oreo",
  "KitKat",
  "KitKat White",
  "Milka",
] as const;

export const MILKSHAKE_COULIS = [
  "Coulis chocolat (+1,00 €)",
  "Coulis caramel (+1,00 €)",
  "Chantilly (+1,00 €)",
] as const;

export const DRINK_OPTIONS = [
  { id: "co", name: "Coca-Cola", price: 1.5, image: "/images/coca.webp" },
  { id: "cz", name: "Coca Zero", price: 1.5, image: "/images/zero.webp" },
  { id: "ck", name: "Coca-Cola Cherry", price: 1.5, image: "/images/coca-cherry.webp" },
  { id: "oa", name: "Oasis Tropical", price: 1.5, image: "/images/oasis.webp" },
  { id: "li", name: "Ice Tea", price: 1.5, image: "/images/icetea.webp" },
  { id: "or", name: "Orangina", price: 1.5, image: "/images/orangina.webp" },
  { id: "cr", name: "Cristaline", price: 1.5, image: "/images/cristaline.webp" },
  { id: "sp", name: "San Pellegrino", price: 1.5, image: "/images/sanpellegrino.webp" },
] as const;

export const DESSERT_OPTIONS = [
  { id: "t", name: "Tiramisu", price: 3.0, image: "/images/tiramisu.webp" },
  { id: "m", name: "Milkshake", price: 5.0, image: "/images/milkshake.webp" },
] as const;

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "l",
    name: "Menu Léger",
    category: "menus",
    price: 6.9,
    description: "Sandwich (viande + crudités + sauce)",
    customSteps: 1,
    popular: true,
    image: "/images/menu-leger.webp",
  },
  {
    id: "c",
    name: "Menu Classique",
    category: "menus",
    price: 7.9,
    description: "Sandwich + boisson",
    customSteps: 4,
    popular: true,
    image: "/images/menu-classique.webp",
  },
  {
    id: "g",
    name: "Menu Gourmand",
    category: "menus",
    price: 9.9,
    description: "Sandwich + boisson + dessert (Tiramisu) inclus",
    customSteps: 5,
    popular: true,
    image: "/images/menu-gourmand.webp",
  },
  {
    id: "r",
    name: "Menu Royal",
    category: "menus",
    price: 15.9,
    description: "Sandwich + boisson + Tiramisu + Milkshake inclus",
    customSteps: 7,
    popular: true,
    image: "/images/menu-royal.webp",
  },
  {
    id: "bl",
    name: "Bowl Léger",
    category: "bowls",
    price: 10.9,
    description: "Bowl composé (viande + crudités + sauce)",
    customSteps: 1,
    image: "/images/bowl-legume.webp",
  },
  {
    id: "bc",
    name: "Bowl Classique",
    category: "bowls",
    price: 11.9,
    description: "Bowl + boisson",
    customSteps: 4,
    image: "/images/bowl-poulet.webp",
  },
  {
    id: "bg",
    name: "Bowl Gourmand",
    category: "bowls",
    price: 13.9,
    description: "Bowl + boisson + Tiramisu inclus",
    customSteps: 5,
    popular: true,
    image: "/images/bowl-gourmand.webp",
  },
  {
    id: "br",
    name: "Bowl Royal",
    category: "bowls",
    price: 18.9,
    description: "Bowl + boisson + Tiramisu + Milkshake inclus",
    customSteps: 7,
    popular: true,
    image: "/images/bowl-royal.webp",
  },
  {
    id: "t",
    name: "Tiramisu",
    category: "desserts",
    price: 3.0,
    description: "Personnalisable (3 parfums)",
    customSteps: 2,
    image: "/images/tiramisu.webp",
  },
  {
    id: "m",
    name: "Milkshake",
    category: "desserts",
    price: 5.0,
    description: "Personnalisable",
    customSteps: 3,
    image: "/images/milkshake.webp",
  },
  {
    id: "co",
    name: "Coca-Cola",
    category: "boissons",
    price: 1.5,
    image: "/images/coca.webp",
  },
  {
    id: "cz",
    name: "Coca Zero",
    category: "boissons",
    price: 1.5,
    image: "/images/zero.webp",
  },
  {
    id: "ck",
    name: "Coca-Cola Cherry",
    category: "boissons",
    price: 1.5,
    image: "/images/coca-cherry.webp",
  },
  {
    id: "oa",
    name: "Oasis Tropical",
    category: "boissons",
    price: 1.5,
    image: "/images/oasis.webp",
  },
  {
    id: "li",
    name: "Ice Tea",
    category: "boissons",
    price: 1.5,
    image: "/images/icetea.webp",
  },
  {
    id: "or",
    name: "Orangina",
    category: "boissons",
    price: 1.5,
    image: "/images/orangina.webp",
  },
  {
    id: "cr",
    name: "Cristaline",
    category: "boissons",
    price: 1.5,
    image: "/images/cristaline.webp",
  },
  {
    id: "sp",
    name: "San Pellegrino",
    category: "boissons",
    price: 1.5,
    image: "/images/sanpellegrino.webp",
  },
];

export const DRINKS = MENU_ITEMS.filter((item) => item.category === "boissons");

export function getItem(id: string): MenuItem | undefined {
  return MENU_ITEMS.find((item) => item.id === id);
}

export function getItemsByCategory(category: string): MenuItem[] {
  if (category === "all") return MENU_ITEMS;
  return MENU_ITEMS.filter((item) => item.category === category);
}
