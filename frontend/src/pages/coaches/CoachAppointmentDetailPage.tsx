import { ArrowLeft, Calendar, Clock, UserCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getBookingById, type Booking } from '../../services/bookings';

export default function CoachAppointmentDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { if (bookingId) getBookingById(bookingId).then(setBooking).catch(() => setError('Không thể tải lịch hẹn.')); }, [bookingId]);
  if (error || !booking) return <div className="panel-state">{error || 'Đang tải...'}</div>;
  return <div className="dashboard-page"><Link to="/coach/appointments" className="mb-6 inline-flex items-center gap-2 text-[#94a3b8]"><ArrowLeft size={16} /> Lịch hẹn học viên</Link><section className="max-w-2xl rounded-xl border border-[#1e293b] bg-[#0f172a] p-6"><p className="text-sm uppercase tracking-[0.16em] text-[#60a5fa]">Appointment #{booking.id}</p><h1 className="mt-2 text-2xl font-bold text-white">{booking.member_name || `Member #${booking.member_id}`}</h1><div className="mt-6 space-y-3 text-[#cbd5e1]"><p><Calendar size={16} className="mr-2 inline text-[#60a5fa]" />{booking.booking_date}</p><p><Clock size={16} className="mr-2 inline text-[#60a5fa]" />{booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)} · 60 phút</p><p><UserCircle size={16} className="mr-2 inline text-[#60a5fa]" />Trạng thái: {booking.status}</p>{booking.notes && <p className="rounded-lg bg-[#020617] p-3 text-sm text-[#94a3b8]">{booking.notes}</p>}</div></section></div>;
}
