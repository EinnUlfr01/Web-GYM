import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getMember, listSessions } from '../../services/coachWorkspaceApi';
import type { CoachMemberDetail, CoachSessionHistoryItem } from '../../types/coachWorkspace';
import { CoachPage, ErrorState, LoadingState } from './CoachCommon';

export default function CoachSessionsPage() {
  const { memberId } = useParams();
  const [member, setMember] = useState<CoachMemberDetail | null>(null);
  const [items, setItems] = useState<CoachSessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!memberId) return;
    Promise.all([getMember(Number(memberId)), listSessions(Number(memberId), { page: 1, limit: 50 })])
      .then(([m, s]) => { setMember(m); setItems(s.items); })
      .catch(() => setError('Không thể tải session history trong scope.'))
      .finally(() => setLoading(false));
  }, [memberId]);

  return <CoachPage title={member ? `${member.name} · Session History` : 'Session History'} description="Read-only. Coach không start, log set, complete hoặc sửa terminal session." backTo={memberId ? `/coach/members/${memberId}` : '/coach/members'}>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : items.length === 0 ? <div className="dashboard-panel"><div className="panel-state"><History size={20} /><span>Chưa có session history. Nếu Member workout flow chưa sinh dữ liệu: <strong>BLOCKED_BY_MEMBER_WORKOUT_FLOW</strong></span></div></div> : <div className="dashboard-panel overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3">Workout</th><th>Status</th><th>Started</th><th>Completed</th><th /></tr></thead><tbody>{items.map(item => <tr key={item.id} className="border-t border-slate-800"><td className="py-4 text-white">{item.workout_name}</td><td className="text-slate-300">{item.status}</td><td className="text-slate-400">{new Date(item.started_at).toLocaleString('vi-VN')}</td><td className="text-slate-400">{item.completed_at ? new Date(item.completed_at).toLocaleString('vi-VN') : '—'}</td><td><Link className="text-emerald-400" to={`/coach/members/${memberId}/sessions/${item.id}`}>Chi tiết</Link></td></tr>)}</tbody></table></div>}
  </CoachPage>;
}
