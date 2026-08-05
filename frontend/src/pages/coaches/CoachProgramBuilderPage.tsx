import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { createDay, createProgramExercise, deleteDay, deleteProgramExercise, getProgram, listCoachExercises, reorderDays, reorderProgramExercises, updateProgram, updateProgramExercise } from '../../services/coachWorkspaceApi';
import type { CoachExercise, CoachProgram, CoachProgramDay, CoachProgramExercise } from '../../types/coachWorkspace';
import { CoachPage, ConfirmDialog, ErrorState, inputClass, LoadingState } from './CoachCommon';

type ExerciseDraftField = 'target_sets' | 'target_reps_min' | 'target_reps_max' | 'target_weight' | 'target_duration_seconds' | 'rest_seconds' | 'tempo' | 'coach_note';

const payloadFor = (item: CoachProgramExercise) => ({
  targetSets: item.target_sets,
  targetRepsMin: item.target_reps_min,
  targetRepsMax: item.target_reps_max,
  targetWeight: item.target_weight,
  targetDurationSeconds: item.target_duration_seconds,
  restSeconds: item.rest_seconds,
  tempo: item.tempo,
  coachNote: item.coach_note,
});

const nullableNumber = (value: string) => value === '' ? null : Number(value);

export default function CoachProgramBuilderPage() {
  const { programId } = useParams();
  const [program, setProgram] = useState<CoachProgram | null>(null);
  const [exercises, setExercises] = useState<CoachExercise[]>([]);
  const [error, setError] = useState('');
  const [newDay, setNewDay] = useState({ weekNumber: 1, dayNumber: 1, title: '', description: '' });
  const [picker, setPicker] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'day' | 'exercise'; id: number } | null>(null);
  const [dirtyExercises, setDirtyExercises] = useState<Record<number, boolean>>({});
  const [savedExercises, setSavedExercises] = useState<Record<number, boolean>>({});
  const [savingExerciseId, setSavingExerciseId] = useState<number | null>(null);
  const revisions = useRef<Record<number, number>>({});

  const load = () => {
    if (!programId) return;
    setError('');
    Promise.all([getProgram(Number(programId)), listCoachExercises({ page: 1, limit: 50, sort: 'name_asc' })])
      .then(([value, exerciseList]) => {
        setProgram(value);
        setExercises(exerciseList.items);
        setDirtyExercises({});
        setSavedExercises({});
      })
      .catch(() => setError('Unable to load Program or Exercise catalog.'));
  };
  useEffect(() => { load(); }, [programId]);

  if (!program) return <CoachPage title="Program Builder" description="Manage Days and Exercises owned by the current Coach.">{error ? <ErrorState message={error} retry={load} /> : <LoadingState />}</CoachPage>;

  const days = program.days ?? [];
  const setDays = (nextDays: CoachProgramDay[]) => setProgram(current => current ? { ...current, days: nextDays } : current);

  const addDay = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const day = await createDay(program.id, newDay);
      setDays([...days, { ...day, exercises: [] }]);
      setNewDay({ weekNumber: newDay.weekNumber, dayNumber: Math.min(newDay.dayNumber + 1, 7), title: '', description: '' });
    } catch { setError('Unable to add Day. Week/day must be unique in the Program.'); }
  };

  const addExercise = async (dayId: number, exercise: CoachExercise) => {
    setError('');
    try {
      const item = await createProgramExercise(dayId, { exerciseId: exercise.id, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 60 });
      setDays(days.map(day => day.id === dayId ? { ...day, exercises: [...day.exercises, item] } : day));
      setPicker(null);
    } catch { setError('Exercise must be active and have a reps or duration target.'); }
  };

  const moveDay = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= days.length) return;
    const next = [...days];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    try { await reorderDays(program.id, next.map(day => day.id)); setDays(next); }
    catch { setError('Unable to reorder Day.'); }
  };

  const moveExercise = async (day: CoachProgramDay, index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= day.exercises.length) return;
    const nextExercises = [...day.exercises];
    [nextExercises[index], nextExercises[nextIndex]] = [nextExercises[nextIndex], nextExercises[index]];
    try { await reorderProgramExercises(day.id, nextExercises.map(item => item.id)); setDays(days.map(row => row.id === day.id ? { ...row, exercises: nextExercises } : row)); }
    catch { setError('Unable to reorder Exercise.'); }
  };

  const remove = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === 'day') {
        await deleteDay(confirm.id);
        setDays(days.filter(day => day.id !== confirm.id));
      } else {
        await deleteProgramExercise(confirm.id);
        setDays(days.map(day => ({ ...day, exercises: day.exercises.filter(item => item.id !== confirm.id) })));
        setDirtyExercises(current => { const next = { ...current }; delete next[confirm.id]; return next; });
      }
      setConfirm(null);
    } catch { setError('Unable to delete an item that may be referenced by a Schedule.'); }
  };

  const updateExerciseDraft = (item: CoachProgramExercise, field: ExerciseDraftField, value: number | string | null) => {
    const next = { ...item, [field]: value } as CoachProgramExercise;
    setProgram(current => current ? { ...current, days: (current.days ?? []).map(day => ({ ...day, exercises: day.exercises.map(row => row.id === item.id ? next : row) })) } : current);
    revisions.current[item.id] = (revisions.current[item.id] ?? 0) + 1;
    setDirtyExercises(current => ({ ...current, [item.id]: true }));
    setSavedExercises(current => ({ ...current, [item.id]: false }));
  };

  const saveExercise = async (item: CoachProgramExercise) => {
    if (item.target_reps_min === null && item.target_reps_max === null && item.target_duration_seconds === null) {
      setError('Each Exercise needs a reps or duration target before saving.');
      return;
    }
    if (item.target_reps_min !== null && item.target_reps_max !== null && item.target_reps_min > item.target_reps_max) {
      setError('Reps min cannot be greater than reps max.');
      return;
    }
    setError('');
    const revision = revisions.current[item.id] ?? 0;
    setSavingExerciseId(item.id);
    try {
      await updateProgramExercise(item.id, payloadFor(item));
      if (revisions.current[item.id] === revision) {
        setDirtyExercises(current => ({ ...current, [item.id]: false }));
        setSavedExercises(current => ({ ...current, [item.id]: true }));
      }
    } catch { setError('Unable to save targets. Reps or duration is required.'); }
    finally { setSavingExerciseId(null); }
  };

  const saveDetails = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const saved = await updateProgram(program.id, { name: program.name, description: program.description || '', goal: program.goal, difficulty: program.difficulty, durationWeeks: program.duration_weeks, daysPerWeek: program.days_per_week });
      setProgram(current => current ? { ...current, ...saved } : current);
    } catch { setError('Unable to save Program details.'); }
  };

  return <CoachPage title={program.name} description="Program Builder · edit only the current Coach-owned Program." backTo="/coach/workout-programs">
    <div className="mb-6 flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs ${program.is_active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>{program.is_active ? 'ACTIVE' : 'INACTIVE'}</span><span className="text-sm text-slate-400">{program.goal} · {program.duration_weeks} weeks · {program.days_per_week} days/week</span></div>
    {error && <ErrorState message={error} />}
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <section className="space-y-4">
        <div className="dashboard-panel"><h2 className="text-lg font-semibold text-white">Program Days</h2><form onSubmit={addDay} className="mt-4 grid gap-2 md:grid-cols-[80px_80px_1fr_auto]"><input className={inputClass} type="number" min={1} max={104} value={newDay.weekNumber} onChange={event => setNewDay({ ...newDay, weekNumber: Number(event.target.value) })} aria-label="Week number"/><input className={inputClass} type="number" min={1} max={7} value={newDay.dayNumber} onChange={event => setNewDay({ ...newDay, dayNumber: Number(event.target.value) })} aria-label="Day number"/><input required className={inputClass} value={newDay.title} onChange={event => setNewDay({ ...newDay, title: event.target.value })} placeholder="Day title"/><button className="primary-button inline-flex items-center justify-center gap-1"><Plus size={16}/> Add Day</button></form></div>
        {days.map((day, dayIndex) => <article key={day.id} className="dashboard-panel"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-emerald-400">W{day.week_number} · D{day.day_number}</p><h3 className="mt-1 text-lg font-semibold text-white">{day.title}</h3><p className="text-sm text-slate-500">{day.exercises.length} exercise(s)</p></div><div className="flex gap-1"><button type="button" className="icon-button" aria-label={`Move ${day.title} up`} disabled={dayIndex === 0} onClick={() => void moveDay(dayIndex, -1)}><ArrowUp size={15}/></button><button type="button" className="icon-button" aria-label={`Move ${day.title} down`} disabled={dayIndex === days.length - 1} onClick={() => void moveDay(dayIndex, 1)}><ArrowDown size={15}/></button><button type="button" className="icon-button" aria-label={`Delete ${day.title}`} onClick={() => setConfirm({ kind: 'day', id: day.id })}><Trash2 size={16}/></button></div></div>
          <div className="mt-4 space-y-2">{day.exercises.map((item, exerciseIndex) => <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3"><div className="flex items-center gap-2"><GripVertical size={15} className="text-slate-600"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{item.exercise_name}</p><p className="text-xs text-slate-500">{item.muscle_group || '—'} · {item.difficulty || '—'}</p></div><button type="button" className="icon-button" aria-label={`Move ${item.exercise_name} up`} disabled={exerciseIndex === 0} onClick={() => void moveExercise(day, exerciseIndex, -1)}><ArrowUp size={13}/></button><button type="button" className="icon-button" aria-label={`Move ${item.exercise_name} down`} disabled={exerciseIndex === day.exercises.length - 1} onClick={() => void moveExercise(day, exerciseIndex, 1)}><ArrowDown size={13}/></button><button type="button" className="icon-button" aria-label={`Delete ${item.exercise_name}`} onClick={() => setConfirm({ kind: 'exercise', id: item.id })}><Trash2 size={14}/></button></div>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4"><label className="text-xs text-slate-500">Sets<input className={`${inputClass} mt-1`} type="number" min={1} max={50} value={item.target_sets ?? ''} onChange={event => updateExerciseDraft(item, 'target_sets', nullableNumber(event.target.value))}/></label><label className="text-xs text-slate-500">Reps min<input className={`${inputClass} mt-1`} type="number" min={1} max={1000} value={item.target_reps_min ?? ''} onChange={event => updateExerciseDraft(item, 'target_reps_min', nullableNumber(event.target.value))}/></label><label className="text-xs text-slate-500">Reps max<input className={`${inputClass} mt-1`} type="number" min={1} max={1000} value={item.target_reps_max ?? ''} onChange={event => updateExerciseDraft(item, 'target_reps_max', nullableNumber(event.target.value))}/></label><label className="text-xs text-slate-500">Rest (s)<input className={`${inputClass} mt-1`} type="number" min={0} max={3600} value={item.rest_seconds ?? ''} onChange={event => updateExerciseDraft(item, 'rest_seconds', nullableNumber(event.target.value))}/></label></div>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3"><label className="text-xs text-slate-500">Weight (kg)<input className={`${inputClass} mt-1`} type="number" min={0} step="0.01" value={item.target_weight ?? ''} onChange={event => updateExerciseDraft(item, 'target_weight', nullableNumber(event.target.value))}/></label><label className="text-xs text-slate-500">Duration (s)<input className={`${inputClass} mt-1`} type="number" min={1} max={86400} value={item.target_duration_seconds ?? ''} onChange={event => updateExerciseDraft(item, 'target_duration_seconds', nullableNumber(event.target.value))}/></label><label className="text-xs text-slate-500">Tempo<input className={`${inputClass} mt-1`} maxLength={40} value={item.tempo ?? ''} onChange={event => updateExerciseDraft(item, 'tempo', event.target.value || null)}/></label></div>
            <label className="mt-2 block text-xs text-slate-500">Coach note<input className={`${inputClass} mt-1`} maxLength={2000} value={item.coach_note ?? ''} onChange={event => updateExerciseDraft(item, 'coach_note', event.target.value || null)}/></label>
            <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" className="secondary-button" disabled={savingExerciseId !== null} onClick={() => void saveExercise(item)}>{savingExerciseId === item.id ? 'Saving…' : dirtyExercises[item.id] ? 'Save targets' : savedExercises[item.id] ? 'Saved' : 'No changes'}</button>{dirtyExercises[item.id] && <span className="text-xs text-amber-200">Unsaved changes</span>}{savedExercises[item.id] && !dirtyExercises[item.id] && <span className="text-xs text-emerald-300">Saved</span>}</div>
          </div>)}</div><button type="button" className="secondary-button mt-4" onClick={() => setPicker(day.id)}>Add Exercise</button></article>)}
      </section>
      <aside className="dashboard-panel h-fit"><h2 className="text-lg font-semibold text-white">Program details</h2><form onSubmit={saveDetails} className="mt-4 space-y-3"><label className="block text-xs text-slate-500">Name<input className={`${inputClass} mt-1`} value={program.name} onChange={event => setProgram({ ...program, name: event.target.value })}/></label><label className="block text-xs text-slate-500">Description<textarea className={`${inputClass} mt-1 min-h-20`} value={program.description || ''} onChange={event => setProgram({ ...program, description: event.target.value })}/></label><div className="grid grid-cols-2 gap-2"><label className="text-xs text-slate-500">Goal<select className={`${inputClass} mt-1`} value={program.goal} onChange={event => setProgram({ ...program, goal: event.target.value })}>{['GENERAL_FITNESS','WEIGHT_LOSS','MUSCLE_GAIN','STRENGTH','ENDURANCE','MOBILITY'].map(value => <option key={value}>{value}</option>)}</select></label><label className="text-xs text-slate-500">Difficulty<select className={`${inputClass} mt-1`} value={program.difficulty} onChange={event => setProgram({ ...program, difficulty: event.target.value })}>{['BEGINNER','INTERMEDIATE','ADVANCED'].map(value => <option key={value}>{value}</option>)}</select></label></div><div className="grid grid-cols-2 gap-2"><label className="text-xs text-slate-500">Weeks<input className={`${inputClass} mt-1`} type="number" min={1} max={104} value={program.duration_weeks} onChange={event => setProgram({ ...program, duration_weeks: Number(event.target.value) })}/></label><label className="text-xs text-slate-500">Days/week<input className={`${inputClass} mt-1`} type="number" min={1} max={7} value={program.days_per_week} onChange={event => setProgram({ ...program, days_per_week: Number(event.target.value) })}/></label></div><button className="primary-button w-full" type="submit">Save details</button></form><h2 className="mt-8 text-lg font-semibold text-white">Preview</h2><div className="mt-4 space-y-2">{days.map(day => <div key={day.id} className="rounded-lg border border-slate-800 p-3"><p className="text-sm font-medium text-white">{day.title}</p><p className="text-xs text-slate-500">{day.exercises.map(item => item.exercise_name).join(' · ') || 'No exercises'}</p></div>)}</div><p className="mt-6 text-xs text-slate-500">Exercise edits stay local until Save targets. Server-side validation remains authoritative.</p></aside>
    </div>
    {picker !== null && <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true"><button className="absolute inset-0 bg-black/70" aria-label="Close Exercise picker" onClick={() => setPicker(null)}/><div className="relative max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5"><h2 className="text-lg font-semibold text-white">Choose active Exercise</h2><div className="mt-4 space-y-2">{exercises.filter(exercise => !days.find(day => day.id === picker)?.exercises.some(item => item.exercise_id === exercise.id)).map(exercise => <button type="button" key={exercise.id} className="flex w-full items-center justify-between rounded-xl border border-slate-800 p-3 text-left hover:border-emerald-400" onClick={() => void addExercise(picker, exercise)}><span><strong className="block text-sm text-white">{exercise.name}</strong><small className="text-xs text-slate-500">{exercise.muscle_group || '—'} · {exercise.difficulty || '—'}</small></span><Plus size={16} className="text-emerald-400"/></button>)}</div></div></div>}
    {confirm && <ConfirmDialog title="Delete from Program?" description="This does not delete the global Exercise. A referenced Day remains protected by the backend." onCancel={() => setConfirm(null)} onConfirm={() => void remove()}/>}</CoachPage>;
}
