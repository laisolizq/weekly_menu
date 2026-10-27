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
