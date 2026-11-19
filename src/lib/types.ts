export const CATEGORIES = ["top", "bottom", "outerwear", "dress", "shoes", "accessory"] as const;
export type Category = (typeof CATEGORIES)[number];

export const FORMALITY = ["sporty", "casual", "smart", "formal"] as const;
export type Formality = (typeof FORMALITY)[number];

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  top: "Tops",
  bottom: "Bottoms",
  outerwear: "Outerwear",
  dress: "Dresses",
  shoes: "Shoes",
  accessory: "Accessories",
};

export type ItemAttributes = {
  name: string;
  category: Category;
  subcategory: string;
  colors: string[];
  pattern: string;
  material: string;
  /** 1 = very light, 5 = heavy winter */
  warmth: number;
  waterproof: boolean;
  formality: Formality;
  seasons: Season[];
};

export type Item = ItemAttributes & {
  id: string;
  /** JPEG data URL, cropped thumbnail */
  image: string;
  notes?: string;
  createdAt: number;
  timesWorn: number;
  lastWorn?: string;
};

export type WearLog = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  itemIds: string[];
  weather?: string;
};

export type Place = { lat: number; lon: number; name: string };

export type Settings = {
  unit: "C" | "F";
  location?: Place;
  style?: string;
  passcode?: string;
};

/** What the server sends back from /api/analyze */
export type AnalyzedItem = ItemAttributes & {
  box: { ymin: number; xmin: number; ymax: number; xmax: number };
};

export type Outfit = {
  title: string;
  itemIds: string[];
  why: string;
  tip: string;
};

export type Suggestion = {
  forecastTake: string;
  outfits: Outfit[];
  gap: string;
};

export const OCCASIONS = [
  { id: "everyday", label: "Everyday" },
  { id: "work", label: "Work / class" },
  { id: "evening", label: "Going out" },
  { id: "sport", label: "Active" },
  { id: "formal", label: "Formal" },
] as const;
