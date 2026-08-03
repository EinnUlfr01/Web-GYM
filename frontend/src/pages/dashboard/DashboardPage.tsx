import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Dumbbell, HeartPulse, ShoppingBag, Star, Ticket } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAuthStore } from '../../stores/authStore';
import { DashboardPageHeader, DashboardPanel, DashboardSkeleton, EmptyState, MetricCard, PanelError, QuickAction } from '../../components/dashboard/DashboardPrimitives';
import { getMemberCurrent } from '../../services/memberWorkoutApi';
import type { MemberCurrent } from '../../types/memberWorkout';

interface Booking { status:string; booking_date:string; }
interface LoyaltyPoints { balance:number; }

function MemberWorkoutWidget() {
  const [data,setData] = useState<MemberCurrent|null>(null);
  useEffect(() => { getMemberCurrent().then(setData).catch(() => undefined); }, []);
  if (!data) return null;
  const target = data.activeSession ? `/workouts/sessions/${data.activeSession.id}` : '/workouts';
  return <DashboardPanel title="Workout của bạn" description="Assignment và lịch execution thật"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-lg font-semibold text-white">{data.activeSession ? `Đang tập · ${data.activeSession.program.name}` : data.assignment?.program_name || 'Chưa có assignment active'}</p><p className="mt-1 text-sm text-slate-400">{data.activeSession ? 'Tiếp tục session đang dở.' : `${data.upcomingSchedules.length} schedule trong tài khoản của bạn.`}</p></div><Link className="primary-button inline-flex items-center gap-2" to={target}>{data.activeSession ? 'Tiếp tục' : 'Mở Workouts'} <ArrowRight size={15}/></Link></div></DashboardPanel>;
}

export default function DashboardPage() {
  const user=useAuthStore(state=>state.user); const bookings=useApi<Booking[]>('/bookings'); const points=useApi<LoyaltyPoints>('/loyalty/points');
  if(user?.role==='admin') return <Navigate to="/admin"/>;
  if(user?.role==='coach') return <Navigate to="/coach"/>;
  if(bookings.loading||points.loading) return <DashboardSkeleton/>;
  const rows=bookings.data||[]; const upcoming=rows.filter(item=>['pending','confirmed'].includes(item.status)); const completed=rows.filter(item=>item.status==='completed');
  return <div className="dashboard-page"><DashboardPageHeader eyebrow="KHÔNG GIAN CÁ NHÂN" title={`Chào ${user?.name?.split(' ')[0]||'bạn'}`} description="Tiếp tục hành trình của bạn với những việc cần làm tiếp theo." action={<Link className="primary-button" to="/booking">Đặt lịch Coach</Link>}/>{(bookings.error||points.error)&&<PanelError message={bookings.error||points.error||'Không thể tải dữ liệu'} onRetry={()=>{void bookings.refetch();void points.refetch();}}/>}<div className="metric-grid"><MetricCard title="Điểm Loyalty" value={points.data?.balance??'—'} icon={<Star size={18}/>} tone="amber"/><MetricCard title="Buổi đã hoàn thành" value={completed.length} icon={<Dumbbell size={18}/>} tone="lime"/><MetricCard title="Lịch sắp tới" value={upcoming.length} icon={<Calendar size={18}/>} tone="blue"/><MetricCard title="Trạng thái tài khoản" value="Đang hoạt động" icon={<HeartPulse size={18}/>} tone="slate"/></div><MemberWorkoutWidget/><div className="dashboard-grid-main"><DashboardPanel title="Việc tiếp theo" description="Ưu tiên cá nhân của bạn">{upcoming.length?<div className="record-list">{upcoming.slice(0,3).map((item,index)=><div className="record-row" key={`${item.booking_date}-${index}`}><Calendar size={17}/><span><strong>Buổi tập đã đặt</strong><small>{new Date(item.booking_date).toLocaleDateString('vi-VN')} · {item.status}</small></span><Link to="/booking">Xem</Link></div>)}</div>:<EmptyState title="Chưa có lịch sắp tới" description="Đặt một buổi với Coach để bắt đầu kế hoạch tiếp theo." action={<Link className="secondary-button" to="/booking">Đặt lịch</Link>}/>}</DashboardPanel><DashboardPanel title="Tóm tắt cá nhân" description="Chỉ hiển thị dữ liệu thuộc tài khoản của bạn"><div className="quick-grid"><QuickAction to="/orders" title="Đơn hàng của tôi" description="Xem lịch sử mua hàng" icon={<ShoppingBag size={18}/>}/><QuickAction to="/loyalty" title="Loyalty" description="Điểm và phần thưởng" icon={<Star size={18}/>}/><QuickAction to="/tickets" title="Hỗ trợ" description="Gửi yêu cầu hỗ trợ" icon={<Ticket size={18}/>}/></div></DashboardPanel></div><DashboardPanel title="Không gian cá nhân" description="Các chức năng thực tế trong tài khoản"><div className="data-note"><Dumbbell size={18}/><p>Workout, snapshot, set logs và progress dùng endpoint thật trong Member Workout Flow.</p></div></DashboardPanel></div>;
}
