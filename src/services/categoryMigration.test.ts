import { describe, expect, it } from 'vitest';
import type { Component, DayPlan } from '../types/recipe';
import { emptyMeal } from './menuIdeas';
import { migrateLegacyComponent, migrateMealCategories } from './categoryMigration';
import { parseRecipeCatalog } from './recipeCatalog';
import { generateShoppingList } from './shoppingList';

const oldComponents: Component[] = [
  { id: 'oven', name: 'Al horno', category: 'ELABORATION', variants: [] },
  { id: 'saute', name: 'Salteado', category: 'ELABORATION', variants: [] },
  { id: 'soy', name: 'Soja', category: 'ELABORATION', variants: [] },
  { id: 'curry', name: 'Curry', category: 'ELABORATION', variants: [] },
  { id: 'stock', name: 'Preparado de caldo', category: 'EXTRA', variants: [] },
];
const legacyMeal = { ...emptyMeal(), people: 3, elaborations: ['oven', 'soy', 'curry', 'saute'].map(componentId => ({ componentId })), extras: [{ componentId: 'stock' }] };

describe('separate preparations from groceries', () => {
  it('moves legacy selections while preserving IDs and people, and is repeatable', () => {
    const components = oldComponents.map(migrateLegacyComponent);
    const meal = migrateMealCategories(legacyMeal, components);
    expect(meal.people).toBe(3);
    expect(meal.elaborations.map(s => s.componentId)).toEqual(['oven', 'saute']);
    expect(meal.condiments.map(s => s.componentId)).toEqual(['soy', 'curry', 'stock']);
    expect(meal.extras).toEqual([]);
    expect(migrateMealCategories(meal, components)).toEqual(meal);
  });
  it('excludes methods even if a selection is still in a legacy bucket', () => {
    const components = oldComponents.map(migrateLegacyComponent);
    const week: DayPlan[] = [{ day: 'Lunes', lunch: legacyMeal, dinner: { ...legacyMeal, enabled: false } }];
    const list = generateShoppingList(week, components);
    expect(list.map(item => item.name).sort()).toEqual(['Curry', 'Preparado de caldo', 'Soja']);
    expect(list.every(item => item.category === 'CONDIMENT' && item.total === 3)).toBe(true);
  });
  it('imports v1 exports without a condiments bucket and exports compatible v2 data', () => {
    const { condiments: _unused, ...oldMeal } = legacyMeal;
    void _unused;
    const migrated = parseRecipeCatalog({ version: 1, components: oldComponents, recipes: [{ id: 'recipe', name: 'Receta antigua', mealTypes: ['lunch'], meal: oldMeal }] });
    expect(migrated.version).toBe(2);
    expect(migrated.recipes[0].meal.condiments).toHaveLength(3);
    expect(parseRecipeCatalog(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);
  });
  it('keeps new custom preparation methods out of shopping without name matching', () => {
    const components: Component[] = [{ id: 'custom', name: 'Cocción lenta', category: 'ELABORATION', variants: [] }];
    const meal = { ...emptyMeal(), elaborations: [{ componentId: 'custom' }] };
    expect(generateShoppingList([{ day: 'Lunes', lunch: meal, dinner: emptyMeal() }], components)).toEqual([]);
  });
});
