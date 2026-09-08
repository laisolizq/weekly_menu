import { useEffect, useState } from "react";
import type { DayPlan, Recipe } from "../types/recipe";
import "./MealCopyDialog.css";

type MealType = "lunch" | "dinner";

interface MealCopyDialogProps {
  dayIndex: number;
  meal: MealType;
  recipe: Recipe;
  week: DayPlan[];
  onConfirm: (targets: Array<{ dayIndex: number; meal: MealType }>) => void;
  onClose: () => void;
}

const DAY_ABBREVIATIONS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function targetKey(dayIndex: number, meal: MealType) {
  return `${dayIndex}-${meal}`;
}

export default function MealCopyDialog({
  dayIndex,
  meal,
  recipe,
  week,
  onConfirm,
  onClose,
}: MealCopyDialogProps) {
  const currentTarget = targetKey(dayIndex, meal);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(
    () => new Set([currentTarget])
  );

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const toggleTarget = (target: string) => {
    if (target === currentTarget) return;

    setSelectedTargets((current) => {
      const next = new Set(current);
      if (next.has(target)) next.delete(target);
      else next.add(target);
      return next;
    });
  };

  const confirm = () => {
    onConfirm(
      [...selectedTargets].map((target) => {
        const [selectedDay, selectedMeal] = target.split("-");
        return {
          dayIndex: Number(selectedDay),
          meal: selectedMeal as MealType,
        };
      })
    );
  };

  return (
    <div className="meal-copy-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="meal-copy-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-copy-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="meal-copy-heading">
          <div>
            <h2 id="meal-copy-title">¿Añadir en otros momentos?</h2>
            <p>{recipe.name}</p>
          </div>
          <button className="meal-copy-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="meal-copy-grid" role="group" aria-label="Momentos de la semana">
          <div className="meal-copy-grid-header" />
          {week.map((_, index) => (
            <span className="meal-copy-grid-header" key={DAY_ABBREVIATIONS[index]}>
              {DAY_ABBREVIATIONS[index]}
            </span>
          ))}

          {(["lunch", "dinner"] as MealType[]).map((mealType) => (
            <div className="meal-copy-row" key={mealType}>
              <span className="meal-copy-day">
                {mealType === "lunch" ? "Com." : "Cena"}
              </span>
              {week.map((_, index) => {
                const target = targetKey(index, mealType);
                const isCurrent = target === currentTarget;
                const id = `meal-copy-${target}`;

                return (
                  <label className="meal-copy-checkbox" htmlFor={id} key={target}>
                    <input
                      id={id}
                      type="checkbox"
                      checked={selectedTargets.has(target)}
                      disabled={isCurrent}
                      onChange={() => toggleTarget(target)}
                    />
                    <span className="visually-hidden">
                      {DAY_ABBREVIATIONS[index]} {mealType === "lunch" ? "Comida" : "Cena"}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>

        <button className="meal-copy-confirm" onClick={confirm}>
          Aceptar
        </button>
      </section>
    </div>
  );
}
