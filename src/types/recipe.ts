export interface Ingredient {
  name: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
}

export interface Meal {
  enabled: boolean;
  recipes: string[];
  people: number;
}

export interface DayPlan {
  day: string;
  lunch: Meal;
  dinner: Meal;
}