export interface ComponentVariant {
  id: string;
  name: string;
}

export interface Component {
  id: string;
  name: string;
  category:
    | "CARB"
    | "PROTEIN"
    | "VEGETABLE"
    | "CONDIMENT"
    | "ELABORATION"
    | "EXTRA";
  variants: ComponentVariant[];
}

export interface Selection {
  componentId: string;
  variantId?: string;
}

export interface Meal {
  recipeId?: string;
  recipeName?: string;
  enabled: boolean;
  people: number;
  carbs: Selection[];
  proteins: Selection[];
  vegetables: Selection[];
  condiments: Selection[];
  elaborations: Selection[];
  extras: Selection[];
}

export interface DayPlan {
  day: string;
  lunch: Meal;
  dinner: Meal;
}