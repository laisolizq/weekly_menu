import type { Component, Meal, Selection } from '../types/recipe';

const preparationNames = new Set([
  'guisado', 'estofado', 'salteado', 'wok', 'al horno', 'a la plancha',
  'a la parrilla', 'rebozado', 'tortilla', 'revuelto', 'airfryer',
]);
const normalize = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Only call for the old mixed catalogue (database v3 / JSON v1).
export function migrateLegacyComponent(component: Component): Component {
  const name = normalize(component.name);
  if (component.category === 'ELABORATION' && !preparationNames.has(name)) {
    return { ...component, category: 'CONDIMENT' };
  }
  if (component.category === 'EXTRA' && (name.startsWith('caldo') || name.startsWith('preparado de caldo') || name.startsWith('preparado para'))) {
    return { ...component, category: 'CONDIMENT' };
  }
  return component;
}

const keys = { CARB: 'carbs', PROTEIN: 'proteins', VEGETABLE: 'vegetables', CONDIMENT: 'condiments', ELABORATION: 'elaborations', EXTRA: 'extras' } as const;

// Preserve references and portions, moving only selections whose category changed.
export function migrateMealCategories(meal: Meal, components: Component[]): Meal {
  const result: Meal = { ...meal, carbs: [], proteins: [], vegetables: [], condiments: [], elaborations: [], extras: [] };
  const byId = new Map(components.map(c => [c.id, c]));
  for (const source of Object.values(keys)) {
    for (const selection of (meal[source] ?? []) as Selection[]) {
      const component = byId.get(selection.componentId);
      const target = component ? keys[component.category] : source;
      if (!result[target].some(s => s.componentId === selection.componentId && s.variantId === selection.variantId)) result[target].push(selection);
    }
  }
  return result;
}
