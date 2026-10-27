import { describe, expect, it } from 'vitest';
import { emptyMeal, ideaIsAvailable, type MenuIdea } from './menuIdeas';
import { mergeRecipes, parseRecipeCatalog } from './recipeCatalog';

const components = [{ id: 'mobile-extra', name: 'Extra del móvil', category: 'EXTRA', variants: [{ id: 'variant', name: 'Casero' }] }];
const recipe: MenuIdea = { id: 'mobile-recipe', name: 'Receta del móvil', mealTypes: ['dinner'], meal: { ...emptyMeal(), extras: [{ componentId: 'mobile-extra', variantId: 'variant' }] } };
const catalog = { version: 1, recipes: [recipe], components };

describe('portable recipe catalogue', () => {
  it('round-trips recipes with new components and variants for a fresh browser', () => {
    const imported = parseRecipeCatalog(JSON.parse(JSON.stringify(catalog)));
    expect(imported.recipes[0].mealTypes).toEqual(['dinner']);
    expect(ideaIsAvailable(imported.recipes[0], imported.components)).toBe(true);
  });
  it('rejects incomplete or invalid imports before they are saved', () => {
    expect(() => parseRecipeCatalog({ ...catalog, components: [] })).toThrow();
    expect(() => parseRecipeCatalog({ ...catalog, recipes: [{ ...recipe, mealTypes: ['breakfast'] }] })).toThrow();
    expect(() => parseRecipeCatalog({ ...catalog, components: [{ ...components[0], variants: [] }] })).toThrow();
  });
  it('preserves personal recipes and avoids duplicates across repeated catalogue loads', () => {
    const personal = { ...recipe, name: 'Versión personal' };
    const other = { ...recipe, id: 'other' };
    const merged = mergeRecipes([recipe], [personal, other]);
    expect(merged).toHaveLength(2);
    expect(merged[0].name).toBe('Versión personal');
    expect(mergeRecipes([recipe], merged)).toEqual(merged);
  });
});
