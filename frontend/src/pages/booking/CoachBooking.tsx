import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getCoachAvailability, getPublicCoach, type Coach } from '../../services/coaches';
import { createBooking } from '../../services/bookings';
import { roleHome } from '../../auth/accessPolicy';
import { useAuthStore } from '../../stores/authStore';
import { coachDateOptions } from '../../utils/coachBooking';

export default function CoachBooking() {
  const { id } = useParams<{ id: string }>();
  const { user, initialized } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const dates = useMemo(() => coachDateOptions(), []);

  useEffect(() => {
    if (!id || !user || user.role !== 'member') return;
    getPublicCoach(id).then(setCoach).catch(() => setError('Không thể tải Coach.')).finally(() => setLoading(false));
  }, [id, user]);

  useEffect(() => {
    if (!id || !date || !coach?.bookingEnabled) return;
    setSlotsLoading(true);
    setError('');
    setSlot('');
    getCoachAvailability(id, date).then(result => setSlots(result.available_slots)).catch(reason => {
      const value = reason as { response?: { data?: { message?: string } }; message?: string };
      setError(value.response?.data?.message || value.message || 'Không thể tải slot trống.');
      setSlots([]);
    }).finally(() => setSlotsLoading(false));
  }, [id, date, coach?.bookingEnabled]);

  if (!initialized) return <div className="flex min-h-screen items-center justify-center bg-[#020617]"><Loader2 className="animate-spin text-[#2563eb]" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== 'member') return <Navigate to={roleHome(user.role)} replace />;
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#020617] text-[#94a3b8]"><Loader2 className="mr-3 animate-spin text-[#2563eb]" />Đang tải...</div>;
  if (!coach || !id) return <div className="p-10 text-center text-red-300">{error || 'Không tìm thấy Coach.'}</div>;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!date || !slot || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await createBooking({ coachId: coach.id, date, startTime: slot, note: note.trim() || undefined });
      navigate('/appointments', { replace: true });
    } catch (reason: unknown) {
      const value = reason as { response?: { status?: number; data?: { message?: string } }; message?: string };
      setError(value.response?.data?.message || value.message || (value.response?.status === 409 ? 'Slot vừa được người khác đặt. Hãy chọn slot khác.' : 'Không thể tạo lịch hẹn.'));
    } finally { setSubmitting(false); }
  };

  return <div className="min-h-screen bg-[#020617] py-16"><div className="mx-auto max-w-3xl px-4 sm:px-6"><Link to={`/coaches/${coach.id}`} className="mb-6 inline-flex items-center gap-2 text-[#94a3b8]"><ArrowLeft size={16} /> Quay lại hồ sơ</Link><div className="rounded-2xl border border-[#1e293b] bg-[#0f172a] p-6 sm:p-8"><h1 className="text-3xl font-bold text-white">Đặt lịch với {coach.name}</h1><p className="mt-2 text-[#94a3b8]">Chọn ngày và slot 60 phút theo múi giờ Asia/Ho_Chi_Minh.</p><div className="mt-8 flex items-center gap-2 text-sm text-[#94a3b8]">{['Ngày', 'Slot', 'Xác nhận'].map((label, index) => <span key={label} className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${step >= index + 1 ? 'bg-[#2563eb] text-white' : 'bg-[#1e293b] text-slate-500'}`}>{index + 1}</span>{label}{index < 2 && <ChevronRight size={15} />}</span>)}</div>{error && <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}
      <form onSubmit={submit} className="mt-8 space-y-7">
        {step === 1 && <div><label htmlFor="booking-date" className="block text-sm font-medium text-white">Ngày hẹn</label><select id="booking-date" value={date} onChange={event => { setDate(event.target.value); setStep(2); }} className="mt-2 w-full rounded-lg border border-[#334155] bg-[#020617] px-3 py-3 text-white"><option value="">Chọn ngày</option>{dates.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>}
        {step >= 2 && <div><div className="flex items-center justify-between"><label className="block text-sm font-medium text-white">Slot còn trống</label><button type="button" onClick={() => setStep(1)} className="text-xs text-[#60a5fa]">Đổi ngày</button></div>{slotsLoading ? <div className="mt-3 flex items-center gap-2 text-sm text-[#94a3b8]"><Loader2 size={15} className="animate-spin" />Đang tải slot...</div> : slots.length === 0 ? <p className="mt-3 text-sm text-[#94a3b8]">Ngày này không còn slot trống.</p> : <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{slots.map(value => <button type="button" key={value} onClick={() => { setSlot(value); setStep(3); }} className={`rounded-lg border px-3 py-3 text-sm ${slot === value ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#334155] bg-[#020617] text-[#cbd5e1] hover:border-[#2563eb]'}`}><Clock size={14} className="mr-1 inline" />{value}</button>)}</div>}</div>}
        {step === 3 && <div className="space-y-5"><div className="rounded-xl border border-[#334155] bg-[#020617] p-4 text-sm text-[#cbd5e1]"><p><Calendar size={15} className="mr-2 inline text-[#60a5fa]" />{date}</p><p className="mt-2"><Clock size={15} className="mr-2 inline text-[#60a5fa]" />{slot} · 60 phút</p><p className="mt-2">Coach: {coach.name}</p></div><label htmlFor="booking-note" className="block text-sm font-medium text-white">Ghi chú (không bắt buộc)<textarea id="booking-note" value={note} maxLength={500} onChange={event => setNote(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-[#334155] bg-[#020617] px-3 py-3 text-white" placeholder="Mục tiêu hoặc lưu ý cho Coach" /></label><button type="submit" disabled={!date || !slot || submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-5 py-3 font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle size={17} />} Gửi yêu cầu đặt lịch</button><p className="text-center text-xs text-[#64748b]">Lịch hẹn sẽ ở trạng thái PENDING cho đến khi Coach xác nhận.</p></div>}
      </form></div></div></div>;
}
