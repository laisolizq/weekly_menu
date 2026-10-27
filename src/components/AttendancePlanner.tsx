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
    <span className="section-kicker">Primero, quién está en casa</span>
    <h2>¿Cuántos somos esta semana?</h2>
    <p>Partimos de 2. Cambia solo los turnos distintos: 0 si no está nadie, 1 si come uno y + si hay invitados.</p>
    <button className="header-action" onClick={() => onChange(week.map(day => ({ ...day, lunch: withAttendance(day.lunch, 2), dinner: withAttendance(day.dinner, 2) })))}>Poner 2 en toda la semana</button>
    <div className="attendance-table">
      <div className="attendance-row attendance-heading"><span>Día</span><span>☀️ Comida</span><span>☾ Cena</span></div>
      {week.map((day, index) => <div className="attendance-row" key={day.day}>
        <strong>{day.day}</strong>
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
    <p>Los turnos con 0 se saltan al elegir menús. Puedes volver a cambiar esta tabla cuando quieras.</p>
    <button className="choose-idea" onClick={onDone}>Listo, elegir menús →</button>
  </section>;
}
