import type {
  Component,
  DayPlan,
  Meal,
  Selection,
} from "../types/recipe";
import "./WeeklySummary.css";

interface WeeklySummaryProps {
  week: DayPlan[];
  components: Component[];
  onClose: () => void;
}

function getSelectionNames(
  selections: Selection[],
  components: Component[]
): string {
  return selections
    .map((selection) => {
      const component = components.find(
        (item) => item.id === selection.componentId
      );

      if (!component) return null;

      if (!selection.variantId) {
        return component.name;
      }

      const variant = component.variants.find(
        (item) => item.id === selection.variantId
      );

      return variant
        ? `${component.name} (${variant.name})`
        : component.name;
    })
    .filter(Boolean)
    .join(" + ");
}

function getMealSelections(meal: Meal): Selection[] {
  return [
    ...meal.carbs,
    ...meal.proteins,
    ...meal.vegetables,
    ...meal.elaborations,
    ...meal.extras,
  ];
}

function getMealText(
  meal: Meal,
  components: Component[]
): string {
  if (!meal.enabled) return "—";

  const selections = getMealSelections(meal);

  if (selections.length === 0) {
    return `${meal.people} personas · Sin asignar`;
  }

  return `${meal.people} personas · ${getSelectionNames(
    selections,
    components
  )}`;
}

export default function WeeklySummary({
  week,
  components,
  onClose,
}: WeeklySummaryProps) {
  return (
    <section className="weekly-summary">
      <div className="summary-header">
        <div>
          <span className="summary-label">
            Resumen
          </span>

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
        {week.map((day) => {
          const lunchSelections =
            getMealSelections(day.lunch);

          const dinnerSelections =
            getMealSelections(day.dinner);

          return (
            <div
              className="summary-day"
              key={day.day}
            >
              <div className="summary-day-name">
                {day.day.slice(0, 3)}
              </div>

              <div className="summary-meals">
                <div className="summary-meal">
                  <span className="summary-meal-label">
                    C
                  </span>

                  <span
                    className={
                      day.lunch.enabled &&
                      lunchSelections.length > 0
                        ? "has-recipe"
                        : ""
                    }
                  >
                    {getMealText(
                      day.lunch,
                      components
                    )}
                  </span>
                </div>

                <div className="summary-meal">
                  <span className="summary-meal-label">
                    Ce
                  </span>

                  <span
                    className={
                      day.dinner.enabled &&
                      dinnerSelections.length > 0
                        ? "has-recipe"
                        : ""
                    }
                  >
                    {getMealText(
                      day.dinner,
                      components
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}