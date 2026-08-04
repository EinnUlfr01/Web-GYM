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

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const response = await api.post<ApiResponse<Booking>>('/bookings', payload);
  return response.data.data;
}

export async function getMyBookings(params?: { status?: BookingStatus; page?: number; limit?: number }): Promise<Booking[]> {
  const response = await api.get<BookingListResponse>('/bookings', { params });
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

export async function getCoachAppointments(params?: { status?: BookingStatus; page?: number; limit?: number }): Promise<Booking[]> {
  return getMyBookings(params);
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
