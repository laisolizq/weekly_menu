import type { Recipe } from "../types/recipe";

const API_URL = import.meta.env.VITE_API_URL;

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
    const errorData = await response.text();

    console.error("API error:", errorData);

    throw new Error("Error creating recipe");
  }

  return response.json();
}