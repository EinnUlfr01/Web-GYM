import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, Loader2, UserCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cancelMyBooking, getBookingById, type Booking } from '../../services/bookings';

export default function AppointmentDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => { if (!bookingId) return; setLoading(true); setError(''); try { setBooking(await getBookingById(bookingId)); } catch (reason: unknown) { const value = reason as { response?: { data?: { message?: string } }; message?: string }; setError(value.response?.data?.message || value.message || 'Không thể tải lịch hẹn.'); } finally { setLoading(false); } }, [bookingId]);
  useEffect(() => { void load(); }, [load]);
  const cancel = async () => { if (!booking || !window.confirm('Hủy lịch hẹn này?')) return; try { setBooking(await cancelMyBooking(booking.id)); } catch (reason: unknown) { const value = reason as { response?: { data?: { message?: string } }; message?: string }; setError(value.response?.data?.message || value.message || 'Không thể hủy lịch hẹn.'); } };
  if (loading) return <div className="panel-state"><Loader2 size={18} className="mr-2 inline animate-spin" />Đang tải...</div>;
  if (error || !booking) return <div className="panel-error"><p>{error || 'Không tìm thấy lịch hẹn.'}</p><button type="button" onClick={() => void load()} className="secondary-button mt-3">Thử lại</button></div>;
  return <div className="dashboard-page"><Link to="/appointments" className="mb-6 inline-flex items-center gap-2 text-[#94a3b8]"><ArrowLeft size={16} /> Lịch hẹn của tôi</Link><section className="max-w-2xl rounded-xl border border-[#1e293b] bg-[#0f172a] p-6"><p className="text-sm uppercase tracking-[0.16em] text-[#60a5fa]">Appointment #{booking.id}</p><h1 className="mt-2 text-2xl font-bold text-white">{booking.coach_name || `Coach #${booking.coach_id}`}</h1><div className="mt-6 space-y-3 text-[#cbd5e1]"><p><Calendar size={16} className="mr-2 inline text-[#60a5fa]" />{booking.booking_date}</p><p><Clock size={16} className="mr-2 inline text-[#60a5fa]" />{booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)} · 60 phút</p><p><UserCircle size={16} className="mr-2 inline text-[#60a5fa]" />Trạng thái: {booking.status}</p>{booking.notes && <p className="rounded-lg bg-[#020617] p-3 text-sm text-[#94a3b8]">{booking.notes}</p>}</div>{(booking.status === 'pending' || booking.status === 'confirmed') && <button type="button" onClick={() => void cancel()} className="mt-6 rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300">Hủy lịch hẹn</button>}<button type="button" onClick={() => navigate('/appointments')} className="ml-3 mt-6 rounded-lg border border-[#334155] px-4 py-2 text-sm text-white">Quay lại</button></section></div>;
}
