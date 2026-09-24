import Dexie, { type Table } from "dexie";
import type { Component } from "../types/recipe";

export type SyncOperation = {
  id: string;
  type: "ADD_SAVED_MENU";
  entityId: string;
  payload: unknown;
  createdAt: string;
};

export class LocalDatabase extends Dexie {
  components!: Table<Component, string>;
  syncQueue!: Table<SyncOperation, string>;

  constructor() {
    super("weekly-menu");

    this.version(3).stores({
      components: "id",
      syncQueue: "id",
    });
  }
}

export const db = new LocalDatabase();

export async function saveComponents(components: Component[]) {
  await db.components.bulkPut(components);
}