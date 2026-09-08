import { useEffect, useMemo, useState } from "react";
import DayCard from "./components/DayCard";
import RecipeManager from "./components/RecipeManager";
import ShoppingList from "./components/ShoppingList";
import WeeklySummary from "./components/WeeklySummary";
import recipesData from "./data/recipes.json";
import { downloadShoppingImage, downloadWeekImage } from "./services/exportImage";
import { generateShoppingList } from "./services/shoppingList";
import type { DayPlan, Recipe } from "./types/recipe";
import "./App.css";

const initialRecipes = recipesData as Recipe[];

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function createInitialWeek(): DayPlan[] {
  return DAYS.map((day) => ({
    day,
    lunch: {
      enabled: true,
      recipes: [],
      people: 1,
    },
    dinner: {
      enabled: true,
      recipes: [],
      people: 1,
    },
  }));
}

function normalizeWeek(week: DayPlan[]): DayPlan[] {
  return week.map((day) => ({
    ...day,
    lunch: { ...day.lunch, people: day.lunch.people || 1 },
    dinner: { ...day.dinner, people: day.dinner.people || 1 },
  }));
}

function App() {
  const [showSummary, setShowSummary] = useState(false);
  const [showRecipeManager, setShowRecipeManager] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);

  const [week, setWeek] = useState<DayPlan[]>(() => {
    const saved = localStorage.getItem("weekly-menu");

    if (saved) {
      try {
        return normalizeWeek(JSON.parse(saved));
      } catch {
        return createInitialWeek();
      }
    }

    return createInitialWeek();
  });

  useEffect(() => {
    localStorage.setItem("weekly-menu", JSON.stringify(week));
  }, [week]);

  const shoppingList = useMemo(
    () => generateShoppingList(week, recipes),
    [week, recipes]
  );

  const addCatalogRecipe = (recipe: Recipe) => {
    setRecipes((currentRecipes) => [...currentRecipes, recipe]);
  };

  const toggleMeal = (
    dayIndex: number,
    meal: "lunch" | "dinner"
  ) => {
    setWeek((currentWeek) =>
      currentWeek.map((day, index) => {
        if (index !== dayIndex) return day;

        return {
          ...day,
          [meal]: {
            ...day[meal],
            enabled: !day[meal].enabled,
          },
        };
      })
    );
  };

  const updateMealPeople = (
    dayIndex: number,
    meal: "lunch" | "dinner",
    people: number
  ) => {
    setWeek((currentWeek) =>
      currentWeek.map((day, index) =>
        index === dayIndex
          ? { ...day, [meal]: { ...day[meal], people } }
          : day
      )
    );
  };

  const addRecipe = (
    targets: Array<{ dayIndex: number; meal: "lunch" | "dinner" }>,
    recipeId: string
  ) => {
    setWeek((currentWeek) =>
      currentWeek.map((day, dayIndex) => {
        const selectedMeals = targets
          .filter((target) => target.dayIndex === dayIndex)
          .map((target) => target.meal);

        if (!selectedMeals.length) return day;

        return selectedMeals.reduce<DayPlan>(
          (updatedDay, meal) => ({
            ...updatedDay,
            [meal]: {
              ...updatedDay[meal],
              enabled: true,
              recipes: updatedDay[meal].recipes.includes(recipeId)
                ? updatedDay[meal].recipes
                : [...updatedDay[meal].recipes, recipeId],
            },
          }),
          day
        );
      })
    );
  };

  const removeRecipe = (
    dayIndex: number,
    meal: "lunch" | "dinner",
    recipeId: string
  ) => {
    setWeek((currentWeek) =>
      currentWeek.map((day, index) => {
        if (index !== dayIndex) return day;

        return {
          ...day,
          [meal]: {
            ...day[meal],
            recipes: day[meal].recipes.filter(
              (id) => id !== recipeId
            ),
          },
        };
      })
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Menú semanal</h1>
        <p>Organiza tus comidas de la semana</p>

        {!showSummary && (
          <button
            className="summary-button"
            onClick={() => setShowSummary(true)}
          >
            Ver resumen semanal
          </button>
        )}

        <div className="app-actions">
          <button
            className="header-action"
            onClick={() => setShowRecipeManager((visible) => !visible)}
            aria-expanded={showRecipeManager}
          >
            {showRecipeManager ? "Cerrar recetas" : "Añadir recetas"}
          </button>
          <button
            className="header-action"
            onClick={() => downloadWeekImage(week, recipes)}
          >
            Guardar semana
          </button>
          <button
            className="header-action"
            onClick={() => downloadShoppingImage(shoppingList)}
          >
            Guardar compra
          </button>
        </div>
      </header>

      <main className="week">
        {showRecipeManager && (
          <RecipeManager recipes={recipes} onAddRecipe={addCatalogRecipe} />
        )}

        {showSummary && (
          <WeeklySummary
            week={week}
            recipes={recipes}
            onClose={() => setShowSummary(false)}
          />
        )}

        {week.map((dayPlan, index) => (
          <DayCard
            key={dayPlan.day}
            dayPlan={dayPlan}
            dayIndex={index}
            week={week}
            recipes={recipes}
            onToggleMeal={(meal) => toggleMeal(index, meal)}
            onPeopleChange={(meal, people) =>
              updateMealPeople(index, meal, people)
            }
            onAddRecipe={(recipeId, targets) => addRecipe(targets, recipeId)}
            onRemoveRecipe={(meal, recipeId) =>
              removeRecipe(index, meal, recipeId)
            }
          />
        ))}

        <ShoppingList items={shoppingList} />
      </main>
    </div>
  );
}

export default App;
