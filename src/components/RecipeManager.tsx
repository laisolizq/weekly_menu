import { useState } from "react";
import type { Recipe } from "../types/recipe";
import "./RecipeManager.css";

interface RecipeManagerProps {
  recipes: Recipe[];
  onAddRecipe: (recipe: Recipe) => void;
}

function createRecipeId(name: string, recipes: Recipe[]) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "receta";

  let id = base;
  let suffix = 2;
  while (recipes.some((recipe) => recipe.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function downloadRecipes(recipes: Recipe[]) {
  const blob = new Blob([JSON.stringify(recipes, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "recipes.json";
  link.click();
  URL.revokeObjectURL(url);
}

export default function RecipeManager({
  recipes,
  onAddRecipe,
}: RecipeManagerProps) {
  const [name, setName] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [message, setMessage] = useState("");

  const addRecipe = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    const ingredients = ingredientsText
      .split("\n")
      .map((ingredient) => ingredient.trim())
      .filter(Boolean)
      .map((ingredient) => ({ name: ingredient }));

    if (!cleanName || ingredients.length === 0) {
      setMessage("Escribe un nombre y al menos un ingrediente.");
      return;
    }

    onAddRecipe({
      id: createRecipeId(cleanName, recipes),
      name: cleanName,
      ingredients,
    });
    setName("");
    setIngredientsText("");
    setMessage("Receta añadida. Descarga el JSON cuando termines.");
  };

  return (
    <section className="recipe-manager">
      <div className="recipe-manager-heading">
        <div>
          <span className="section-kicker">Catálogo</span>
          <h2>Añadir recetas</h2>
        </div>
        <button
          type="button"
          className="download-json-button"
          onClick={() => downloadRecipes(recipes)}
        >
          Descargar JSON
        </button>
      </div>

      <form className="recipe-form" onSubmit={addRecipe}>
        <label>
          Nombre de la receta
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Ensalada de garbanzos"
          />
        </label>
        <label>
          Ingredientes
          <textarea
            value={ingredientsText}
            onChange={(event) => setIngredientsText(event.target.value)}
            placeholder={"Un ingrediente por línea\nGarbanzos\nTomate\nCebolla"}
            rows={5}
          />
        </label>
        <button type="submit" className="add-recipe-button">
          Añadir receta
        </button>
      </form>

      {message && <p className="recipe-form-message">{message}</p>}

      <div className="recipe-catalogue">
        <div className="recipe-catalogue-header">
          <h3>Recetas disponibles</h3>
          <span>{recipes.length}</span>
        </div>
        <div className="recipe-catalogue-list">
          {recipes.map((recipe) => (
            <div className="recipe-catalogue-item" key={recipe.id}>
              <strong>{recipe.name}</strong>
              <span>{recipe.ingredients.map((item) => item.name).join(" · ")}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
