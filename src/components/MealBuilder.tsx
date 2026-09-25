import { useState } from "react";
import type {
  Component,
  Meal,
  Selection,
} from "../types/recipe";
import ComponentSelector from "./ComponentSelector";
import "./MealBuilder.css";

type SelectionCategory =
  | "carbs"
  | "proteins"
  | "vegetables"
  | "elaborations"
  | "extras";

const CATEGORIES: SelectionCategory[] = [
  "carbs",
  "proteins",
  "vegetables",
  "elaborations",
  "extras",
];

const CATEGORY_LABELS: Record<
  SelectionCategory,
  string
> = {
  carbs: "Hidratos",
  proteins: "Proteínas",
  vegetables: "Verduras",
  elaborations: "Elaboración / Salsas",
  extras: "Extras",
};

interface MealBuilderProps {
  title: string;
  meal: Meal;
  components: Component[];
  initialCategory: SelectionCategory | null;
  onPeopleChange: (people: number) => void;
  onAddSelection: (
    category: SelectionCategory,
    selection: Selection
  ) => void;
  onRemoveSelection: (
    category: SelectionCategory,
    selection: Selection
  ) => void;
  onClose: () => void;
  onToggle: () => void;
}

export default function MealBuilder({
  title,
  meal,
  components,
  initialCategory,
  onPeopleChange,
  onAddSelection,
  onRemoveSelection,
  onClose,
  onToggle,
}: MealBuilderProps) {
  const isEditingCategory =
    initialCategory !== null;

  /*
   * 0 = personas
   * 1 = hidratos
   * 2 = proteínas
   * 3 = verduras
   * 4 = elaboración / salsas
   * 5 = extras
   */
  const [step, setStep] = useState(() => {
    if (!initialCategory) {
      return 0;
    }

    return (
      CATEGORIES.indexOf(initialCategory) + 1
    );
  });

  const currentCategory =
    step > 0 ? CATEGORIES[step - 1] : null;

  const goNext = () => {
    setStep((current) =>
      Math.min(
        current + 1,
        CATEGORIES.length
      )
    );
  };

  const goBack = () => {
    if (isEditingCategory) {
      onClose();
      return;
    }

    setStep((current) =>
      Math.max(current - 1, 0)
    );
  };

  const finish = () => {
    onClose();
  };

  const totalSteps = CATEGORIES.length + 1;

  /*
   * PERSONAS
   */
  if (step === 0) {
    return (
      <div className="meal-builder-overlay">
        <div
          className="meal-builder"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meal-builder-title"
        >
          <header className="meal-builder-header">
            <div className="meal-builder-title">
              <span className="meal-builder-kicker">
                Nueva comida
              </span>

              <h2 id="meal-builder-title">
                {title}
              </h2>
            </div>

            <button
              type="button"
              className="meal-builder-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          </header>

          <main className="meal-builder-main meal-builder-people">
            <div className="meal-builder-step">
              <span className="meal-builder-step-number">
                Paso 1 de {totalSteps}
              </span>

              <h3>
                ¿Para cuántas personas?
              </h3>

              <div className="people-stepper-large">
                <button
                  type="button"
                  onClick={() =>
                    onPeopleChange(
                      Math.max(
                        1,
                        meal.people - 1
                      )
                    )
                  }
                  disabled={meal.people <= 1}
                  aria-label="Una persona menos"
                >
                  −
                </button>

                <strong>
                  {meal.people}
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    onPeopleChange(
                      meal.people + 1
                    )
                  }
                  aria-label="Una persona más"
                >
                  +
                </button>
              </div>
            </div>
          </main>

          <footer className="meal-builder-footer">
            <button
              type="button"
              className="meal-builder-secondary"
              onClick={onToggle}
            >
              Nadie come en casa
            </button>

            <button
              type="button"
              className="meal-builder-primary"
              onClick={goNext}
            >
              Empezar
            </button>
          </footer>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return null;
  }

  const isLastStep =
    currentCategory === "extras";

  /*
   * Cuando estamos editando una categoría concreta,
   * "Listo" y la flecha de atrás vuelven directamente
   * a la comida.
   */
  const handleBack =
    isEditingCategory ? onClose : goBack;

  const handleClose =
    isEditingCategory
      ? onClose
      : isLastStep
        ? finish
        : goNext;

  const primaryButtonLabel =
    isEditingCategory
      ? "Listo"
      : isLastStep
        ? "Finalizar"
        : "Siguiente";

  return (
    <div className="meal-builder-overlay">
      <div
        className="meal-builder"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-builder-title"
      >
        <header className="meal-builder-header">
          <button
            type="button"
            className="meal-builder-back"
            onClick={handleBack}
            aria-label="Volver"
          >
            ←
          </button>

          <div className="meal-builder-title">
            <span className="meal-builder-kicker">
              {title}
            </span>

            <h2 id="meal-builder-title">
              {CATEGORY_LABELS[currentCategory]}
            </h2>
          </div>

          <span className="meal-builder-progress">
            {isEditingCategory
              ? ""
              : `${step}/${CATEGORIES.length}`}
          </span>

          <button
            type="button"
            className="meal-builder-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <main className="meal-builder-main meal-builder-components">
          <ComponentSelector
            components={components}
            category={currentCategory}
            selected={meal[currentCategory]}
            onSelect={(selection) =>
              onAddSelection(
                currentCategory,
                selection
              )
            }
            onRemoveSelection={(selection) =>
              onRemoveSelection(
                currentCategory,
                selection
              )
            }
            onBack={handleBack}
            onClose={handleClose}
            title={
              CATEGORY_LABELS[currentCategory]
            }
          />
        </main>

        <footer className="meal-builder-footer">
          <button
            type="button"
            className="meal-builder-secondary"
            onClick={handleBack}
          >
            Anterior
          </button>

          <button
            type="button"
            className="meal-builder-primary"
            onClick={handleClose}
          >
            {primaryButtonLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}