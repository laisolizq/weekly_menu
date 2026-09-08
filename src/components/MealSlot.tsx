import { useState } from "react";
import type { DayPlan, Meal, Recipe } from "../types/recipe";
import MealCopyDialog from "./MealCopyDialog";
import RecipeSelector from "./RecipeSelector";
import "./MealSlot.css";

interface MealSlotProps {
  title: string;
  dayIndex: number;
  week: DayPlan[];
  meal: Meal;
  recipes: Recipe[];
  onToggle: () => void;
  onPeopleChange: (people: number) => void;
  onAddRecipe: (
    recipeId: string,
    targets: Array<{ dayIndex: number; meal: "lunch" | "dinner" }>
  ) => void;
  onRemoveRecipe: (recipeId: string) => void;
}

export default function MealSlot({
  title,
  dayIndex,
  week,
  meal,
  recipes,
  onToggle,
  onPeopleChange,
  onAddRecipe,
  onRemoveRecipe,
}: MealSlotProps) {
  const [recipeToCopy, setRecipeToCopy] = useState<Recipe | null>(null);
  const mealType = title === "Comida" ? "lunch" : "dinner";

  return (
    <div className={`meal-slot ${!meal.enabled ? "disabled" : ""}`}>
      <div className="meal-header">
        <button
          className="toggle-button"
          onClick={onToggle}
          aria-label={meal.enabled ? `Quitar ${title}` : `Añadir ${title}`}
        >
          {meal.enabled ? "×" : "+"}
        </button>

        <h3>{title}</h3>

        {meal.enabled && (
          <div className="people-control">
            <span>Personas</span>
            <div className="people-stepper">
              <button
                type="button"
                onClick={() => onPeopleChange(meal.people + 1)}
                aria-label={`Añadir una persona a ${title}`}
              >
                <span aria-hidden="true">▲</span>
              </button>
              <output aria-label={`${meal.people} personas`}>
                {meal.people}
              </output>
              <button
                type="button"
                onClick={() => onPeopleChange(Math.max(1, meal.people - 1))}
                aria-label={`Quitar una persona de ${title}`}
                disabled={meal.people <= 1}
              >
                <span aria-hidden="true">▼</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {meal.enabled && (
        <>
          <div className="selected-recipes">
            {meal.recipes.map((recipeId) => {
              const recipe = recipes.find((item) => item.id === recipeId);

              if (!recipe) return null;

              return (
                <div className="selected-recipe" key={recipeId}>
                  <span>{recipe.name}</span>

                  <button
                    className="remove-recipe"
                    onClick={() => onRemoveRecipe(recipeId)}
                    aria-label={`Eliminar ${recipe.name}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <RecipeSelector
            recipes={recipes}
            onSelect={(recipeId) => {
              const recipe = recipes.find((item) => item.id === recipeId);
              if (recipe) setRecipeToCopy(recipe);
            }}
          />
        </>
      )}

      {recipeToCopy && (
        <MealCopyDialog
          dayIndex={dayIndex}
          meal={mealType}
          recipe={recipeToCopy}
          week={week}
          onClose={() => setRecipeToCopy(null)}
          onConfirm={(targets) => {
            onAddRecipe(recipeToCopy.id, targets);
            setRecipeToCopy(null);
          }}
        />
      )}
    </div>
  );
}
