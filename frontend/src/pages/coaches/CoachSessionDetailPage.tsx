import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSession } from '../../services/coachWorkspaceApi';
import type { CoachSessionDetail } from '../../types/coachWorkspace';
import { CoachPage, ErrorState, LoadingState } from './CoachCommon';

export default function CoachSessionDetailPage() {
  const { memberId, sessionId } = useParams();
  const [item, setItem] = useState<CoachSessionDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (memberId && sessionId) getSession(Number(memberId), Number(sessionId)).then(setItem).catch(() => setError('Session không tồn tại trong active scope.'));
  }, [memberId, sessionId]);

  return <CoachPage title="Session detail" description="Exercise snapshot legacy read-only. Set summary chỉ hiển thị khi Member flow đã cung cấp dữ liệu." backTo={`/coach/members/${memberId}/sessions`}>
    {!item && !error ? <LoadingState /> : error ? <ErrorState message={error} /> : item && <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]"><div className="dashboard-panel"><h2 className="text-xl font-semibold text-white">{item.workout_name}</h2><p className="mt-3 text-sm text-slate-400">{item.status} · {new Date(item.started_at).toLocaleString('vi-VN')}</p><p className="mt-6 text-sm text-amber-200">Set summary: BLOCKED_BY_MEMBER_WORKOUT_FLOW</p></div><div className="dashboard-panel"><h2 className="text-lg font-semibold text-white">Exercise snapshot</h2>{item.exerciseSnapshot.length === 0 ? <div className="panel-state mt-4">Chưa có snapshot.</div> : <div className="mt-4 space-y-2">{item.exerciseSnapshot.map((exercise, index) => <div className="rounded-xl border border-slate-800 p-3" key={index}><p className="text-sm text-white">{String((exercise as { name?: unknown }).name || 'Exercise')}</p><p className="text-xs text-slate-500">Sets {String((exercise as { sets?: unknown }).sets ?? '—')} · Reps {String((exercise as { reps?: unknown }).reps ?? '—')} · Duration {String((exercise as { duration_seconds?: unknown }).duration_seconds ?? '—')}</p></div>)}</div>}</div></div>}
  </CoachPage>;
}
