import api from '../api/axios';

export type CoachSessionMode = 'ONLINE' | 'IN_PERSON' | 'BOTH';

export interface Coach {
  id: number;
  name: string;
  avatarUrl: string | null;
  specialty: string | null;
  bio: string | null;
  experienceYears: number | null;
  sessionMode: CoachSessionMode | null;
  location: string | null;
  bookingEnabled: boolean;
}

export type CoachDetail = Coach;

export interface CoachAvailability {
  date: string;
  coach_id: number;
  available_slots: string[];
  booked_slots: string[];
  duration_minutes: number;
  timezone: string;
}

interface ApiResponse<T> { data: T }
interface CoachListData { coaches: Coach[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

export async function listPublicCoaches(params?: { search?: string; page?: number; limit?: number }): Promise<Coach[]> {
  const response = await api.get<ApiResponse<CoachListData>>('/coaches', { params });
  return response.data.data.coaches;
}

export async function getPublicCoach(coachId: number | string): Promise<Coach> {
  const response = await api.get<ApiResponse<Coach>>(`/coaches/${coachId}`);
  return response.data.data;
}

export async function getCoachAvailability(coachId: number | string, date: string): Promise<CoachAvailability> {
  const response = await api.get<ApiResponse<CoachAvailability>>(`/coaches/${coachId}/availability`, { params: { date } });
  return response.data.data;
}

// Compatibility aliases for existing Coach pages; all calls use the canonical /api/coaches source.
export const getCoaches = listPublicCoaches;
export const getCoachById = async (id: string): Promise<CoachDetail> => getPublicCoach(id);
