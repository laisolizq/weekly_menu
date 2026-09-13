import type { Recipe } from "../types/recipe";

const API_URL = "http://127.0.0.1:8000/api";

export async function getRecipes(): Promise<Recipe[]> {
  const response = await fetch(`${API_URL}/recipes/`);

  if (!response.ok) {
    throw new Error("Error fetching recipes");
  }

  return response.json();
}

export async function createRecipe(recipe: Recipe): Promise<Recipe> {
  const response = await fetch(`${API_URL}/recipes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipe),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("API error:", errorData);

    throw new Error("Error creating recipe");
    }

  return response.json();
}