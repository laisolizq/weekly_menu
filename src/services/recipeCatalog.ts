import { migrateLegacyComponent, migrateMealCategories } from './categoryMigration';
import type { Component } from '../types/recipe';
import { categoryKeys, type MenuIdea } from './menuIdeas';

export interface RecipeCatalog { version: 2; recipes: MenuIdea[]; components: Component[] }
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const string = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function parseRecipeCatalog(value: unknown): RecipeCatalog {
  if (!record(value) || (value.version !== 1 && value.version !== 2) || !Array.isArray(value.recipes) || !Array.isArray(value.components)) throw new Error('Formato de catálogo no válido');
  for (const c of value.components) {
    if (!record(c) || !string(c.id) || !string(c.name) || !Object.keys(categoryKeys).includes(String(c.category)) || !Array.isArray(c.variants) || !c.variants.every(v => record(v) && string(v.id) && string(v.name))) throw new Error('Componente no válido');
  }
  const components = value.components as Component[];
  for (const r of value.recipes) {
    if (!record(r) || !string(r.id) || !string(r.name) || !Array.isArray(r.mealTypes) || !r.mealTypes.length || !r.mealTypes.every(t => t === 'lunch' || t === 'dinner') || !record(r.meal)) throw new Error('Receta no válida');
    if (r.notes !== undefined && typeof r.notes !== 'string') throw new Error('Nota de receta no válida');
    const meal = r.meal;
    for (const [category, key] of Object.entries(categoryKeys)) {
      const selections = key === 'condiments' && value.version === 1 ? meal[key] ?? [] : meal[key];
      if (!Array.isArray(selections) || !selections.every(s => record(s) && components.some(c => c.id === s.componentId && c.category === category && (s.variantId === undefined || c.variants.some(v => v.id === s.variantId))))) throw new Error('Faltan componentes o variantes de una receta');
    }
  }
  const migratedComponents = value.version === 1 ? components.map(migrateLegacyComponent) : components;
  return {
    version: 2,
    components: migratedComponents,
    recipes: (value.recipes as MenuIdea[]).map(recipe => ({ ...recipe, meal: migrateMealCategories(recipe.meal, migratedComponents) })),
  };
}

export function mergeRecipes(shared: MenuIdea[], personal: MenuIdea[]): MenuIdea[] {
  return Array.from(new Map([...shared, ...personal].map(recipe => [recipe.id, recipe])).values());
}

export function downloadRecipeCatalog(recipes: MenuIdea[], components: Component[]) {
  const catalog: RecipeCatalog = { version: 2, recipes, components };
  const url = URL.createObjectURL(new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'recipes.json';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
