import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Dumbbell, HeartPulse, ShoppingBag, Star, Ticket } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { DashboardPageHeader, DashboardPanel, DashboardSkeleton, EmptyState, MetricCard, PanelError, QuickAction } from '../../components/dashboard/DashboardPrimitives';
import { getMemberCurrent } from '../../services/memberWorkoutApi';
import { getMyBookings, type Booking } from '../../services/bookings';
import api from '../../api/axios';
import type { MemberCurrent } from '../../types/memberWorkout';

interface LoyaltyPoints { balance: number }

function MemberWorkoutWidget() {
  const [data, setData] = useState<MemberCurrent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => { setLoading(true); setError(''); getMemberCurrent().then(setData).catch((reason: unknown) => { const status = typeof reason === 'object' && reason !== null && 'response' in reason ? (reason as { response?: { status?: number } }).response?.status : undefined; if (status === 404) setData({ assignment: null, program: null, upcomingSchedules: [], activeSession: null }); else setError('Không thể tải dữ liệu workout.'); }).finally(() => setLoading(false)); };
  useEffect(load, []);
  if (loading) return <DashboardPanel title="Workout của bạn" description="Assignment và lịch execution thật"><div className="panel-state" aria-live="polite">Đang tải workout...</div></DashboardPanel>;
  if (error) return <DashboardPanel title="Workout của bạn" description="Assignment và lịch execution thật"><PanelError message={error} onRetry={load} /></DashboardPanel>;
  if (!data) return null;
  const target = data.activeSession ? `/workouts/sessions/${data.activeSession.id}` : '/workouts';
  return <DashboardPanel title="Workout của bạn" description="Tách biệt với Coach Appointment"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-lg font-semibold text-white">{data.activeSession ? `Đang tập · ${data.activeSession.program.name}` : data.assignment?.program_name || 'Chưa có assignment active'}</p><p className="mt-1 text-sm text-slate-400">{data.activeSession ? 'Tiếp tục session đang dở.' : data.assignment ? `${data.upcomingSchedules.length} schedule trong tài khoản.` : 'Chưa có assignment hiện tại.'}</p></div><Link className="primary-button inline-flex items-center gap-2" to={target}>{data.activeSession ? 'Tiếp tục' : 'Mở Workouts'} <ArrowRight size={15} /></Link></div></DashboardPanel>;
}

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [points, setPoints] = useState<LoyaltyPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => { setLoading(true); setError(''); Promise.all([getMyBookings({ limit: 100 }), api.get<{ data: LoyaltyPoints }>('/loyalty/points').then(response => response.data.data)]).then(([nextBookings, nextPoints]) => { setBookings(nextBookings); setPoints(nextPoints); }).catch(() => setError('Không thể tải dữ liệu tổng quan.')).finally(() => setLoading(false)); };
  useEffect(load, []);
  if (user?.role === 'admin') return <Navigate to="/admin" />;
  if (user?.role === 'coach') return <Navigate to="/coach" />;
  if (loading) return <DashboardSkeleton />;
  const upcoming = bookings.filter(item => item.status === 'pending' || item.status === 'confirmed');
  const completed = bookings.filter(item => item.status === 'completed');
  return <div className="dashboard-page"><DashboardPageHeader eyebrow="KHÔNG GIAN CÁ NHÂN" title={`Chào ${user?.name?.split(' ')[0] || 'bạn'}`} description="Theo dõi lịch hẹn Coach và workout của riêng bạn." action={<Link className="primary-button" to="/coaches">Đặt lịch Coach</Link>} />{error && <PanelError message={error} onRetry={load} />}<div className="metric-grid"><MetricCard title="Điểm Loyalty" value={points?.balance ?? '—'} icon={<Star size={18} />} tone="amber" /><MetricCard title="Buổi đã hoàn thành" value={completed.length} icon={<Dumbbell size={18} />} tone="lime" /><MetricCard title="Lịch hẹn sắp tới" value={upcoming.length} icon={<Calendar size={18} />} tone="blue" /><MetricCard title="Trạng thái tài khoản" value="Đang hoạt động" icon={<HeartPulse size={18} />} tone="slate" /></div><MemberWorkoutWidget /><div className="dashboard-grid-main"><DashboardPanel title="Lịch hẹn tiếp theo" description="Coach Appointment độc lập với lịch workout">{upcoming.length ? <div className="record-list">{upcoming.slice(0, 3).map(item => <div className="record-row" key={item.id}><Calendar size={17} /><span><strong>{item.coach_name || `Coach #${item.coach_id}`}</strong><small>{item.booking_date} · {item.start_time.slice(0, 5)} · {item.status}</small></span><Link to={`/appointments/${item.id}`}>Xem</Link></div>)}</div> : <EmptyState title="Chưa có lịch hẹn sắp tới" description="Chọn Coach và gửi yêu cầu đặt lịch." action={<Link className="secondary-button" to="/coaches">Tìm Coach</Link>} />}</DashboardPanel><DashboardPanel title="Tóm tắt cá nhân" description="Chỉ hiển thị dữ liệu thuộc tài khoản"><div className="quick-grid"><QuickAction to="/appointments" title="Lịch hẹn của tôi" description="Theo dõi trạng thái booking" icon={<Calendar size={18} />} /><QuickAction to="/orders" title="Đơn hàng của tôi" description="Xem lịch sử mua hàng" icon={<ShoppingBag size={18} />} /><QuickAction to="/tickets" title="Hỗ trợ" description="Gửi yêu cầu hỗ trợ" icon={<Ticket size={18} />} /></div></DashboardPanel></div></div>;
}
