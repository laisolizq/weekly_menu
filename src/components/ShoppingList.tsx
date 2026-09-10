import { useState } from "react";
import { copyTextToClipboard } from "../services/clipboard";
import type { ShoppingItem } from "../services/shoppingList";
import "./ShoppingList.css";

interface ShoppingListProps {
  items: ShoppingItem[];
}

export default function ShoppingList({
  items,
}: ShoppingListProps) {
  const [copied, setCopied] = useState(false);

  const copyForGoogleKeep = async () => {
    const text = [
      "LISTA DE LA COMPRA",
      "",
      ...items.map(
        (item) =>
          `☐ ${item.name} · ${item.people.join(", ")} personas · ${item.days} días · ${item.total} personas-comida`
      ),
    ].join("\n");

    window.open("https://keep.google.com/", "_blank", "noopener,noreferrer");

    const success = await copyTextToClipboard(text);
    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
      return;
    }

    setCopied(false);
  };

  return (
    <section className="shopping-list">
      <div className="shopping-list-heading">
        <h2>Lista de la compra</h2>
        {items.length > 0 && (
          <button
            type="button"
            className="keep-button"
            onClick={copyForGoogleKeep}
          >
            {copied ? "Copiada para Keep" : "Copiar para Google Keep"}
          </button>
        )}
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