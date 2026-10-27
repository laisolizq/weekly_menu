import { useEffect, useMemo, useState } from "react";
import { mergeRecipes, parseRecipeCatalog } from "./services/recipeCatalog";
import { migrateMealCategories } from "./services/categoryMigration";
import AttendancePlanner from "./components/AttendancePlanner";
import { newWeek, nextActiveSlot, assignMenuToSlots } from "./services/weekPlanning";
import MenuDiscovery from "./components/MenuDiscovery";
import MenuRecipes from "./components/MenuRecipes";
import { ideaIsAvailable, type MenuIdea } from "./services/menuIdeas";
import DayCard from "./components/DayCard";
import RecipeManager from "./components/RecipeManager";
import ShoppingList from "./components/ShoppingList";
import WeeklySummary from "./components/WeeklySummary";
import { copyTextToClipboard } from "./services/clipboard";
import { generateShoppingList } from "./services/shoppingList";
import type { Component, DayPlan, Selection } from "./types/recipe";
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

const isLocal =
  window.location.hostname === "192.168.1.146" ||
  window.location.hostname === "localhost";

function normalizeMeal(meal: Partial<DayPlan["lunch"]> | undefined) {
  return {
    enabled: meal?.enabled ?? true,
    people: meal?.people || 1,
    carbs: meal?.carbs ?? [],
    proteins: meal?.proteins ?? [],
    vegetables: meal?.vegetables ?? [],
    condiments: meal?.condiments ?? [],
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
    ...(meal.condiments ?? []),
    ...meal.elaborations,
    ...meal.extras,
  ];
}

function App() {
  const [view, setView] = useState<'attendance' | 'discover' | 'week' | 'recipes' | 'components'>(() => { const saved = localStorage.getItem('menu-view'); return saved === 'week' || saved === 'discover' || saved === 'recipes' || saved === 'components' ? saved : 'attendance'; });
  useEffect(() => { localStorage.setItem('menu-view', view); window.scrollTo({ top: 0, behavior: 'instant' }); }, [view]);
  const [attendanceReady, setAttendanceReady] = useState(() => localStorage.getItem('menu-attendance-ready') === 'true');
  useEffect(() => { localStorage.setItem('menu-attendance-ready', String(attendanceReady)); }, [attendanceReady]);
  const [resetVersion, setResetVersion] = useState(0);
  const [previousWeek, setPreviousWeek] = useState<{ week: DayPlan[]; ready: boolean; slot: string } | null>(null);
  useEffect(() => {
    if (!previousWeek) return;
    const timeout = window.setTimeout(() => setPreviousWeek(null), 10_000);
    return () => window.clearTimeout(timeout);
  }, [previousWeek]);
  const [sharedRecipes, setSharedRecipes] = useState<MenuIdea[]>(() => {
    try { return parseRecipeCatalog(JSON.parse(localStorage.getItem('shared-recipe-catalog') || 'null')).recipes; } catch { return []; }
  });
  const [recipes, setRecipes] = useState<MenuIdea[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('menu-recipes') || '[]'); return Array.isArray(saved) ? saved.map((recipe: MenuIdea) => ({ ...recipe, meal: normalizeMeal(recipe.meal) })) : []; } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('menu-recipes', JSON.stringify(recipes)); }, [recipes]);
  const [showSummary, setShowSummary] = useState(false);
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
        return newWeek();
      }
    }

    return newWeek();
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

    const applyComponents = (items: Component[]) => {
      setComponents(items);
      setWeek(current => current.map(day => ({ ...day, lunch: migrateMealCategories(day.lunch, items), dinner: migrateMealCategories(day.dinner, items) })));
      setRecipes(current => current.map(recipe => ({ ...recipe, meal: migrateMealCategories(recipe.meal, items) })));
    };

    const loadComponents = async () => {
      const cached = await db.components.toArray();
      if (cached.length) applyComponents(cached);
      try {
        const incoming = await loadSnapshot();
        const merged = Array.from(new Map([...cached, ...incoming].map(c => [c.id, c])).values());
        await saveComponents(merged);
        applyComponents(merged);
      } catch (error) {
        console.error("Error loading components:", error);
        if (!cached.length) {
          try {
            const snapshot = await loadSnapshot();
            await saveComponents(snapshot);
            applyComponents(snapshot);
          } catch (fallbackError) { console.error(fallbackError); }
        }
      }
    };

    async function loadSnapshot(): Promise<Component[]> {
      const response = await fetch(`${import.meta.env.BASE_URL}components.json`, { cache: "no-cache" });
      if (!response.ok) throw new Error("No se pudo cargar el catálogo");
      return response.json();
    }

    const loadCatalogs = async () => {
      await loadComponents();
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}recipes.json`, { cache: 'no-cache' });
        if (!response.ok) throw new Error('No se pudo cargar el catálogo de recetas');
        const catalog = parseRecipeCatalog(await response.json());
        await saveComponents(catalog.components);
        applyComponents(await db.components.toArray());
        localStorage.setItem('shared-recipe-catalog', JSON.stringify(catalog));
        setSharedRecipes(catalog.recipes);
      } catch (error) { console.error('Error loading shared recipes:', error); }
    };
    void loadCatalogs();

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

  const allRecipes = useMemo(() => mergeRecipes(sharedRecipes, recipes), [sharedRecipes, recipes]);

  const ideas = useMemo(() => [
    ...allRecipes.filter(recipe => ideaIsAvailable(recipe, components)),
  ], [allRecipes, components]);

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
            return `${mealName}: ${meal.people} ${meal.people === 1 ? 'persona' : 'personas'} · Sin asignar`;
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

          return `${mealName}: ${meal.people} ${meal.people === 1 ? 'persona' : 'personas'} · ${names}`;
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
          `${item.name} - ${item.total} ${item.total === 1 ? 'ración' : 'raciones'}`
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
      | "condiments"
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
      | "condiments"
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

  const clearWeek = () => {
    setPreviousWeek({ week, ready: attendanceReady, slot: localStorage.getItem('menu-discovery-slot') || '0' });
    setWeek(newWeek());
    setAttendanceReady(false);
    localStorage.setItem('menu-discovery-slot', '0');
    setResetVersion(v => v + 1);
    setShowSummary(false);
    setView('attendance');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand"><span className="brand-mark" aria-hidden="true">m.</span><div><h1>Menú semanal</h1></div>
          {installState.installable && !installState.installed && !isLocal && <button className="button-secondary install-button" onClick={handleInstallClick}>Instalar</button>}
        </div>
        <nav className="app-tabs" aria-label="Secciones principales">
          {([
            ['attendance', 'Quién come'],
            ['discover', 'Descubrir menús'],
            ['week', 'Mi semana'],
            ['recipes', 'Mis recetas'],
            ['components', 'Componentes'],
          ] as const).map(([target, label]) => <button key={target} aria-current={view === target ? 'page' : undefined} onClick={event => { setView(target); setShowSummary(false); event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }}><span>{label}</span></button>)}
        </nav>
      </header>

      <main className="week">
        {view === 'week' && !showSummary && <div className="page-heading">
          <div><span className="section-kicker">Tu planificación</span><h2>Mi semana</h2></div>
          <div className="page-actions">
            {!showSummary && <button className="button-primary" onClick={() => setShowSummary(true)}>Ver resumen semanal <span aria-hidden="true">↗</span></button>}
            <button className="button-danger" onClick={clearWeek}>Vaciar semana</button>
          </div>
        </div>}
        {previousWeek && <div className="week-reset-notice" role="status">Semana vacía. Tus recetas siguen guardadas. <button className="header-action" onClick={() => {
          setWeek(previousWeek.week); setAttendanceReady(previousWeek.ready);
          localStorage.setItem('menu-discovery-slot', previousWeek.slot);
          setResetVersion(v => v + 1); setPreviousWeek(null); setView('week');
        }}>Deshacer vaciado</button></div>}
        {view === 'attendance' && <AttendancePlanner week={week} onChange={setWeek} onDone={() => {
          setAttendanceReady(true);
          const first = nextActiveSlot(week, 0);
          localStorage.setItem('menu-discovery-slot', String(Math.max(0, first)));
          setResetVersion(v => v + 1);
          setView(first < 0 ? 'week' : 'discover');
        }} />}

        {view === 'recipes' && <MenuRecipes components={components} recipes={allRecipes} personalRecipeIds={recipes.map(r => r.id)}
          onSave={recipe => setRecipes(current => [...current, recipe])}
          onDelete={id => setRecipes(current => current.filter(recipe => recipe.id !== id))} />}
        {view === 'components' && (
          <RecipeManager
            components={components}
            onAddComponent={async (component) => {
              const updatedComponents = [
                ...components,
                component,
              ];

              await saveComponents([component]);
              setComponents(updatedComponents);
            }}
          />
        )}

        {view === "week" && showSummary && (
          <WeeklySummary
            week={week}
            components={components}
            onCopy={copyWeekText}
            onClose={() => setShowSummary(false)}
          />
        )}

        {view === 'discover' && <MenuDiscovery key={resetVersion} week={week} components={components} ideas={ideas}
          onChoose={(dayIndex, type, meal) => setWeek(current => current.map((day, index) => index === dayIndex ? { ...day, [type]: meal } : day))}
          onAssign={(meal, slots) => setWeek(current => assignMenuToSlots(current, meal, slots))}
          onFinish={() => setView('week')} />}

        {view === 'week' && !showSummary && week.map((dayPlan, index) => (
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

        {view === "week" && !showSummary && <ShoppingList items={shoppingList} onCopy={copyShoppingText} />}
      </main>
    </div>
  );
}

export default App;