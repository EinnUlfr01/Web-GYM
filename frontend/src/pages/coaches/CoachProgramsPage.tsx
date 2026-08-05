import { useEffect, useState } from 'react';
import { Dumbbell, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Pagination } from '../../components/shared/Pagination';
import { activateProgram, deactivateProgram, listPrograms } from '../../services/coachWorkspaceApi';
import type { CoachProgram } from '../../types/coachWorkspace';
import { CoachPage, ErrorState, inputClass, LoadingState } from './CoachCommon';

export default function CoachProgramsPage() {
  const [items, setItems] = useState<CoachProgram[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    listPrograms({ q: q || undefined, page, limit: 20 })
      .then(result => {
        setItems(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch(() => setError('Không thể tải Program của Coach.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [q, page]);

  const toggle = async (item: CoachProgram) => {
    try {
      const next = item.is_active ? await deactivateProgram(item.id) : await activateProgram(item.id);
      setItems(old => old.map(row => row.id === item.id ? { ...row, ...next } : row));
    } catch {
      setError('Không thể đổi trạng thái Program.');
    }
  };

  return <CoachPage
    title="My Workout Programs"
    description="Program chỉ thuộc Coach hiện tại; Program inactive không thể assign mới."
    actions={<Link className="primary-button inline-flex items-center gap-2" to="/coach/workout-programs/new"><Plus size={17} /> Tạo Program</Link>}
  >
    <div className="dashboard-panel mb-6">
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
        <input
          className={`${inputClass} pl-10`}
          value={q}
          onChange={event => { setPage(1); setQ(event.target.value); }}
          placeholder="Tìm Program"
          aria-label="Tìm Program"
        />
      </div>
    </div>
    {error && <ErrorState message={error} retry={load} />}
    {loading ? <LoadingState /> : items.length === 0 ? <div className="dashboard-panel"><div className="panel-state"><Dumbbell size={20} /> Chưa có Program. Tạo Program đầu tiên của bạn.</div></div> : <>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map(item => <article className="dashboard-panel" key={item.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex gap-2 text-xs uppercase tracking-wider text-slate-500"><span>{item.goal}</span><span>•</span><span>{item.difficulty}</span></div>
              <h2 className="mt-2 text-xl font-semibold text-white">{item.name}</h2>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs ${item.is_active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>{item.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-slate-400">{item.description || 'Không có mô tả.'}</p>
          <div className="mt-5 flex gap-4 text-xs text-slate-500"><span>{item.duration_weeks} tuần</span><span>{item.days_per_week} ngày/tuần</span><span>{item.day_count ?? 0} days</span><span>{item.exercise_count ?? 0} exercises</span></div>
          <div className="mt-6 flex flex-wrap gap-2"><Link className="primary-button" to={`/coach/workout-programs/${item.id}`}>Mở Builder</Link><Link className="secondary-button" to={`/coach/workout-programs/${item.id}/edit`}>Sửa Program</Link><button className="secondary-button" onClick={() => void toggle(item)}>{item.is_active ? 'Deactivate' : 'Activate'}</button></div>
        </article>)}
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} loading={loading} onPageChange={setPage} />
    </>}
  </CoachPage>;
}
