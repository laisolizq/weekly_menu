import { expect, it } from 'vitest';
import { emptyMeal, type MenuIdea } from './menuIdeas';
import { resolveDiscoveryDeck, snapshotIdea } from './discoveryDeck';
import { assignMenuToSlots, newWeek } from './weekPlanning';

const soup: MenuIdea = { id: 'soup', name: 'Sopa', mealTypes: ['dinner'], meal: { ...emptyMeal(), carbs: [{ componentId: 'pasta-sopa' }], proteins: [{ componentId: 'albondigas' }] } };
const gnocchi: MenuIdea = { id: 'gnocchi', name: 'Ñoquis', mealTypes: ['dinner'], meal: { ...emptyMeal(), carbs: [{ componentId: 'noquis' }] } };

it('keeps the visible recipe fixed when the catalogue reloads in a different order', () => {
  const deck = resolveDiscoveryDeck(null, [soup], 'dinner', 42);
  expect(deck.cards[0].id).toBe('soup');
  const refreshed = resolveDiscoveryDeck(deck, [gnocchi, soup], 'dinner', 42);
  expect(refreshed).toBe(deck);
  expect(refreshed.cards[0].id).toBe('soup');
  expect(resolveDiscoveryDeck(refreshed, [gnocchi, soup], 'dinner', 43).cards).toHaveLength(2);
});

it('fills an initially empty deck when recipes arrive', () => {
  const empty = resolveDiscoveryDeck(null, [], 'dinner', 0);
  expect(resolveDiscoveryDeck(empty, [soup], 'dinner', 0).cards[0].id).toBe('soup');
});

it('assigns the pinned soup to two dinners even after the current card and source change', () => {
  const source = snapshotIdea(soup);
  const selected = snapshotIdea(source);
  source.meal.carbs[0].componentId = 'noquis';
  source.name = 'Ñoquis';
  const week = newWeek();
  week[0].dinner.people = 1;
  week[2].dinner.people = 3;
  const assigned = assignMenuToSlots(week, { ...selected.meal, recipeId: selected.id, recipeName: selected.name }, [1, 5]);
  for (const day of [0, 2]) {
    expect(assigned[day].dinner.recipeName).toBe('Sopa');
    expect(assigned[day].dinner.carbs).toEqual(soup.meal.carbs);
    expect(assigned[day].dinner.proteins).toEqual(soup.meal.proteins);
    expect(assigned[day].lunch.carbs).toEqual([]);
  }
  expect(assigned[0].dinner.people).toBe(1);
  expect(assigned[2].dinner.people).toBe(3);
});
