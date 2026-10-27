import { Fragment } from "react";
import CopyButton from "./CopyButton";
import type { ShoppingItem } from "../services/shoppingList";
import "./ShoppingList.css";

interface ShoppingListProps {
  items: ShoppingItem[];
  onCopy: () => Promise<void>;
}

const CATEGORY_LABELS: Record<
  ShoppingItem["category"],
  string
> = {
  CARB: "Hidratos",
  PROTEIN: "Proteínas",
  VEGETABLE: "Verduras",
  CONDIMENT: "Salsas y condimentos",
  ELABORATION: "Preparación",
  EXTRA: "Extras",
};

const CATEGORY_ORDER: ShoppingItem["category"][] = [
  "CARB",
  "PROTEIN",
  "VEGETABLE",
  "CONDIMENT",
  "EXTRA",
];

export default function ShoppingList({
  items,
  onCopy,
}: ShoppingListProps) {
  const categories = CATEGORY_ORDER.filter(
    (category) =>
      items.some(
        (item) => item.category === category
      )
  );

  return (
    <section className="shopping-list">
      <div className="shopping-list-heading">
        <h2>Lista de la compra</h2>
        <CopyButton onCopy={onCopy} label="Copiar lista" disabled={!items.length} />
      </div>

      {items.length === 0 ? (
        <p className="empty-list">
          Añade componentes al menú para generar la
          lista.
        </p>
      ) : (
        <div className="shopping-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Personas</th>
                <th>Días</th>
                <th>Raciones</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => {
                const categoryItems = items.filter(
                  (item) =>
                    item.category === category
                );

                return (
                  <Fragment key={category}>
                    <tr
                      key={`${category}-header`}
                      className="shopping-category-row"
                    >
                      <th
                        colSpan={4}
                        scope="colgroup"
                      >
                        {
                          CATEGORY_LABELS[
                            category
                          ]
                        }
                      </th>
                    </tr>

                    {categoryItems.map((item) => (
                      <tr
                        key={`${category}-${item.name}`}
                      >
                        <td>{item.name}</td>

                        <td>
                          {item.people.join(", ")}
                        </td>

                        <td>{item.days}</td>

                        <td>
                          {item.total}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}