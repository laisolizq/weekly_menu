import type { DayPlan, Recipe } from "../types/recipe";

export interface ShoppingItem {
  name: string;
  people: number[];
  days: number;
  total: number;
}

export function generateShoppingList(
  week: DayPlan[],
  recipes: Recipe[]
): ShoppingItem[] {
  const ingredients = new Map<
    string,
    { name: string; people: number[]; days: Set<string>; total: number }
  >();

  for (const day of week) {
    const meals = [day.lunch, day.dinner];

    for (const meal of meals) {
      if (!meal.enabled) continue;

      for (const recipeId of meal.recipes) {
        const recipe = recipes.find((item) => item.id === recipeId);

        if (!recipe) continue;

        for (const ingredient of recipe.ingredients) {
          const key = ingredient.name.toLowerCase();

          const existing = ingredients.get(key);

          if (existing) {
            existing.people.push(meal.people);
            existing.days.add(day.day);
            existing.total += meal.people;
          } else {
            ingredients.set(key, {
              name: ingredient.name,
              people: [meal.people],
              days: new Set([day.day]),
              total: meal.people,
            });
          }
        }
      }
    }
  }

  return Array.from(ingredients.values())
    .map((item) => ({
      name: item.name,
      people: [...new Set(item.people)].sort((a, b) => a - b),
      days: item.days.size,
      total: item.total,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
