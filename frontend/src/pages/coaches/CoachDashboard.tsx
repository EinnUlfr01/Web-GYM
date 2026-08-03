import { useEffect, useState } from 'react';
import { Calendar, ClipboardList, Dumbbell, Users, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardPageHeader, DashboardPanel, EmptyState, MetricCard, PanelError, QuickAction } from '../../components/dashboard/DashboardPrimitives';
import { getCoachDashboard } from '../../services/coachWorkspaceApi';
import type { CoachDashboardData } from '../../types/coachWorkspace';
import { format } from 'date-fns';

export default function CoachDashboard() {
  const [dashboard, setDashboard] = useState<CoachDashboardData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { getCoachDashboard().then(setDashboard).catch(() => setError('Không thể tải dữ liệu Coach trong phạm vi của bạn.')); }, []);
  const counts = dashboard?.counts;
  return <div className="dashboard-page">
    <DashboardPageHeader eyebrow="KHÔNG GIAN COACH" title="Coach Dashboard" description="Theo dõi học viên, chương trình, assignment và lịch tập thuộc phạm vi của bạn." action={<Link className="primary-button" to="/coach/workout-programs/new">Tạo program</Link>} />
    {error && <PanelError message={error} />}
    <div className="metric-grid">
      <MetricCard title="Member được phân công" value={counts?.assignedMembers ?? '—'} detail="Active scope" icon={<Users size={18}/>} tone="blue" loading={!dashboard && !error}/>
      <MetricCard title="Member active" value={counts?.activeMembers ?? '—'} detail="Không gồm ngoài scope" icon={<UserCircle size={18}/>} tone="lime" loading={!dashboard && !error}/>
      <MetricCard title="Program của tôi" value={counts?.ownedPrograms ?? '—'} detail="Owned by Coach" icon={<Dumbbell size={18}/>} tone="amber" loading={!dashboard && !error}/>
      <MetricCard title="Assignment active" value={counts?.activeAssignments ?? '—'} detail="Primary assignment" icon={<ClipboardList size={18}/>} tone="slate" loading={!dashboard && !error}/>
    </div>
    <div className="dashboard-grid-main">
      <DashboardPanel title="Lịch sắp tới" description="Chỉ hiển thị lịch của member thuộc scope">
        {!dashboard ? <div className="panel-state">Đang tải…</div> : dashboard.upcomingSchedules.length === 0 ? <EmptyState title="Chưa có lịch sắp tới" description="Tạo assignment và generate schedule khi đã có Program active." action={<Link className="secondary-button" to="/coach/schedules">Mở schedules</Link>} /> : <div className="space-y-3">{dashboard.upcomingSchedules.map(schedule => <Link key={schedule.id} to={`/coach/members/${schedule.member_id}/schedule`} className="quick-action"><span className="quick-icon"><Calendar size={18}/></span><span><strong>{schedule.member_name} · {schedule.day_title}</strong><small>{schedule.scheduled_date} · {schedule.program_name}</small></span></Link>)}</div>}
      </DashboardPanel>
      <DashboardPanel title="Session gần đây" description="Legacy session read-only; set logs chưa có">
        {!dashboard ? <div className="panel-state">Đang tải…</div> : dashboard.recentSessions.length === 0 ? <EmptyState title="Chưa có session" description="BLOCKED_BY_MEMBER_WORKOUT_FLOW nếu Member flow chưa sinh dữ liệu." /> : <div className="space-y-3">{dashboard.recentSessions.map(session => <Link key={session.id} to={`/coach/members/${session.member_id}/sessions/${session.id}`} className="quick-action"><span className="quick-icon"><Dumbbell size={18}/></span><span><strong>{session.member_name} · {session.workout_name}</strong><small>{format(new Date(session.started_at), 'dd/MM/yyyy HH:mm')} · {session.status}</small></span></Link>)}</div>}
      </DashboardPanel>
    </div>
    <DashboardPanel title="Lối tắt" description="Coach-only routes"><div className="quick-grid"><QuickAction to="/coach/workout-programs" title="My Programs" description="Quản lý program của tôi" icon={<Dumbbell size={18}/>}/><QuickAction to="/coach/members" title="My Members" description="Member active trong scope" icon={<Users size={18}/>}/><QuickAction to="/coach/assignments" title="Assignments" description="Gán program thuộc quyền sở hữu" icon={<ClipboardList size={18}/>}/><QuickAction to="/coach/schedules" title="Schedules" description="Quản lý lịch tương lai" icon={<Calendar size={18}/>}/></div></DashboardPanel>
  </div>;
}
