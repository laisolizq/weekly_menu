import { downloadRecipeCatalog } from '../services/recipeCatalog';
import { useState } from 'react';
import type { Component, Selection } from '../types/recipe';
import { categoryKeys, emptyMeal, type MenuIdea, type MealType } from '../services/menuIdeas';
import './RecipeManager.css';
import './ComponentSelector.css';

const categories = [
  ['CARB', '🍚', 'Hidratos'], ['PROTEIN', '🥚', 'Proteínas'], ['VEGETABLE', '🥦', 'Verduras'],
  ['CONDIMENT', '🧂', 'Salsas y condimentos'], ['ELABORATION', '🍳', 'Preparación'], ['EXTRA', '✦', 'Extras'],
] as const;

export default function MenuRecipes({ components, recipes, personalRecipeIds, onSave, onDelete }: {
  components: Component[]; recipes: MenuIdea[]; personalRecipeIds: string[]; onSave: (recipe: MenuIdea) => void; onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [types, setTypes] = useState<MealType[]>(['lunch', 'dinner']);
  const [meal, setMeal] = useState(emptyMeal);
  const [category, setCategory] = useState<Component['category']>('CARB');
  const [message, setMessage] = useState('');
  const selections = Object.values(categoryKeys).flatMap(key => meal[key]);
  const toggle = (selection: Selection) => {
    const key = categoryKeys[category];
    const exists = meal[key].some(s => s.componentId === selection.componentId && s.variantId === selection.variantId);
    setMeal({ ...meal, [key]: exists ? meal[key].filter(s => s.componentId !== selection.componentId || s.variantId !== selection.variantId) : [...meal[key], selection] });
  };
  const option = (component: Component, variant?: Component['variants'][number]) => {
    const selected = selections.some(s => s.componentId === component.id && s.variantId === variant?.id);
    return <button type="button" key={variant?.id ?? component.id} className={`component-option ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => toggle({ componentId: component.id, ...(variant ? { variantId: variant.id } : {}) })}>
      <span className="component-option-name">{variant?.name ?? component.name}</span>
    </button>;
  };
  return <section className="recipe-manager">
    <div className="recipe-manager-heading">
      <div><span className="section-kicker">Tu catálogo</span><h2>Mis recetas</h2></div>
      <button className="button-secondary" onClick={() => downloadRecipeCatalog(recipes, components)}>Descargar recetas JSON</button>
    </div>
    <p className="recipe-export-note">La descarga incluye tus recetas guardadas y todos los componentes, también los nuevos, para llevarlos al ordenador.</p>
    <p>Monta tu receta por categorías. Puedes elegir varios componentes y dejar categorías vacías.</p>
    <form className="recipe-form" onSubmit={e => {
      e.preventDefault();
      if (!name.trim() || !types.length || !selections.length) { setMessage('Añade un nombre, al menos un turno y un componente.'); return; }
      onSave({ id: crypto.randomUUID(), name: name.trim(), mealTypes: types, meal });
      setName(''); setMeal(emptyMeal()); setCategory('CARB'); setMessage('Receta guardada. Ya puede aparecer en tus propuestas.');
    }}>
      <label>Nombre de la receta<input required value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Mi ensalada de garbanzos" /></label>
      <fieldset><legend>¿Cuándo te apetece?</legend>{(['lunch', 'dinner'] as const).map(t => <label key={t}><input type="checkbox" checked={types.includes(t)} onChange={e => setTypes(e.target.checked ? [...types, t] : types.filter(v => v !== t))} />{t === 'lunch' ? 'Comida' : 'Cena'}</label>)}</fieldset>
      <div className="recipe-categories" role="group" aria-label="Categorías de la receta">{categories.map(([key, icon, label]) => <button type="button" key={key} aria-pressed={category === key} onClick={() => setCategory(key)}><span aria-hidden="true">{icon}</span> {label} <small>{meal[categoryKeys[key]].length || ''}</small></button>)}</div>
      <div key={category} className="recipe-components" role="group" aria-label={categories.find(c => c[0] === category)?.[2]}>
        {components.filter(c => c.category === category).map(c => c.variants.length ? <div className="component-with-variants" key={c.id}><div className="component-parent-name">{c.name}</div><div className="component-variants">{option(c)}{c.variants.map(v => option(c, v))}</div></div> : option(c))}
      </div>
      <div className="recipe-selection"><strong>Tu combinación</strong>{selections.length ? <div className="idea-ingredients">{selections.map(s => {
        const c = components.find(c => c.id === s.componentId);
        return <span key={`${s.componentId}-${s.variantId ?? ''}`}>{c?.name}{s.variantId ? ` · ${c?.variants.find(v => v.id === s.variantId)?.name}` : ''}</span>;
      })}</div> : <p>Elige tarjetas para empezar.</p>}</div>
      <button className="add-recipe-button" type="submit">Guardar receta</button>
    </form>
    <p role="status">{message}</p>
    <div className="recipe-catalogue-list">{recipes.map(r => <div className="recipe-catalogue-item" key={r.id}><strong>{r.name}</strong>{r.notes && <p className="recipe-tip">{r.notes}</p>}<span>{r.mealTypes.map(t => t === 'lunch' ? 'Comida' : 'Cena').join(' · ')}</span>{personalRecipeIds.includes(r.id) ? <button className="quiet-action" onClick={() => onDelete(r.id)}>Eliminar receta</button> : <span>Catálogo compartido</span>}</div>)}</div>
  </section>;
}
