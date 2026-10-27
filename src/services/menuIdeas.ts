import type { Component, Meal } from '../types/recipe';

export type MealType = 'lunch' | 'dinner';
export interface MenuIdea {
  id: string;
  name: string;
  notes?: string;
  mealTypes: MealType[];
  meal: Meal;
}
export const categoryKeys = {
  CARB: 'carbs', PROTEIN: 'proteins', VEGETABLE: 'vegetables',
  CONDIMENT: 'condiments', ELABORATION: 'elaborations', EXTRA: 'extras',
} as const;
export const emptyMeal = (): Meal => ({ enabled: true, people: 1, carbs: [], proteins: [], vegetables: [], condiments: [], elaborations: [], extras: [] });

export function ideaIsAvailable(idea: MenuIdea, components: Component[]) {
  const selections = Object.values(categoryKeys).flatMap(key => idea.meal[key] ?? []);
  return selections.length > 0 && selections.every(s => components.some(c => c.id === s.componentId && (!s.variantId || c.variants.some(v => v.id === s.variantId))));
}

// A stable seed keeps the deck unchanged while dragging or editing the people count.
export function shuffledIdeas(ideas: MenuIdea[], type: MealType, seed: number): MenuIdea[] {
  const deck = ideas.filter(idea => idea.mealTypes.includes(type));
  let state = seed >>> 0;
  for (let i = deck.length - 1; i > 0; i--) {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    const random = ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
    const j = Math.floor(random * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
