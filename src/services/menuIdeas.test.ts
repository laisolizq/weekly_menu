import { describe, expect, it } from 'vitest';
import catalog from '../../public/recipes.json';
import componentCatalog from '../../public/components.json';
import type { Component, DayPlan } from '../types/recipe';
import { ideaIsAvailable } from './menuIdeas';
import { parseRecipeCatalog } from './recipeCatalog';
import { generateShoppingList } from './shoppingList';

const { recipes, components } = parseRecipeCatalog(catalog);
describe('household menu catalogue', () => {
  it('loads real meals with unique IDs and valid components in both catalogues', () => {
    expect(recipes.length).toBeGreaterThan(40);
    expect(new Set(recipes.map(r => r.id)).size).toBe(recipes.length);
    expect(recipes.every(idea => ideaIsAvailable(idea, components))).toBe(true);
    expect(recipes.every(idea => ideaIsAvailable(idea, componentCatalog as Component[]))).toBe(true);
    expect(recipes.some(r => r.id.startsWith('starter-'))).toBe(false);
  });
  it('preserves meal tags and fish and pasta variants from the source menus', () => {
    const salmon = recipes.find(r => r.name === 'Salmó amb arròs i algues')!;
    expect(salmon.mealTypes).toEqual(['lunch']);
    expect(salmon.meal.proteins[0].variantId).toBe('seed-pescado-salmon');
    const pasta = recipes.find(r => r.name === 'Pasta de llenties amb pollastre i espàrrecs')!;
    expect(pasta.meal.carbs[0].variantId).toBe('seed-lentejas-pasta-de-lentejas');
    expect(recipes.find(r => r.name === 'Pollastre al curry amb arròs')!.mealTypes).toEqual(['lunch', 'dinner']);
  });
  it('omits unavailable recipes and counts servings only for meals at home', () => {
    const idea = recipes.find(r => r.name === 'Salmó amb arròs i algues')!;
    expect(ideaIsAvailable(idea, components.filter(c => c.name !== 'Algas'))).toBe(false);
    const week: DayPlan[] = [{ day: 'Lunes', lunch: { ...idea.meal, people: 3 }, dinner: { ...idea.meal, people: 2, enabled: false } }];
    const shopping = generateShoppingList(week, components);
    expect(shopping).toHaveLength(3);
    expect(shopping.every(item => item.total === 3)).toBe(true);
  });
});

describe('confirmed household recipes', () => {
  const names = (name: string) => {
    const recipe = recipes.find(r => r.name === name)!;
    return Object.values(recipe.meal).filter(Array.isArray).flat().map(s => {
      const component = components.find(c => c.id === s.componentId)!;
      return s.variantId ? `${component.name}:${component.variants.find(v => v.id === s.variantId)!.name}` : component.name;
    }).sort();
  };
  it('uses the confirmed soup and cream ingredients', () => {
    expect(names('Sopa amb mandonguilles de pollastre')).toEqual(['Albóndigas:Pollo', 'Caldo', 'Pasta:Para sopa']);
    expect(names('Crema de pollastre')).toEqual(['Cebolla', 'Pollo:Contramuslo', 'Puerro', 'Zanahoria']);
  });
  it('keeps tomato optional through two distinct Madeira proposals', () => {
    const plain = names('Cigrons Madeira (sense tomàquet)');
    expect(plain).toEqual(['Cebolla', 'Champiñones', 'Garbanzos:Garbanzos', 'Jamón']);
    expect(names('Cigrons Madeira amb tomàquet')).toEqual([...plain, 'Tomate']);
  });
  it('distinguishes carbo, carbopa and the prepared semolina', () => {
    expect(names('Peix blanc amb carbassó i moniato')).not.toContain('Patata');
    expect(names('Peix blanc amb carbopa')).toContain('Patata');
    expect(names('Sèmola amb peix')).toContain('Sémola de verduras (preparado)');
    expect(names('Sèmola amb peix')).toContain('Caldo:Pollo');
    expect(names('Sèmola amb peix')).not.toContain('Brócoli');
    expect(recipes.find(r => r.name === 'Sèmola amb peix')!.notes).toContain('agua de hervir el brócoli');
  });
});
