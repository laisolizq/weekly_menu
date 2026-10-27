import { useRef, useState } from 'react';
import type { Component, DayPlan, Meal } from '../types/recipe';
import { categoryKeys, emptyMeal, type MenuIdea, type MealType } from '../services/menuIdeas';
import { assignMenuToSlots, nextActiveSlot, nextUnplannedSlot } from '../services/weekPlanning';
import { resolveDiscoveryDeck, snapshotIdea } from '../services/discoveryDeck';
import AssignMenuDialog from './AssignMenuDialog';
import './MenuDiscovery.css';

interface Props {
  week: DayPlan[];
  components: Component[];
  ideas: MenuIdea[];
  onChoose: (day: number, type: MealType, meal: Meal) => void;
  onAssign: (meal: Meal, slots: number[]) => void;
  onFinish: () => void;
}

export default function MenuDiscovery({ week, components, ideas, onChoose, onAssign, onFinish }: Props) {
  const [slot, setSlot] = useState(() => {
    const saved = Number(localStorage.getItem('menu-discovery-slot') || 0);
    const from = Number.isInteger(saved) && saved >= 0 && saved < week.length * 2 ? saved : 0;
    const next = nextUnplannedSlot(week, from);
    return next < 0 ? nextUnplannedSlot(week, 0) : next;
  });
  const [shuffleSeed, setShuffleSeed] = useState(() => Math.floor(Math.random() * 0x100000000));
  const [candidate, setCandidate] = useState(0);
  const [selected, setSelected] = useState<MenuIdea | null>(null);
  const [notice, setNotice] = useState('');
  const [drag, setDrag] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const day = Math.floor(Math.max(0, slot) / 2);
  const type: MealType = slot % 2 ? 'dinner' : 'lunch';
  const [deck, setDeck] = useState(() => resolveDiscoveryDeck(null, ideas, type, shuffleSeed));
  const currentDeck = resolveDiscoveryDeck(deck, ideas, type, shuffleSeed);
  if (currentDeck !== deck) setDeck(currentDeck);
  const options = currentDeck.cards;
  const idea = options[candidate];
  const changeSlot = (next: number) => {
    setSlot(next);
    setCandidate(0);
    setShuffleSeed(seed => (seed + 0x6d2b79f5) >>> 0);
    localStorage.setItem('menu-discovery-slot', String(Math.max(0, next)));
  };
  const advance = (updatedWeek: DayPlan[]) => {
    let next = nextUnplannedSlot(updatedWeek, slot + 1);
    if (next < 0) next = nextUnplannedSlot(updatedWeek, 0);
    changeSlot(next);
    if (next < 0) onFinish();
  };
  const assign = (menu: MenuIdea, targets: number[]) => {
    const meal = { ...menu.meal, recipeId: menu.id, recipeName: menu.name };
    const updated = assignMenuToSlots(week, meal, targets);
    onAssign(meal, [...targets]);
    setSelected(null);
    if (targets.includes(slot)) {
      setNotice('');
      advance(updated);
    } else {
      setNotice(`${menu.name} → ` + targets.map(target => `${week[Math.floor(target / 2)].day} · ${target % 2 ? 'cena' : 'comida'}`).join(' / '));
    }
  };
  const choose = () => { if (idea) assign(idea, [slot]); };
  const skip = () => {
    const meal = { ...emptyMeal(), enabled: false };
    onChoose(day, type, meal);
    advance(week.map((d, index) => index === day ? { ...d, [type]: meal } : d));
  };

  if (slot < 0) return <section className="discovery"><h2>No quedan turnos por elegir</h2><p>Revisa «Mi semana» o cambia «Quién come».</p><button className="choose-idea" onClick={onFinish}>Ver mi semana</button></section>;

  return <section className="discovery" aria-label="Elegir el menú semanal">
    <div className="discovery-top"><span>{week[day].day}</span><span>{slot + 1} / {week.length * 2}</span></div>
    <progress value={slot} max={week.length * 2} aria-label="Posición en la semana" />
    <h2 aria-live="polite">{type === 'lunch' ? 'Comida' : 'Cena'} · {week[day][type].people} {week[day][type].people === 1 ? 'persona' : 'personas'}</h2>
    <div className="discovery-days" aria-label="Ir a un día">{week.map((d, i) => <button key={d.day} disabled={!d.lunch.enabled && !d.dinner.enabled} aria-pressed={day === i} onClick={() => { changeSlot(nextActiveSlot(week, i * 2)); setNotice(''); }}>{d.day.slice(0, 3)}</button>)}</div>
    {idea ? <>
      <article className="idea-card swipe-card" role="button" tabIndex={0} aria-label={`${idea.name}. Elegir día y comida`} style={{ transform: `translateX(${drag}px) rotate(${drag / 22}deg)` }}
        onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } setSelected(snapshotIdea(idea)); }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(snapshotIdea(idea)); } }}
        onPointerDown={e => { if (e.button !== 0) return; suppressClick.current = false; start.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={e => { if (start.current) { const dx = e.clientX - start.current.x; if (Math.abs(dx) > 10 || Math.abs(e.clientY - start.current.y) > 10) suppressClick.current = true; setDrag(Math.max(-140, Math.min(140, dx))); } }}
        onPointerCancel={() => { start.current = null; suppressClick.current = true; setDrag(0); }}
        onPointerUp={e => { const origin = start.current; start.current = null; setDrag(0); if (!origin) return; const dx = e.clientX - origin.x; if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(e.clientY - origin.y)) return; suppressClick.current = true; if (dx > 0) choose(); else setCandidate(candidate + 1); }}>
        <span className="idea-emoji" aria-hidden="true">{type === 'lunch' ? '🥘' : '🥗'}</span>
        <h3>{idea.name}</h3>
        <div className="idea-ingredients">{Object.values(categoryKeys).flatMap(key => idea.meal[key]).map((s, i) => { const c = components.find(c => c.id === s.componentId); return <span key={i}>{c?.name}{s.variantId ? ` · ${c?.variants.find(v => v.id === s.variantId)?.name ?? ''}` : ''}</span>; })}</div>
        <span className="swipe-hint">Toca para elegir otro día</span>
      </article>
      {idea.notes && <details className="idea-notes"><summary>Nota de preparación</summary><p>{idea.notes}</p></details>}
      <div className="discovery-actions"><button onClick={() => setCandidate(candidate + 1)}>← Otra idea</button><button className="choose-idea" onClick={choose}>Elegir →</button></div>
    </> : <div className="idea-card"><h3>{options.length ? 'Has visto todas' : 'No hay recetas para este turno'}</h3>{options.length > 0 ? <button className="choose-idea" onClick={() => { setCandidate(0); setShuffleSeed(seed => (seed + 0x6d2b79f5) >>> 0); }}>Mezclar de nuevo</button> : <p>Añade una en «Mis recetas».</p>}</div>}
    {notice && <p className="assignment-notice" role="status">Guardado: {notice}</p>}
    <div className="discovery-footer"><button className="quiet-action" onClick={skip}>Nadie en casa</button><button className="quiet-action" onClick={onFinish}>Mi semana →</button></div>
    {selected && <AssignMenuDialog idea={selected} week={week} onAssign={assign} onClose={() => setSelected(null)} />}
  </section>;
}
