import { useState } from "react";
import { createPortal } from "react-dom";

import type {
  Component,
  Meal,
  Selection,
} from "../types/recipe";
import MealBuilder from "./MealBuilder";
import "./MealSlot.css";

interface MealSlotProps {
  title: string;
  dayIndex: number;
  week: import("../types/recipe").DayPlan[];
  meal: Meal;
  components: Component[];
  onToggle: () => void;
  onPeopleChange: (people: number) => void;
  onAddSelection: (
    category:
      | "carbs"
      | "proteins"
      | "vegetables"
      | "elaborations"
      | "extras",
    selection: Selection
  ) => void;
  onRemoveSelection: (
    category:
      | "carbs"
      | "proteins"
      | "vegetables"
      | "elaborations"
      | "extras",
    selection: Selection
  ) => void;
}

type SelectionCategory =
  | "carbs"
  | "proteins"
  | "vegetables"
  | "elaborations"
  | "extras";

const CATEGORY_LABELS: Record<
  SelectionCategory,
  string
> = {
  carbs: "Hidratos",
  proteins: "Proteínas",
  vegetables: "Verduras",
  elaborations: "Elaboración",
  extras: "Extras",
};

function getSelectionName(
  selection: Selection,
  components: Component[]
): string | null {
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
}

function getMealSelections(meal: Meal) {
  return [
    ...meal.carbs,
    ...meal.proteins,
    ...meal.vegetables,
    ...meal.elaborations,
    ...meal.extras,
  ];
}

export default function MealSlot({
  title,
  meal,
  components,
  onToggle,
  onPeopleChange,
  onAddSelection,
  onRemoveSelection,
}: MealSlotProps) {
  const [showBuilder, setShowBuilder] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState<SelectionCategory | null>(null);

  const openBuilder = (
    category?: SelectionCategory
  ) => {
    setEditingCategory(category ?? null);
    setShowBuilder(true);
  };

  const closeBuilder = () => {
    setShowBuilder(false);
    setEditingCategory(null);
  };

  if (showBuilder) {
    return createPortal(
      <MealBuilder
        title={title}
        meal={meal}
        components={components}
        initialCategory={editingCategory}
        onPeopleChange={onPeopleChange}
        onAddSelection={onAddSelection}
        onRemoveSelection={onRemoveSelection}
        onClose={closeBuilder}
        onToggle={onToggle}
      />,
      document.body
    );
  }

  const hasMeal =
    getMealSelections(meal).length > 0;

  return (
    <div
      className={`meal-slot ${
        !meal.enabled ? "disabled" : ""
      }`}
    >
      <div className="meal-header">
        <button
          className="toggle-button"
          onClick={onToggle}
          aria-label={
            meal.enabled
              ? `Quitar ${title}`
              : `Añadir ${title}`
          }
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
                onClick={() =>
                  onPeopleChange(
                    meal.people + 1
                  )
                }
                aria-label="Añadir una persona"
              >
                ▲
              </button>

              <output>
                {meal.people}
              </output>

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
                aria-label="Quitar una persona"
              >
                ▼
              </button>
            </div>
          </div>
        )}
      </div>

      {meal.enabled && (
        <div className="meal-content">
          {!hasMeal ? (
            <button
              type="button"
              className="add-meal-button"
              onClick={() => openBuilder()}
            >
              <span className="add-meal-icon">
                +
              </span>

              <span>Añadir comida</span>
            </button>
          ) : (
            <div className="meal-summary">
              {(
                [
                  ["carbs", meal.carbs],
                  ["proteins", meal.proteins],
                  [
                    "vegetables",
                    meal.vegetables,
                  ],
                  [
                    "elaborations",
                    meal.elaborations,
                  ],
                  ["extras", meal.extras],
                ] as [
                  SelectionCategory,
                  Selection[]
                ][]
              ).map(
                ([category, selections]) => {
                  if (
                    selections.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <button
                      type="button"
                      className="meal-summary-row"
                      key={category}
                      onClick={() =>
                        openBuilder(category)
                      }
                    >
                      <span className="meal-summary-label">
                        {
                          CATEGORY_LABELS[
                            category
                          ]
                        }
                      </span>

                      <span className="meal-summary-value">
                        {selections
                          .map(
                            (selection) =>
                              getSelectionName(
                                selection,
                                components
                              )
                          )
                          .filter(Boolean)
                          .join(" · ")}
                      </span>

                      <span
                        className="meal-summary-edit"
                        aria-hidden="true"
                      >
                        ›
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}