import { useEffect, useMemo, useState } from "react";
import DayCard from "./components/DayCard";
import RecipeManager from "./components/RecipeManager";
import ShoppingList from "./components/ShoppingList";
import WeeklySummary from "./components/WeeklySummary";
import { copyTextToClipboard } from "./services/clipboard";
import { generateShoppingList } from "./services/shoppingList";
import type { DayPlan, Recipe } from "./types/recipe";
import { getRecipes } from "./services/recipesApi";
import { db, saveRecipes } from "./services/localDb";
import { syncPendingOperations } from "./services/sync";
import { v4 as uuidv4 } from "uuid";
import { getPwaInstallState } from "./services/pwa";
import "./App.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>; 
};

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const isLocal =
  window.location.hostname === "192.168.1.146" ||
  window.location.hostname === "localhost";

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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState(() => getPwaInstallState());
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

  useEffect(() => {
    syncPendingOperations();

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallState(getPwaInstallState());
    };

    const onAppInstalled = () => {
      setInstallPrompt(null);
      setInstallState({ installed: true, installable: false });
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    setInstallState(getPwaInstallState());

    const loadRecipes = async () => {
      try {
        // En casa: cargar desde Django
        if (isLocal) {
          const recipesFromApi = await getRecipes();

          setRecipes(recipesFromApi);
          await saveRecipes(recipesFromApi);

          return;
        }

        // Fuera de casa: primero mirar IndexedDB
        const localRecipes = await db.recipes.toArray();

        if (localRecipes.length > 0) {
          setRecipes(localRecipes);
          return;
        }

        // Si IndexedDB está vacío, cargar el snapshot de GitHub
        const response = await fetch(
          "https://github.com/laisolizq/weekly_menu/releases/download/recipes-data/recipes.json"
        );

        if (!response.ok) {
          throw new Error("Error loading recipes snapshot");
        }

        const recipesFromRelease = await response.json();

        await saveRecipes(recipesFromRelease);
        setRecipes(recipesFromRelease);
      } catch (error) {
        console.error("Error loading recipes:", error);

        // Último fallback: IndexedDB
        const localRecipes = await db.recipes.toArray();
        setRecipes(localRecipes);
      }
    };

    loadRecipes();

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const result = await installPrompt.userChoice;

    if (result.outcome === "accepted") {
      setInstallPrompt(null);
      setInstallState({ installed: true, installable: false });
    }
  };

  const shoppingList = useMemo(
    () => generateShoppingList(week, recipes),
    [week, recipes]
  );

const addCatalogRecipe = async (recipe: Recipe) => {
  try {
    const recipeWithId = {
      ...recipe,
      id: uuidv4(),
    };

    await db.recipes.put(recipeWithId);

    setRecipes((currentRecipes) => [
      ...currentRecipes,
      recipeWithId,
    ]);

    await db.syncQueue.add({
      id: uuidv4(),
      type: "ADD",
      entityId: recipeWithId.id,
      payload: recipeWithId,
      createdAt: new Date().toISOString(),
    });

    await syncPendingOperations();
  } catch (error) {
    console.error("Error saving recipe locally:", error);
  }
};

  const copyWeekText = async () => {
    const text = [
      "MENÚ SEMANAL",
      "",
      ...week.map((day) => {
        const lunch =
          !day.lunch.enabled || day.lunch.recipes.length === 0
            ? `Comida: ${day.lunch.people} personas · Sin asignar`
            : `Comida: ${day.lunch.people} personas · ${day.lunch.recipes
                .map((recipeId) => recipes.find((recipe) => recipe.id === recipeId)?.name)
                .filter(Boolean)
                .join(" + ")}`;

        const dinner =
          !day.dinner.enabled || day.dinner.recipes.length === 0
            ? `Cena: ${day.dinner.people} personas · Sin asignar`
            : `Cena: ${day.dinner.people} personas · ${day.dinner.recipes
                .map((recipeId) => recipes.find((recipe) => recipe.id === recipeId)?.name)
                .filter(Boolean)
                .join(" + ")}`;

        return `${day.day}: ${lunch} | ${dinner}`;
      }),
    ].join("\n");

    await copyTextToClipboard(text);
  };

  const copyShoppingText = async () => {
    const text = [
      ...shoppingList.map(
        (item) => `${item.name} - ${item.total} personas-comida`
      ),
    ].join("\n");

    await copyTextToClipboard(text);
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
        {!showSummary && (
          <button
            className="summary-button"
            onClick={() => setShowSummary(true)}
          >
            Ver resumen semanal
          </button>
        )}

        <div className="app-actions">
          {installState.installable && !installState.installed && !isLocal && (
            <button className="header-action install-button" onClick={handleInstallClick}>
              Instalar app
            </button>
          )}
          <button
            className="header-action"
            onClick={() => setShowRecipeManager((visible) => !visible)}
            aria-expanded={showRecipeManager}
            disabled={!isLocal}
          >
            {showRecipeManager ? "Cerrar recetas" : "Añadir recetas"}
          </button>
          <button className="header-action" onClick={copyWeekText}>
            Copiar semana
          </button>
          <button className="header-action" onClick={copyShoppingText}>
            Copiar compra
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
