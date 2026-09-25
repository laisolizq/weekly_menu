import type {
  Component,
  Selection,
} from "../types/recipe";
import "./ComponentSelector.css";

type SelectionCategory =
  | "carbs"
  | "proteins"
  | "vegetables"
  | "elaborations"
  | "extras";

interface ComponentSelectorProps {
  components: Component[];
  category: SelectionCategory;
  selected: Selection[];
  onSelect: (selection: Selection) => void;
  onRemoveSelection: (selection: Selection) => void;
  onBack: () => void;
  onClose: () => void;
  title: string;
}

const COMPONENT_CATEGORIES: Record<
  SelectionCategory,
  Component["category"]
> = {
  carbs: "CARB",
  proteins: "PROTEIN",
  vegetables: "VEGETABLE",
  elaborations: "ELABORATION",
  extras: "EXTRA",
};

export default function ComponentSelector({
  components,
  category,
  selected,
  onSelect,
  onRemoveSelection,
  onBack,
  onClose,
  title,
}: ComponentSelectorProps) {
  const categoryComponents = components.filter(
    (component) =>
      component.category ===
      COMPONENT_CATEGORIES[category]
  );

  const isSelected = (
    componentId: string,
    variantId?: string
  ) =>
    selected.some(
      (selection) =>
        selection.componentId === componentId &&
        selection.variantId === variantId
    );

  const handleSelection = (
    selection: Selection
  ) => {
    const selectedState = isSelected(
      selection.componentId,
      selection.variantId
    );

    if (selectedState) {
      onRemoveSelection(selection);
    } else {
      onSelect(selection);
    }
  };

  return (
    <div className="component-selector-screen">
      <div className="component-selector-header">
        <button
          type="button"
          className="component-selector-back"
          onClick={onBack}
        >
          ←
        </button>

        <div>
          <span className="component-selector-kicker">
            Elegir
          </span>

          <h3>{title}</h3>
        </div>
      </div>

      <div className="component-selector-grid">
        {categoryComponents.map((component) => {
          if (component.variants.length === 0) {
            const selectedState = isSelected(
              component.id
            );

            return (
              <button
                type="button"
                className={`component-option ${
                  selectedState ? "selected" : ""
                }`}
                key={component.id}
                onClick={() =>
                  handleSelection({
                    componentId: component.id,
                  })
                }
              >
                <span className="component-option-icon">
                  ✦
                </span>

                <span className="component-option-name">
                  {component.name}
                </span>
              </button>
            );
          }

          return (
            <div
              className="component-with-variants"
              key={component.id}
            >
              <div className="component-parent-name">
                {component.name}
              </div>

              <div className="component-variants">
                {component.variants.map(
                  (variant) => {
                    const selectedState =
                      isSelected(
                        component.id,
                        variant.id
                      );

                    return (
                      <button
                        type="button"
                        className={`component-option ${
                          selectedState
                            ? "selected"
                            : ""
                        }`}
                        key={variant.id}
                        onClick={() =>
                          handleSelection({
                            componentId:
                              component.id,
                            variantId:
                              variant.id,
                          })
                        }
                      >
                        <span className="component-option-icon">
                          ✦
                        </span>

                        <span className="component-option-name">
                          {variant.name}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="component-selector-footer">
        <button
          type="button"
          onClick={onClose}
        >
          Listo
        </button>
      </div>
    </div>
  );
}