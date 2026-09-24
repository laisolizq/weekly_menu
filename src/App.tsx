import { useEffect, useMemo, useState } from "react";
import DayCard from "./components/DayCard";
import RecipeManager from "./components/RecipeManager";
import ShoppingList from "./components/ShoppingList";
import WeeklySummary from "./components/WeeklySummary";
import { copyTextToClipboard } from "./services/clipboard";
import { generateShoppingList } from "./services/shoppingList";
import type { Component, DayPlan, Selection } from "./types/recipe";
import { getComponents } from "./services/recipesApi";
import { db, saveComponents } from "./services/localDb";
import { getPwaInstallState } from "./services/pwa";
import "./App.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
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

function createEmptyMeal(): DayPlan["lunch"] {
  return {
    enabled: true,
    people: 1,
    carbs: [],
    proteins: [],
    vegetables: [],
    elaborations: [],
    extras: [],
  };
}

function createInitialWeek(): DayPlan[] {
  return DAYS.map((day) => ({
    day,
    lunch: createEmptyMeal(),
    dinner: createEmptyMeal(),
  }));
}

function normalizeMeal(meal: Partial<DayPlan["lunch"]> | undefined) {
  return {
    enabled: meal?.enabled ?? true,
    people: meal?.people || 1,
    carbs: meal?.carbs ?? [],
    proteins: meal?.proteins ?? [],
    vegetables: meal?.vegetables ?? [],
    elaborations: meal?.elaborations ?? [],
    extras: meal?.extras ?? [],
  };
}

function normalizeWeek(week: DayPlan[]): DayPlan[] {
  return week.map((day) => ({
    ...day,
    lunch: normalizeMeal(day.lunch),
    dinner: normalizeMeal(day.dinner),
  }));
}

function getMealSelections(meal: DayPlan["lunch"]): Selection[] {
  return [
    ...meal.carbs,
    ...meal.proteins,
    ...meal.vegetables,
    ...meal.elaborations,
    ...meal.extras,
  ];
}

function App() {
  const [showSummary, setShowSummary] = useState(false);
  const [showRecipeManager, setShowRecipeManager] = useState(false);
  const [components, setComponents] = useState<Component[]>([]);

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [installState, setInstallState] = useState(() =>
    getPwaInstallState()
  );

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
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallState(getPwaInstallState());
    };

    const onAppInstalled = () => {
      setInstallPrompt(null);
      setInstallState({
        installed: true,
        installable: false,
      });
    };

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt
    );

    window.addEventListener("appinstalled", onAppInstalled);

    setInstallState(getPwaInstallState());

    const loadComponents = async () => {
      try {
        if (isLocal) {
          const componentsFromApi = await getComponents();

          setComponents(componentsFromApi);
          await saveComponents(componentsFromApi);

          return;
        }

        const localComponents = await db.components.toArray();

        if (localComponents.length > 0) {
          setComponents(localComponents);
          return;
        }

        const response = await fetch(
          `${import.meta.env.BASE_URL}components.json`
        );

        if (!response.ok) {
          throw new Error(
            "Error loading components snapshot"
          );
        }

        const componentsFromSnapshot =
          await response.json();

        await saveComponents(componentsFromSnapshot);
        setComponents(componentsFromSnapshot);
      } catch (error) {
        console.error(
          "Error loading components:",
          error
        );

        const localComponents =
          await db.components.toArray();

        setComponents(localComponents);
      }
    };

    loadComponents();

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        onAppInstalled
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();

    const result = await installPrompt.userChoice;

    if (result.outcome === "accepted") {
      setInstallPrompt(null);

      setInstallState({
        installed: true,
        installable: false,
      });
    }
  };

  const shoppingList = useMemo(
    () => generateShoppingList(week, components),
    [week, components]
  );

  const copyWeekText = async () => {
    const text = [
      "MENÚ SEMANAL",
      "",
      ...week.map((day) => {
        const getMealText = (
          mealName: string,
          meal: DayPlan["lunch"]
        ) => {
          if (!meal.enabled) {
            return `${mealName}: Nadie come`;
          }

          const selections = getMealSelections(meal);

          if (selections.length === 0) {
            return `${mealName}: ${meal.people} personas · Sin asignar`;
          }

          const names = selections
            .map((selection) => {
              const component = components.find(
                (item) =>
                  item.id === selection.componentId
              );

              if (!component) return null;

              const variant = selection.variantId
                ? component.variants.find(
                    (item) =>
                      item.id === selection.variantId
                  )
                : undefined;

              return variant
                ? `${component.name} (${variant.name})`
                : component.name;
            })
            .filter(Boolean)
            .join(" + ");

          return `${mealName}: ${meal.people} personas · ${names}`;
        };

        return `${day.day}: ${getMealText(
          "Comida",
          day.lunch
        )} | ${getMealText("Cena", day.dinner)}`;
      }),
    ].join("\n");

    await copyTextToClipboard(text);
  };

  const copyShoppingText = async () => {
    const text = shoppingList
      .map(
        (item) =>
          `${item.name} - ${item.total} personas-comida`
      )
      .join("\n");

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
          ? {
              ...day,
              [meal]: {
                ...day[meal],
                people,
              },
            }
          : day
      )
    );
  };

  const addSelection = (
    dayIndex: number,
    meal: "lunch" | "dinner",
    category:
      | "carbs"
      | "proteins"
      | "vegetables"
      | "elaborations"
      | "extras",
    selection: Selection
  ) => {
    setWeek((currentWeek) =>
      currentWeek.map((day, index) => {
        if (index !== dayIndex) return day;

        const currentSelections =
          day[meal][category];

        const alreadySelected =
          currentSelections.some(
            (item) =>
              item.componentId === selection.componentId &&
              item.variantId === selection.variantId
          );

        if (alreadySelected) {
          return day;
        }

        return {
          ...day,
          [meal]: {
            ...day[meal],
            enabled: true,
            [category]: [
              ...currentSelections,
              selection,
            ],
          },
        };
      })
    );
  };

  const removeSelection = (
    dayIndex: number,
    meal: "lunch" | "dinner",
    category:
      | "carbs"
      | "proteins"
      | "vegetables"
      | "elaborations"
      | "extras",
    selection: Selection
  ) => {
    setWeek((currentWeek) =>
      currentWeek.map((day, index) => {
        if (index !== dayIndex) return day;

        return {
          ...day,
          [meal]: {
            ...day[meal],
            [category]: day[meal][category].filter(
              (item) =>
                !(
                  item.componentId ===
                    selection.componentId &&
                  item.variantId === selection.variantId
                )
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
          {installState.installable &&
            !installState.installed &&
            !isLocal && (
              <button
                className="header-action install-button"
                onClick={handleInstallClick}
              >
                Instalar app
              </button>
            )}

          <button
            className="header-action"
            onClick={() =>
              setShowRecipeManager(
                (visible) => !visible
              )
            }
            aria-expanded={showRecipeManager}
            disabled={!isLocal}
          >
            {showRecipeManager
              ? "Cerrar recetas"
              : "Añadir recetas"}
          </button>

          <button
            className="header-action"
            onClick={copyWeekText}
          >
            Copiar semana
          </button>

          <button
            className="header-action"
            onClick={copyShoppingText}
          >
            Copiar compra
          </button>
        </div>
      </header>

      <main className="week">
        {showRecipeManager && (
          <RecipeManager
            components={components}
            onAddComponent={async (component) => {
              const updatedComponents = [
                ...components,
                component,
              ];

              setComponents(updatedComponents);
              await saveComponents(updatedComponents);
            }}
          />
        )}

        {showSummary && (
          <WeeklySummary
            week={week}
            components={components}
            onClose={() => setShowSummary(false)}
          />
        )}

        {week.map((dayPlan, index) => (
          <DayCard
            key={dayPlan.day}
            dayPlan={dayPlan}
            dayIndex={index}
            week={week}
            components={components}
            onToggleMeal={(meal) =>
              toggleMeal(index, meal)
            }
            onPeopleChange={(meal, people) =>
              updateMealPeople(
                index,
                meal,
                people
              )
            }
            onAddSelection={(
              meal,
              category,
              selection
            ) =>
              addSelection(
                index,
                meal,
                category,
                selection
              )
            }
            onRemoveSelection={(
              meal,
              category,
              selection
            ) =>
              removeSelection(
                index,
                meal,
                category,
                selection
              )
            }
          />
        ))}

        <ShoppingList items={shoppingList} />
      </main>
    </div>
  );
}

export default App;