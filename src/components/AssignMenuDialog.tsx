import { useEffect, useRef, useState } from 'react';
import type { DayPlan } from '../types/recipe';
import type { MenuIdea } from '../services/menuIdeas';
import { mealHasSelections } from '../services/weekPlanning';

export default function AssignMenuDialog({ idea, week, onAssign, onClose }: {
  idea: MenuIdea; week: DayPlan[]; onAssign: (slots: number[]) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [slots, setSlots] = useState<number[]>([]);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  const replacements = slots.filter(slot => mealHasSelections(week[Math.floor(slot / 2)][slot % 2 ? 'dinner' : 'lunch'])).length;
  return <dialog ref={dialog} className="assign-dialog" aria-labelledby="assign-title" onCancel={onClose}>
    <header><h2 id="assign-title">¿Para cuándo?</h2><button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar selector">×</button></header>
    <p className="assign-recipe-name">{idea.name}</p>
    <div className="assign-grid" role="group" aria-label="Elegir días y comidas">
      <div className="assign-row assign-heading"><span>Día</span><span>Comida</span><span>Cena</span></div>
      {week.map((day, index) => <div className="assign-row" key={day.day}>
        <strong>{day.day}</strong>
        {(['lunch', 'dinner'] as const).map((type, offset) => {
          const slot = index * 2 + offset;
          const meal = day[type];
          const occupied = mealHasSelections(meal);
          return <button type="button" key={type} disabled={!meal.enabled} aria-pressed={slots.includes(slot)}
            aria-label={`${day.day}, ${type === 'lunch' ? 'comida' : 'cena'}: ${meal.enabled ? `${meal.people} personas${occupied ? ', sustituir menú' : ''}` : 'nadie en casa'}`}
            onClick={() => setSlots(current => current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot])}>
            {meal.enabled ? <>{meal.people} pers.{occupied && <span className="assigned-dot" aria-label="Ya tiene menú"> ·</span>}</> : 'Fuera'}
          </button>;
        })}
      </div>)}
    </div>
    <p className="assign-help">{replacements ? `Se sustituirán ${replacements} ${replacements === 1 ? 'menú' : 'menús'}.` : 'Puedes marcar varios turnos. · Ya tiene menú'}</p>
    <button type="button" className="choose-idea assign-confirm" disabled={!slots.length} onClick={() => onAssign(slots)}>{slots.length ? `Asignar a ${slots.length} ${slots.length === 1 ? 'turno' : 'turnos'}` : 'Elige cuándo'}</button>
  </dialog>;
}
