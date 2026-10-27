import { useState } from "react";
import type { Component } from "../types/recipe";
import "./RecipeManager.css";

interface RecipeManagerProps {
  components: Component[];
  onAddComponent: (component: Component) => Promise<void>;
}

const CATEGORY_OPTIONS: {
  value: Component["category"];
  label: string;
}[] = [
  { value: "CARB", label: "Hidrato" },
  { value: "PROTEIN", label: "Proteína" },
  { value: "VEGETABLE", label: "Verdura" },
  { value: "CONDIMENT", label: "Salsas y condimentos" },
  { value: "ELABORATION", label: "Preparación (no se compra)" },
  { value: "EXTRA", label: "Extra" },
];

function createComponentId(
  name: string,
  components: Component[]
) {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "componente";

  let id = base;
  let suffix = 2;

  while (
    components.some((component) => component.id === id)
  ) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  return id;
}

function downloadComponents(
  components: Component[]
) {
  const blob = new Blob(
    [JSON.stringify(components, null, 2)],
    {
      type: "application/json",
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "components.json";
  link.click();

  URL.revokeObjectURL(url);
}

export default function RecipeManager({
  components,
  onAddComponent,
}: RecipeManagerProps) {
  const [name, setName] = useState("");
  const [category, setCategory] =
    useState<Component["category"]>("CARB");
  const [variantsText, setVariantsText] =
    useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const addComponent = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const cleanName = name.trim();

    const variants = variantsText
      .split("\n")
      .map((variant) => variant.trim())
      .filter(Boolean)
      .map((variant, index) => ({
        id: `${createComponentId(
          cleanName,
          components
        )}-variant-${index + 1}`,
        name: variant,
      }));

    if (!cleanName) {
      setMessage("Escribe un nombre para el componente.");
      return;
    }

    if (components.some(c => c.name.trim().toLocaleLowerCase() === cleanName.toLocaleLowerCase() && c.category === category)) {
      setMessage("Ya existe un componente con ese nombre en esta categoría.");
      return;
    }

    const component: Component = {
      id: createComponentId(
        cleanName,
        components
      ),
      name: cleanName,
      category,
      variants,
    };

    setSaving(true);
    try {
      await onAddComponent(component);
      setName("");
      setVariantsText("");
      setMessage(`${cleanName} añadido. Ya puedes usarlo en tus recetas.`);
    } catch {
      setMessage("No se pudo guardar el componente. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="recipe-manager">
      <div className="recipe-manager-heading">
        <div>
          <span className="section-kicker">
            Catálogo
          </span>

          <h2>Añadir componentes</h2>
        </div>

        <button
          type="button"
          className="button-secondary"
          onClick={() =>
            downloadComponents(components)
          }
        >
          Descargar JSON
        </button>
      </div>

      <p>Ingredientes y salsas: se compran. Preparación: no se compra. Guardado en este navegador.</p>
      <form
        className="recipe-form"
        onSubmit={addComponent}
      >
        <label>
          Nombre del componente

          <input
            required
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Ej. Pollo"
          />
        </label>

        <label>
          Categoría

          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value as Component["category"]
              )
            }
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Variantes (opcional)

          <textarea
            value={variantsText}
            onChange={(event) =>
              setVariantsText(event.target.value)
            }
            placeholder={
              "Una variante por línea\nPechuga\nContramuslo\nAlitas"
            }
            rows={5}
          />
        </label>

        <button
          type="submit"
          className="button-primary"
          disabled={saving}
        >
          {saving ? "Guardando…" : "Añadir componente"}
        </button>
      </form>

      {message && (
        <p className="recipe-form-message" role="status">
          {message}
        </p>
      )}

      <div className="recipe-catalogue">
        <div className="recipe-catalogue-header">
          <h3>Componentes disponibles</h3>
          <span>{components.length}</span>
        </div>

        <label className="catalogue-search">Buscar en el catálogo
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ej. arroz, pollo, pesto…" />
        </label>
        <div className="recipe-catalogue-list">
          {components.filter(c => c.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map((component) => (
            <div
              className="recipe-catalogue-item"
              key={component.id}
            >
              <strong>{component.name}</strong>

              <span>
                {
                  CATEGORY_OPTIONS.find(
                    (option) =>
                      option.value ===
                      component.category
                  )?.label
                }

                {component.variants.length > 0 &&
                  ` · ${component.variants
                    .map(
                      (variant) => variant.name
                    )
                    .join(" · ")}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}