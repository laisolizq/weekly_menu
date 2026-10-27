import { useMemo, useRef, useState } from 'react';
import type { Component, DayPlan, Meal } from '../types/recipe';
import { categoryKeys, emptyMeal, shuffledIdeas, type MenuIdea, type MealType } from '../services/menuIdeas';
import './MenuDiscovery.css';
import { nextActiveSlot } from '../services/weekPlanning';

interface Props {
  week: DayPlan[];
  attendanceReady: boolean;
  components: Component[];
  ideas: MenuIdea[];
  onChoose: (day: number, type: MealType, meal: Meal) => void;
  onFinish: () => void;
}

export default function MenuDiscovery({ week, attendanceReady, components, ideas, onChoose, onFinish }: Props) {
  const [slot, setSlot] = useState(() => {
    const saved = Number(localStorage.getItem('menu-discovery-slot') || 0);
    const from = Number.isInteger(saved) && saved >= 0 && saved < week.length * 2 ? saved : 0;
    return nextActiveSlot(week, from) < 0 ? nextActiveSlot(week, 0) : nextActiveSlot(week, from);
  });
  const [shuffleSeed, setShuffleSeed] = useState(() => Math.floor(Math.random() * 0x100000000));
  const [candidate, setCandidate] = useState(0);
  const [selected, setSelected] = useState<MenuIdea | null>(null);
  const [people, setPeople] = useState('2');
  const [drag, setDrag] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const day = Math.floor(Math.max(0, slot) / 2);
  const type: MealType = slot % 2 ? 'dinner' : 'lunch';
  const options = useMemo(() => shuffledIdeas(ideas, type, shuffleSeed), [ideas, type, shuffleSeed]);
  const idea = options[candidate];
  const title = `${type === 'lunch' ? 'Comida' : 'Cena'} del ${week[day].day.toLowerCase()}`;
  const advance = (meal: Meal) => {
    onChoose(day, type, meal);
    setSelected(null);
    setCandidate(0);
    setShuffleSeed(Math.floor(Math.random() * 0x100000000));
    const next = nextActiveSlot(week, slot + 1);
    localStorage.setItem('menu-discovery-slot', String(Math.max(0, next)));
    if (next < 0) onFinish();
    else setSlot(next);
  };
  const choose = () => {
    if (!idea) return;
    if (attendanceReady) { advance({ ...idea.meal, enabled: true, people: week[day][type].people }); return; }
    setPeople(String(week[day][type].people));
    setSelected(idea);
  };

  if (slot < 0) return <section className="discovery"><h2>Esta semana coméis fuera</h2><p>No hay turnos en casa. Puedes cambiarlo en «Quién come».</p><button className="choose-idea" onClick={onFinish}>Ver mi semana</button></section>;

  return <section className="discovery" aria-label="Elegir el menú semanal">
    <div className="discovery-top"><span className="section-kicker">Una semana a tu gusto</span><span>{slot + 1} / {week.length * 2}</span></div>
    <progress value={slot} max={week.length * 2} aria-label="Turnos completados" />
    <h2 aria-live="polite">{title}</h2>
    <p>Descarta hacia la izquierda. Elige hacia la derecha.</p>
    {attendanceReady && <p>{week[day][type].people} {week[day][type].people === 1 ? 'persona en casa' : 'personas en casa'} · Cambiar en «Quién come»</p>}
    <div className="discovery-days" aria-label="Ir a un día">{week.map((d, i) => <button key={d.day} disabled={!d.lunch.enabled && !d.dinner.enabled} aria-pressed={day === i} onClick={() => { setSlot(nextActiveSlot(week, i * 2)); setShuffleSeed(Math.floor(Math.random() * 0x100000000)); setCandidate(0); setSelected(null); localStorage.setItem('menu-discovery-slot', String(nextActiveSlot(week, i * 2))); }}>{d.day.slice(0, 3)}</button>)}</div>
    {selected ? <form className="idea-card people-question" onSubmit={event => { event.preventDefault(); const count = Number(people); if (Number.isInteger(count) && count > 0) advance({ ...selected.meal, enabled: true, people: count }); }}>
      <span className="idea-emoji" aria-hidden="true">🍽️</span><h3>{selected.name}</h3>
      <label htmlFor="discovery-people">¿Cuántas personas para esta {type === 'lunch' ? 'comida' : 'cena'}?</label>
      <input autoFocus id="discovery-people" type="number" min="1" step="1" required value={people} onChange={e => setPeople(e.target.value)} />
      <button className="choose-idea" type="submit">Guardar y continuar →</button>
      <button type="button" className="quiet-action" onClick={() => setSelected(null)}>Volver a las propuestas</button>
    </form> : idea ? <>
      <article className="idea-card swipe-card" style={{ transform: `translateX(${drag}px) rotate(${drag / 22}deg)` }}
        onPointerDown={e => { if (e.button !== 0) return; start.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={e => { if (start.current) setDrag(Math.max(-140, Math.min(140, e.clientX - start.current.x))); }}
        onPointerCancel={() => { start.current = null; setDrag(0); }}
        onPointerUp={e => { const origin = start.current; start.current = null; setDrag(0); if (!origin) return; const dx = e.clientX - origin.x; if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(e.clientY - origin.y)) return; if (dx > 0) choose(); else setCandidate(candidate + 1); }}>
        <span className="idea-tag">{type === 'lunch' ? '☀️ Comida' : '☾ Cena'} · Idea {candidate + 1} de {options.length}</span>
        <span className="idea-emoji" aria-hidden="true">{type === 'lunch' ? '🥘' : '🥗'}</span>
        <h3>{idea.name}</h3>
        {idea.notes && <p className="recipe-tip">{idea.notes}</p>}
        <div className="idea-ingredients">{Object.values(categoryKeys).flatMap(key => idea.meal[key]).map((s, i) => { const c = components.find(c => c.id === s.componentId); return <span key={i}>{c?.name}{s.variantId ? ` · ${c?.variants.find(v => v.id === s.variantId)?.name ?? ''}` : ''}</span>; })}</div>
        <span className="swipe-hint">← Otra idea <span>Me apetece →</span></span>
      </article>
      <div className="discovery-actions"><button onClick={() => setCandidate(candidate + 1)}>✕ Otra idea</button><button className="choose-idea" onClick={choose}>♡ Me apetece</button></div>
    </> : <div className="idea-card"><h3>{options.length ? 'Has visto todas las ideas' : 'Todavía no hay propuestas'}</h3><p>{options.length ? 'Puedes volver a verlas o añadir una receta al catálogo.' : 'Añade recetas para este turno en «Mis recetas».'}</p>{options.length > 0 && <button className="choose-idea" onClick={() => { setCandidate(0); setShuffleSeed(Math.floor(Math.random() * 0x100000000)); }}>Volver a ver las ideas</button>}</div>}
    {!selected && <button className="quiet-action" onClick={() => advance({ ...emptyMeal(), enabled: false })}>× Nadie {type === 'lunch' ? 'come' : 'cena'} en casa</button>}
    <button className="quiet-action" onClick={onFinish}>Ver y editar mi semana</button>
    <p className="discovery-note">Cada elección se guarda. Puedes cambiarla después.</p>
  </section>;
}
