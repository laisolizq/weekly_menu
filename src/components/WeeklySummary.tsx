import type { DayPlan, Recipe } from "../types/recipe";
import "./WeeklySummary.css";

interface WeeklySummaryProps {
  week: DayPlan[];
  recipes: Recipe[];
  onClose: () => void;
}

export default function WeeklySummary({
  week,
  recipes,
  onClose,
}: WeeklySummaryProps) {
  const getRecipeNames = (recipeIds: string[]) => {
    return recipeIds
      .map((id) => recipes.find((recipe) => recipe.id === id)?.name)
      .filter(Boolean)
      .join(" + ");
  };

  const getMealText = (
    enabled: boolean,
    recipeIds: string[],
    people: number
  ) => {
    if (!enabled) return "—";

    if (recipeIds.length === 0) return `${people} personas · Sin asignar`;

    return `${people} personas · ${getRecipeNames(recipeIds)}`;
  };

  return (
    <section className="weekly-summary">
      <div className="summary-header">
        <div>
          <span className="summary-label">Resumen</span>
          <h2>Esta semana</h2>
        </div>

        <button
          className="summary-close"
          onClick={onClose}
          aria-label="Cerrar resumen"
        >
          ×
        </button>
      </div>

      <div className="summary-table">
        {week.map((day) => (
          <div className="summary-day" key={day.day}>
            <div className="summary-day-name">
              {day.day.slice(0, 3)}
            </div>

            <div className="summary-meals">
              <div className="summary-meal">
                <span className="summary-meal-label">C</span>
                <span
                  className={
                    day.lunch.enabled && day.lunch.recipes.length > 0
                      ? "has-recipe"
                      : ""
                  }
                >
                  {getMealText(
                    day.lunch.enabled,
                    day.lunch.recipes,
                    day.lunch.people
                  )}
                </span>
              </div>

              <div className="summary-meal">
                <span className="summary-meal-label">Ce</span>
                <span
                  className={
                    day.dinner.enabled && day.dinner.recipes.length > 0
                      ? "has-recipe"
                      : ""
                  }
                >
                  {getMealText(
                    day.dinner.enabled,
                    day.dinner.recipes,
                    day.dinner.people
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
