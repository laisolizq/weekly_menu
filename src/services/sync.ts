import { db } from "./localDb";
import { createRecipe } from "./recipesApi";

export async function syncPendingOperations() {
  const operations = await db.syncQueue.toArray();

  for (const operation of operations) {
    try {
      if (operation.type === "ADD") {
        await createRecipe(operation.payload);
      }

      await db.syncQueue.delete(operation.id);
    } catch (error) {
      console.error(
        `Error syncing operation ${operation.id}:`,
        error
      );

      console.error(
        "Error syncing operation:",
        operation
        );

        console.error("Sync error:", error);
      break;
    }
  }
}
