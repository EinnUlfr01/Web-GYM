import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, Filter, Loader2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listPublicCoaches, type Coach } from '../../services/coaches';

function initials(name: string): string {
  return name.split(/\s+/).map(part => part[0] ?? '').join('').toUpperCase().slice(0, 2);
}

export default function CoachListPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'experience'>('name');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCoaches(await listPublicCoaches());
    } catch (reason: unknown) {
      const value = reason as { response?: { data?: { message?: string } }; message?: string };
      setError(value.response?.data?.message || value.message || 'Không thể tải danh sách Coach.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => coaches
    .filter(coach => !search.trim() || coach.name.toLowerCase().includes(search.trim().toLowerCase()) || coach.specialty?.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => sortBy === 'experience'
      ? (b.experienceYears ?? -1) - (a.experienceYears ?? -1) || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name)), [coaches, search, sortBy]);

  return (
    <div className="min-h-screen bg-[#020617] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white">Meet Your Coaches</h1>
          <p className="mx-auto max-w-2xl text-lg text-[#94a3b8]">Xem hồ sơ Coach đang hoạt động và đặt lịch hẹn thật từ dữ liệu hệ thống.</p>
        </motion.div>

        <div className="mb-8 flex flex-col gap-3 rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-[#cbd5e1]">Tìm Coach hoặc chuyên môn
            <input value={search} onChange={event => setSearch(event.target.value)} className="mt-2 w-full rounded-lg border border-[#1e293b] bg-[#020617] px-3 py-2 text-white" placeholder="Ví dụ: strength" />
          </label>
          <label className="text-sm text-[#cbd5e1]">Sắp xếp
            <select value={sortBy} onChange={event => setSortBy(event.target.value as 'name' | 'experience')} className="mt-2 w-full rounded-lg border border-[#1e293b] bg-[#020617] px-3 py-2 text-white sm:w-48">
              <option value="name">Tên A–Z</option>
              <option value="experience">Kinh nghiệm</option>
            </select>
          </label>
          <Filter size={18} className="hidden text-[#94a3b8] sm:block" aria-hidden="true" />
        </div>

        {loading && <div className="flex flex-col items-center justify-center py-24 text-[#94a3b8]"><Loader2 size={42} className="mb-4 animate-spin text-[#2563eb]" /><p>Đang tải Coach...</p></div>}
        {!loading && error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center"><AlertCircle size={42} className="mx-auto mb-4 text-red-400" /><p className="mb-4 text-red-200">{error}</p><button onClick={() => void load()} className="rounded-lg bg-[#2563eb] px-6 py-2 text-white">Thử lại</button></div>}
        {!loading && !error && filtered.length === 0 && <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-12 text-center text-[#94a3b8]">Chưa có Coach phù hợp.</div>}
        {!loading && !error && filtered.length > 0 && <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((coach, index) => <motion.article key={coach.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-6 hover:border-[#2563eb]/60">
            <div className="mb-5 flex items-start justify-between gap-4">
              {coach.avatarUrl ? <img src={coach.avatarUrl} alt={coach.name} className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2563eb] to-[#0ea5e9] text-lg font-semibold text-white">{initials(coach.name)}</div>}
              <span className={`rounded-full px-2 py-1 text-xs ${coach.bookingEnabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>{coach.bookingEnabled ? 'Có thể đặt lịch' : 'Tạm khóa đặt lịch'}</span>
            </div>
            <h2 className="text-xl font-semibold text-white">{coach.name}</h2>
            <p className="mt-1 text-sm text-[#60a5fa]">{coach.specialty || 'Coach thể hình'}</p>
            {coach.location && <p className="mt-3 flex items-center gap-2 text-sm text-[#94a3b8]"><MapPin size={14} />{coach.location}</p>}
            <p className="mt-4 line-clamp-3 min-h-16 text-sm leading-6 text-[#94a3b8]">{coach.bio || 'Hồ sơ Coach đang được cập nhật.'}</p>
            <div className="mt-5 flex gap-2"><Link to={`/coaches/${coach.id}`} className="flex-1 rounded-lg border border-[#334155] px-3 py-2 text-center text-sm text-white hover:border-[#2563eb]">Xem hồ sơ</Link>{coach.bookingEnabled && <Link to={`/coaches/${coach.id}/book`} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-[#2563eb] px-3 py-2 text-sm text-white hover:bg-[#1d4ed8]">Đặt lịch <ArrowRight size={14} /></Link>}</div>
          </motion.article>)}
        </div>}
      </div>
    </div>
  );
}
