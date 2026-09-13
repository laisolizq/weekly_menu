import Dexie, { type Table } from "dexie";
import type { Recipe } from "../types/recipe";

export type SyncOperation = {
  id: string;
  type: "ADD";
  entityId: string;
  payload: Recipe;
  createdAt: string;
};

export class LocalDatabase extends Dexie {
  recipes!: Table<Recipe, string>;
  syncQueue!: Table<SyncOperation, string>;

  constructor() {
    super("weekly-menu");

    this.version(2).stores({
      recipes: "id",
      syncQueue: "id",
    });
  }
}

export const db = new LocalDatabase();

export async function saveRecipes(recipes: Recipe[]) {
  await db.recipes.bulkPut(recipes);
}