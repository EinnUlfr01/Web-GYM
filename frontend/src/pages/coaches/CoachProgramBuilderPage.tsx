import { FormEvent, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { createDay, createProgramExercise, deleteDay, deleteProgramExercise, getProgram, listCoachExercises, reorderDays, reorderProgramExercises, updateProgram, updateProgramExercise } from '../../services/coachWorkspaceApi';
import type { CoachExercise, CoachProgram, CoachProgramDay, CoachProgramExercise } from '../../types/coachWorkspace';
import { CoachPage, ConfirmDialog, ErrorState, inputClass, LoadingState } from './CoachCommon';

export default function CoachProgramBuilderPage() {
  const { programId } = useParams();
  const [program, setProgram] = useState<CoachProgram | null>(null);
  const [exercises, setExercises] = useState<CoachExercise[]>([]);
  const [error, setError] = useState('');
  const [newDay, setNewDay] = useState({ weekNumber: 1, dayNumber: 1, title: '', description: '' });
  const [picker, setPicker] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'day' | 'exercise'; id: number } | null>(null);

  const load = () => {
    if (!programId) return;
    Promise.all([getProgram(Number(programId)), listCoachExercises({ page: 1, limit: 50, sort: 'name_asc' })])
      .then(([value, exerciseList]) => { setProgram(value); setExercises(exerciseList.items); })
      .catch(() => setError('Không thể tải Program hoặc Exercise.'));
  };
  useEffect(load, [programId]);

  if (!program) return <CoachPage title="Program Builder" description="Quản lý Day và Exercise của Program thuộc Coach.">{error ? <ErrorState message={error} retry={load} /> : <LoadingState />}</CoachPage>;
  const days = program.days || [];
  const setDays = (nextDays: CoachProgramDay[]) => setProgram({ ...program, days: nextDays });

  const addDay = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const day = await createDay(program.id, newDay);
      setDays([...days, { ...day, exercises: [] }]);
      setNewDay({ weekNumber: newDay.weekNumber, dayNumber: newDay.dayNumber + 1, title: '', description: '' });
    } catch { setError('Không thể thêm Day. Week/day phải unique trong Program.'); }
  };
  const addExercise = async (dayId: number, exercise: CoachExercise) => {
    try {
      const item = await createProgramExercise(dayId, { exerciseId: exercise.id, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 60 });
      setDays(days.map(day => day.id === dayId ? { ...day, exercises: [...day.exercises, item] } : day)); setPicker(null);
    } catch { setError('Exercise phải active và có reps hoặc duration target.'); }
  };
  const moveDay = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= days.length) return;
    const next = [...days]; [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    try { await reorderDays(program.id, next.map(day => day.id)); setDays(next); } catch { setError('Không thể reorder Day.'); }
  };
  const moveExercise = async (day: CoachProgramDay, index: number, direction: -1 | 1) => {
    const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= day.exercises.length) return;
    const nextExercises = [...day.exercises]; [nextExercises[index], nextExercises[nextIndex]] = [nextExercises[nextIndex], nextExercises[index]];
    try { await reorderProgramExercises(day.id, nextExercises.map(item => item.id)); setDays(days.map(row => row.id === day.id ? { ...row, exercises: nextExercises } : row)); } catch { setError('Không thể reorder Exercise.'); }
  };
  const remove = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === 'day') { await deleteDay(confirm.id); setDays(days.filter(day => day.id !== confirm.id)); }
      else { await deleteProgramExercise(confirm.id); setDays(days.map(day => ({ ...day, exercises: day.exercises.filter(item => item.id !== confirm.id) }))); }
      setConfirm(null);
    } catch { setError('Không thể xóa mục đang được tham chiếu.'); }
  };
  const updateExercise = async (item: CoachProgramExercise, field: string, value: number | string | null) => {
    const next = { ...item, [field]: value } as CoachProgramExercise;
    try {
      await updateProgramExercise(item.id, { targetSets: next.target_sets, targetRepsMin: next.target_reps_min, targetRepsMax: next.target_reps_max, targetWeight: next.target_weight, targetDurationSeconds: next.target_duration_seconds, restSeconds: next.rest_seconds, tempo: next.tempo, coachNote: next.coach_note });
      setDays(days.map(day => ({ ...day, exercises: day.exercises.map(row => row.id === item.id ? next : row) })));
    } catch { setError('Không thể cập nhật target. Cần reps hoặc duration.'); }
  };
  const saveDetails = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const saved = await updateProgram(program.id, { name: program.name, description: program.description || '', goal: program.goal, difficulty: program.difficulty, durationWeeks: program.duration_weeks, daysPerWeek: program.days_per_week });
      setProgram({ ...program, ...saved });
    } catch { setError('Không thể lưu thông tin Program.'); }
  };

  return <CoachPage title={program.name} description="Program Builder · chỉ sửa Program thuộc Coach hiện tại." backTo="/coach/workout-programs">
    <div className="mb-6 flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs ${program.is_active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>{program.is_active ? 'ACTIVE' : 'INACTIVE'}</span><span className="text-sm text-slate-400">{program.goal} · {program.duration_weeks} tuần · {program.days_per_week} ngày/tuần</span></div>
    {error && <ErrorState message={error} />}
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]"><section className="space-y-4"><div className="dashboard-panel"><h2 className="text-lg font-semibold text-white">Program Days</h2><form onSubmit={addDay} className="mt-4 grid gap-2 md:grid-cols-[80px_80px_1fr_auto]"><input className={inputClass} type="number" min={1} max={104} value={newDay.weekNumber} onChange={event => setNewDay({ ...newDay, weekNumber: Number(event.target.value) })} aria-label="Week number"/><input className={inputClass} type="number" min={1} max={7} value={newDay.dayNumber} onChange={event => setNewDay({ ...newDay, dayNumber: Number(event.target.value) })} aria-label="Day number"/><input required className={inputClass} value={newDay.title} onChange={event => setNewDay({ ...newDay, title: event.target.value })} placeholder="Tên Day"/><button className="primary-button inline-flex items-center justify-center gap-1"><Plus size={16}/> Add Day</button></form></div>
      {days.map((day, dayIndex) => <article key={day.id} className="dashboard-panel"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-emerald-400">W{day.week_number} · D{day.day_number}</p><h3 className="mt-1 text-lg font-semibold text-white">{day.title}</h3><p className="text-sm text-slate-500">{day.exercises.length} exercise(s)</p></div><div className="flex gap-1"><button className="icon-button" aria-label={`Đưa ${day.title} lên`} disabled={dayIndex === 0} onClick={() => void moveDay(dayIndex, -1)}><ArrowUp size={15}/></button><button className="icon-button" aria-label={`Đưa ${day.title} xuống`} disabled={dayIndex === days.length - 1} onClick={() => void moveDay(dayIndex, 1)}><ArrowDown size={15}/></button><button className="icon-button" aria-label={`Xóa ${day.title}`} onClick={() => setConfirm({ kind: 'day', id: day.id })}><Trash2 size={16}/></button></div></div>
        <div className="mt-4 space-y-2">{day.exercises.map((item, exerciseIndex) => <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3"><div className="flex items-center gap-2"><GripVertical size={15} className="text-slate-600"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{item.exercise_name}</p><p className="text-xs text-slate-500">{item.muscle_group || '—'} · {item.difficulty || '—'}</p></div><button className="icon-button" aria-label={`Đưa ${item.exercise_name} lên`} disabled={exerciseIndex === 0} onClick={() => void moveExercise(day, exerciseIndex, -1)}><ArrowUp size={13}/></button><button className="icon-button" aria-label={`Đưa ${item.exercise_name} xuống`} disabled={exerciseIndex === day.exercises.length - 1} onClick={() => void moveExercise(day, exerciseIndex, 1)}><ArrowDown size={13}/></button><button className="icon-button" aria-label={`Xóa ${item.exercise_name}`} onClick={() => setConfirm({ kind: 'exercise', id: item.id })}><Trash2 size={14}/></button></div><div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4"><label className="text-xs text-slate-500">Sets<input className={`${inputClass} mt-1`} type="number" min={1} max={50} value={item.target_sets ?? ''} onChange={event => void updateExercise(item, 'target_sets', event.target.value ? Number(event.target.value) : null)}/></label><label className="text-xs text-slate-500">Reps min<input className={`${inputClass} mt-1`} type="number" min={1} value={item.target_reps_min ?? ''} onChange={event => void updateExercise(item, 'target_reps_min', event.target.value ? Number(event.target.value) : null)}/></label><label className="text-xs text-slate-500">Reps max<input className={`${inputClass} mt-1`} type="number" min={1} value={item.target_reps_max ?? ''} onChange={event => void updateExercise(item, 'target_reps_max', event.target.value ? Number(event.target.value) : null)}/></label><label className="text-xs text-slate-500">Rest (s)<input className={`${inputClass} mt-1`} type="number" min={0} value={item.rest_seconds ?? ''} onChange={event => void updateExercise(item, 'rest_seconds', event.target.value ? Number(event.target.value) : null)}/></label></div><label className="mt-2 block text-xs text-slate-500">Coach note<input className={`${inputClass} mt-1`} value={item.coach_note ?? ''} onChange={event => void updateExercise(item, 'coach_note', event.target.value)}/></label></div>)}</div><button className="secondary-button mt-4" onClick={() => setPicker(day.id)}>Add Exercise</button></article>)}
    </section><aside className="dashboard-panel h-fit"><h2 className="text-lg font-semibold text-white">Program details</h2><form onSubmit={saveDetails} className="mt-4 space-y-3"><label className="block text-xs text-slate-500">Name<input className={`${inputClass} mt-1`} value={program.name} onChange={event => setProgram({ ...program, name: event.target.value })}/></label><label className="block text-xs text-slate-500">Description<textarea className={`${inputClass} mt-1 min-h-20`} value={program.description || ''} onChange={event => setProgram({ ...program, description: event.target.value })}/></label><div className="grid grid-cols-2 gap-2"><label className="text-xs text-slate-500">Goal<select className={`${inputClass} mt-1`} value={program.goal} onChange={event => setProgram({ ...program, goal: event.target.value })}>{['GENERAL_FITNESS','WEIGHT_LOSS','MUSCLE_GAIN','STRENGTH','ENDURANCE','MOBILITY'].map(value => <option key={value}>{value}</option>)}</select></label><label className="text-xs text-slate-500">Difficulty<select className={`${inputClass} mt-1`} value={program.difficulty} onChange={event => setProgram({ ...program, difficulty: event.target.value })}>{['BEGINNER','INTERMEDIATE','ADVANCED'].map(value => <option key={value}>{value}</option>)}</select></label></div><div className="grid grid-cols-2 gap-2"><label className="text-xs text-slate-500">Weeks<input className={`${inputClass} mt-1`} type="number" min={1} max={104} value={program.duration_weeks} onChange={event => setProgram({ ...program, duration_weeks: Number(event.target.value) })}/></label><label className="text-xs text-slate-500">Days/week<input className={`${inputClass} mt-1`} type="number" min={1} max={7} value={program.days_per_week} onChange={event => setProgram({ ...program, days_per_week: Number(event.target.value) })}/></label></div><button className="primary-button w-full" type="submit">Save details</button></form><h2 className="mt-8 text-lg font-semibold text-white">Preview</h2><div className="mt-4 space-y-2">{days.map(day => <div key={day.id} className="rounded-lg border border-slate-800 p-3"><p className="text-sm font-medium text-white">{day.title}</p><p className="text-xs text-slate-500">{day.exercises.map(item => item.exercise_name).join(' · ') || 'Chưa có Exercise'}</p></div>)}</div><p className="mt-6 text-xs text-slate-500">Reorder endpoint có transaction + unique ordering. Các thao tác dữ liệu đều server-owned.</p></aside></div>
    {picker !== null && <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true"><button className="absolute inset-0 bg-black/70" aria-label="Đóng Exercise picker" onClick={() => setPicker(null)}/><div className="relative max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5"><h2 className="text-lg font-semibold text-white">Chọn Exercise active</h2><div className="mt-4 space-y-2">{exercises.filter(exercise => !days.find(day => day.id === picker)?.exercises.some(item => item.exercise_id === exercise.id)).map(exercise => <button key={exercise.id} className="flex w-full items-center justify-between rounded-xl border border-slate-800 p-3 text-left hover:border-emerald-400" onClick={() => void addExercise(picker, exercise)}><span><strong className="block text-sm text-white">{exercise.name}</strong><small className="text-xs text-slate-500">{exercise.muscle_group || '—'} · {exercise.difficulty || '—'}</small></span><Plus size={16} className="text-emerald-400"/></button>)}</div></div></div>}
    {confirm && <ConfirmDialog title="Xóa khỏi Program?" description="Thao tác này không xóa Exercise global. Nếu Day đã được dùng trong Schedule, backend sẽ giữ an toàn dữ liệu." onCancel={() => setConfirm(null)} onConfirm={() => void remove()}/>}</CoachPage>;
}
