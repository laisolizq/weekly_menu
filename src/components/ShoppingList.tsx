import type { ShoppingItem } from "../services/shoppingList";
import "./ShoppingList.css";

interface ShoppingListProps {
  items: ShoppingItem[];
}

const CATEGORY_LABELS: Record<
  ShoppingItem["category"],
  string
> = {
  CARB: "Hidratos",
  PROTEIN: "Proteínas",
  VEGETABLE: "Verduras",
  ELABORATION: "Elaboración",
  EXTRA: "Extras",
};

const CATEGORY_ORDER: ShoppingItem["category"][] = [
  "CARB",
  "PROTEIN",
  "VEGETABLE",
  "ELABORATION",
  "EXTRA",
];

export default function ShoppingList({
  items,
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
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => {
                const categoryItems = items.filter(
                  (item) =>
                    item.category === category
                );

                return (
                  <>
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
                          {item.total} personas-comida
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}