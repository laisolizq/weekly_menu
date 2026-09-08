import type { Recipe } from "../types/recipe";
import "./RecipeSelector.css";

interface RecipeSelectorProps {
  recipes: Recipe[];
  onSelect: (recipeId: string) => void;
}

export default function RecipeSelector({
  recipes,
  onSelect,
}: RecipeSelectorProps) {
  return (
    <select
      className="recipe-selector"
      defaultValue=""
      onChange={(event) => {
        if (event.target.value) {
          onSelect(event.target.value);
          event.target.value = "";
        }
      }}
    >
      <option value="" disabled>
        Seleccionar receta...
      </option>

      {recipes.map((recipe) => (
        <option key={recipe.id} value={recipe.id}>
          {recipe.name}
        </option>
      ))}
    </select>
  );
}
