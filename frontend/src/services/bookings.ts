import api from '../api/axios';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: number;
  coach_id: number;
  member_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  member_name?: string | null;
  coach_name?: string | null;
  coach_avatar_url?: string | null;
}

export interface CreateBookingPayload {
  coachId: number;
  date: string;
  startTime: string;
  note?: string;
}

interface ApiResponse<T> { data: T }
interface BookingListResponse { data: Booking[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }
export interface BookingQuery { status?: BookingStatus | BookingStatus[]; fromDate?: string; toDate?: string; page?: number; limit?: number }
export interface BookingPage { items: Booking[]; page: number; limit: number; total: number; totalPages: number }
export interface BookingSummary { total: number; pending: number; confirmed: number; completed: number; cancelled: number; no_show: number; upcoming: number; today: number; asOfDate: string; timezone: string }

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const response = await api.post<ApiResponse<Booking>>('/bookings', payload);
  return response.data.data;
}

function queryParams(params?: BookingQuery): Record<string, unknown> | undefined {
  if (!params) return undefined;
  return { ...params, status: Array.isArray(params.status) ? params.status.join(',') : params.status };
}

export async function getBookingsPage(params?: BookingQuery): Promise<BookingPage> {
  const response = await api.get<BookingListResponse>('/bookings', { params: queryParams(params) });
  const pagination = response.data.pagination ?? { page: params?.page ?? 1, limit: params?.limit ?? response.data.data.length, total: response.data.data.length, totalPages: response.data.data.length ? 1 : 0 };
  return { items: response.data.data, ...pagination };
}

export async function getMyBookings(params?: BookingQuery): Promise<Booking[]> {
  return (await getBookingsPage(params)).items;
}

export async function getBookingSummary(params?: Pick<BookingQuery, 'fromDate' | 'toDate'>): Promise<BookingSummary> {
  const response = await api.get<ApiResponse<BookingSummary>>('/bookings/summary', { params });
  return response.data.data;
}

export async function getBookingById(id: number | string): Promise<Booking> {
  const response = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
  return response.data.data;
}

export async function updateBookingStatus(id: number | string, status: Exclude<BookingStatus, 'pending'>): Promise<Booking> {
  const response = await api.put<ApiResponse<Booking>>(`/bookings/${id}/status`, { status });
  return response.data.data;
}

export async function cancelMyBooking(id: number | string): Promise<Booking> {
  return updateBookingStatus(id, 'cancelled');
}

export async function getCoachAppointmentsPage(params?: BookingQuery): Promise<BookingPage> {
  return getBookingsPage(params);
}

export async function getCoachAppointments(params?: BookingQuery): Promise<Booking[]> {
  return (await getCoachAppointmentsPage(params)).items;
}

export async function confirmBooking(id: number | string): Promise<Booking> {
  return updateBookingStatus(id, 'confirmed');
}

export async function cancelCoachBooking(id: number | string): Promise<Booking> {
  return updateBookingStatus(id, 'cancelled');
}

export async function completeBooking(id: number | string): Promise<Booking> {
  return updateBookingStatus(id, 'completed');
}

export async function markBookingNoShow(id: number | string): Promise<Booking> {
  return updateBookingStatus(id, 'no_show');
}
