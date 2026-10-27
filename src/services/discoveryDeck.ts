import { shuffledIdeas, type MealType, type MenuIdea } from './menuIdeas';

export interface DiscoveryDeck { seed: number; type: MealType; cards: MenuIdea[] }

export function snapshotIdea(idea: MenuIdea): MenuIdea {
  return structuredClone(idea);
}

// Keep the displayed deck fixed while catalogue requests finish in the background.
// Refresh it only on another turn / shuffle, or when the initial empty catalogue loads.
export function resolveDiscoveryDeck(previous: DiscoveryDeck | null, ideas: MenuIdea[], type: MealType, seed: number): DiscoveryDeck {
  if (previous?.seed === seed && previous.type === type && (previous.cards.length > 0 || !ideas.some(idea => idea.mealTypes.includes(type)))) return previous;
  return { seed, type, cards: shuffledIdeas(ideas, type, seed).map(snapshotIdea) };
}
