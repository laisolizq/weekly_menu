import type { ShoppingItem } from "../services/shoppingList";
import "./ShoppingList.css";

interface ShoppingListProps {
  items: ShoppingItem[];
}

export default function ShoppingList({
  items,
}: ShoppingListProps) {
  return (
    <section className="shopping-list">
      <div className="shopping-list-heading">
        <h2>Lista de la compra</h2>
      </div>

      {items.length === 0 ? (
        <p className="empty-list">
          Añade recetas al menú para generar la lista.
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
              {items.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.people.join(", ")}</td>
                  <td>{item.days}</td>
                  <td>{item.total} personas-comida</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}