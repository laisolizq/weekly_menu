import { expect, it } from 'vitest';
import catalog from '../../public/recipes.json';
import { parseRecipeCatalog } from './recipeCatalog';
import { shuffledIdeas } from './menuIdeas';

it('shuffles every eligible recipe once without changing the catalogue', () => {
  const { recipes } = parseRecipeCatalog(catalog);
  const original = recipes.map(r => r.id);
  const deck = shuffledIdeas(recipes, 'dinner', 42);
  expect(deck.every(r => r.mealTypes.includes('dinner'))).toBe(true);
  expect(deck.map(r => r.id).sort()).toEqual(recipes.filter(r => r.mealTypes.includes('dinner')).map(r => r.id).sort());
  expect(new Set(deck.map(r => r.id)).size).toBe(deck.length);
  expect(recipes.map(r => r.id)).toEqual(original);
});

it('keeps a deck stable for one seed and changes order with a new seed', () => {
  const { recipes } = parseRecipeCatalog(catalog);
  expect(shuffledIdeas(recipes, 'lunch', 42)).toEqual(shuffledIdeas(recipes, 'lunch', 42));
  expect(shuffledIdeas(recipes, 'lunch', 42)).not.toEqual(shuffledIdeas(recipes, 'lunch', 81));
  expect(shuffledIdeas([], 'lunch', 0)).toEqual([]);
});
