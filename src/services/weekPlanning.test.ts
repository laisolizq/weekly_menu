import { describe, expect, it } from 'vitest';
import { newWeek, nextActiveSlot, withAttendance } from './weekPlanning';
import { generateShoppingList } from './shoppingList';

describe('weekly attendance', () => {
  it('starts a fresh week with independent empty meals for two people', () => {
    const week = newWeek();
    expect(week).toHaveLength(7);
    expect(week.every(day => day.lunch.people === 2 && day.dinner.people === 2)).toBe(true);
    week[0].lunch.carbs.push({ componentId: 'rice' });
    expect(week[0].dinner.carbs).toEqual([]);
    expect(newWeek()[0].lunch.carbs).toEqual([]);
  });
  it('skips absent turns and finishes when no active turns remain', () => {
    const week = newWeek().map(day => ({ ...day, lunch: withAttendance(day.lunch, 0), dinner: withAttendance(day.dinner, 0) }));
    expect(nextActiveSlot(week, 0)).toBe(-1);
    week[2].dinner = withAttendance(week[2].dinner, 4);
    expect(nextActiveSlot(week, 0)).toBe(5);
    expect(nextActiveSlot(week, 6)).toBe(-1);
  });
  it('preserves chosen dishes when attendance changes and updates shopping totals', () => {
    const week = newWeek();
    week[0].lunch.carbs = [{ componentId: 'rice' }];
    const catalog = [{ id: 'rice', name: 'Arroz', category: 'CARB' as const, variants: [] }];
    week[0].lunch = withAttendance(week[0].lunch, 0);
    expect(generateShoppingList(week, catalog)).toEqual([]);
    week[0].lunch = withAttendance(week[0].lunch, 5);
    expect(generateShoppingList(week, catalog)[0].total).toBe(5);
  });
});

import { assignMenuToSlots, nextUnplannedSlot } from './weekPlanning';
import { emptyMeal } from './menuIdeas';

it('assigns one recipe to multiple turns using each attendance count and skips absences', () => {
  const week = newWeek();
  week[0].lunch = withAttendance(week[0].lunch, 1);
  week[1].dinner = withAttendance(week[1].dinner, 5);
  week[2].lunch = withAttendance(week[2].lunch, 0);
  const menu = { ...emptyMeal(), proteins: [{ componentId: 'chicken' }] };
  const updated = assignMenuToSlots(week, menu, [0, 3, 4]);
  expect(updated[0].lunch.people).toBe(1);
  expect(updated[1].dinner.people).toBe(5);
  expect(updated[2].lunch.enabled).toBe(false);
  expect(updated[2].lunch.proteins).toEqual([]);
  expect(updated[0].lunch.proteins).toEqual(menu.proteins);
  expect(updated[0].lunch.proteins).not.toBe(updated[1].dinner.proteins);
  expect(week[0].lunch.proteins).toEqual([]);
  expect(nextUnplannedSlot(updated, 0)).toBe(1);
  expect(nextUnplannedSlot(updated, 3)).toBe(5);
});

it('replaces an occupied meal completely while keeping attendance', () => {
  const week = newWeek();
  week[0].lunch.carbs = [{ componentId: 'rice' }];
  const menu = { ...emptyMeal(), vegetables: [{ componentId: 'broccoli' }] };
  const updated = assignMenuToSlots(week, menu, [0]);
  expect(updated[0].lunch.carbs).toEqual([]);
  expect(updated[0].lunch.vegetables).toEqual(menu.vegetables);
  expect(updated[0].lunch.people).toBe(2);
});
