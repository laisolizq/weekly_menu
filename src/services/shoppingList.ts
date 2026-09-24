import type {
  Component,
  DayPlan,
  Selection,
} from "../types/recipe";

export interface ShoppingItem {
  name: string;
  category: Component["category"];
  people: number[];
  days: number;
  total: number;
}

const CATEGORY_ORDER: Component["category"][] = [
  "CARB",
  "PROTEIN",
  "VEGETABLE",
  "ELABORATION",
  "EXTRA",
];

export function generateShoppingList(
  week: DayPlan[],
  components: Component[]
): ShoppingItem[] {
  const shoppingItems = new Map<
    string,
    {
      name: string;
      category: Component["category"];
      people: number[];
      days: Set<string>;
      total: number;
    }
  >();

  for (const day of week) {
    const meals = [day.lunch, day.dinner];

    for (const meal of meals) {
      if (!meal.enabled) continue;

      const selections: Selection[] = [
        ...meal.carbs,
        ...meal.proteins,
        ...meal.vegetables,
        ...meal.elaborations,
        ...meal.extras,
      ];

      for (const selection of selections) {
        const component = components.find(
          (item) =>
            item.id === selection.componentId
        );

        if (!component) continue;

        const variant = selection.variantId
          ? component.variants.find(
              (item) =>
                item.id === selection.variantId
            )
          : undefined;

        const name = variant
          ? `${component.name} · ${variant.name}`
          : component.name;

        const key = selection.variantId
          ? `${selection.componentId}-${selection.variantId}`
          : selection.componentId;

        const existing = shoppingItems.get(key);

        if (existing) {
          existing.people.push(meal.people);
          existing.days.add(day.day);
          existing.total += meal.people;
        } else {
          shoppingItems.set(key, {
            name,
            category: component.category,
            people: [meal.people],
            days: new Set([day.day]),
            total: meal.people,
          });
        }
      }
    }
  }

  return Array.from(shoppingItems.values())
    .map((item) => ({
      name: item.name,
      category: item.category,
      people: [...new Set(item.people)].sort(
        (a, b) => a - b
      ),
      days: item.days.size,
      total: item.total,
    }))
    .sort((a, b) => {
      const categoryDifference =
        CATEGORY_ORDER.indexOf(a.category) -
        CATEGORY_ORDER.indexOf(b.category);

      if (categoryDifference !== 0) {
        return categoryDifference;
      }

      return a.name.localeCompare(b.name);
    });
}