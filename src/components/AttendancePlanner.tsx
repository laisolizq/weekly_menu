import type { DayPlan } from '../types/recipe';
import { withAttendance } from '../services/weekPlanning';
import type { MealType } from '../services/menuIdeas';
import './AttendancePlanner.css';

export default function AttendancePlanner({ week, onChange, onDone }: {
  week: DayPlan[]; onChange: (week: DayPlan[]) => void; onDone: () => void;
}) {
  const update = (index: number, type: MealType, people: number) => {
    onChange(week.map((day, i) => i === index ? { ...day, [type]: withAttendance(day[type], people) } : day));
  };
  return <section className="attendance-planner">

    <h2>Quién come en casa</h2>
    <p>0 · Fuera    1–2 · Personas    + · Invitados</p>
    <button className="header-action" onClick={() => onChange(week.map(day => ({ ...day, lunch: withAttendance(day.lunch, 2), dinner: withAttendance(day.dinner, 2) })))}>2 toda la semana</button>
    <div className="attendance-table">
      <div className="attendance-row attendance-heading"><span>Día</span><span>☀️ Comida</span><span>☾ Cena</span></div>
      {week.map((day, index) => <div className="attendance-row" key={day.day}>
        <strong title={day.day} aria-label={day.day}>{day.day.slice(0, 3)}</strong>
        {(['lunch', 'dinner'] as const).map(type => {
          const count = day[type].enabled ? day[type].people : 0;
          const label = `${type === 'lunch' ? 'Comida' : 'Cena'} del ${day.day.toLowerCase()}`;
          return <div className="attendance-cell" key={type} role="group" aria-label={label}>
            <div className="attendance-options">{[0, 1, 2].map(n => <button key={n} aria-label={`${label}: ${n} personas`} aria-pressed={count === n} onClick={() => update(index, type, n)}>{n}</button>)}<button aria-label={`${label}: añadir invitado`} onClick={() => update(index, type, Math.max(3, count + 1))}>+</button></div>
            {count > 2 && <div className="attendance-guests"><button aria-label={`${label}: quitar persona`} onClick={() => update(index, type, count - 1)}>−</button><output aria-label={`${label}: total`}>{count} personas</output></div>}
          </div>;
        })}
      </div>)}
    </div>

    <button className="choose-idea" onClick={onDone}>Elegir menús →</button>
  </section>;
}
