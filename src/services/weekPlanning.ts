import type { DayPlan, Meal } from '../types/recipe';
import { emptyMeal, type MealType } from './menuIdeas';

export function newWeek(): DayPlan[] {
  return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => ({
    day, lunch: { ...emptyMeal(), people: 2 }, dinner: { ...emptyMeal(), people: 2 },
  }));
}

export function withAttendance(meal: Meal, people: number): Meal {
  return { ...meal, enabled: people > 0, people: Math.max(1, people) };
}

export function nextActiveSlot(week: DayPlan[], from: number): number {
  for (let slot = from; slot < week.length * 2; slot++) {
    const type: MealType = slot % 2 ? 'dinner' : 'lunch';
    if (week[Math.floor(slot / 2)][type].enabled) return slot;
  }
  return -1;
}

const mealKeys = ['carbs', 'proteins', 'vegetables', 'condiments', 'elaborations', 'extras'] as const;

export function mealHasSelections(meal: Meal): boolean {
  return mealKeys.some(key => (meal[key] ?? []).length > 0);
}

export function nextUnplannedSlot(week: DayPlan[], from: number): number {
  for (let slot = from; slot < week.length * 2; slot++) {
    const meal = week[Math.floor(slot / 2)][slot % 2 ? 'dinner' : 'lunch'];
    if (meal.enabled && !mealHasSelections(meal)) return slot;
  }
  return -1;
}

export function assignMenuToSlots(week: DayPlan[], menu: Meal, slots: number[]): DayPlan[] {
  const targets = new Set(slots);
  return week.map((day, index) => {
    const updated = { ...day };
    for (const [offset, type] of (['lunch', 'dinner'] as const).entries()) {
      if (!targets.has(index * 2 + offset) || !day[type].enabled) continue;
      const meal = { ...menu, enabled: true, people: day[type].people };
      for (const key of mealKeys) meal[key] = (menu[key] ?? []).map(selection => ({ ...selection }));
      updated[type] = meal;
    }
    return updated;
  });
}
