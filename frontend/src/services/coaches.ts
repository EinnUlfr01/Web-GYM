import api from '../api/axios';

export type CoachSessionMode = 'ONLINE' | 'IN_PERSON' | 'BOTH';

export interface CoachSelfProfile {
  coachId: number;
  name: string;
  specialty: string | null;
  bio: string | null;
  experienceYears: number | null;
  sessionMode: CoachSessionMode | null;
  location: string | null;
  bookingEnabled: boolean;
}

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
export interface CoachPagination { page: number; limit: number; total: number; totalPages: number }
export interface CoachListResult { items: Coach[]; coaches: Coach[]; pagination: CoachPagination }

export async function listPublicCoaches(params?: { search?: string; page?: number; limit?: number }): Promise<CoachListResult> {
  const response = await api.get<ApiResponse<CoachListResult>>('/coaches', { params });
  return response.data.data;
}

export async function getPublicCoach(coachId: number | string): Promise<Coach> {
  const response = await api.get<ApiResponse<Coach>>(`/coaches/${coachId}`);
  return response.data.data;
}

export async function getCoachAvailability(coachId: number | string, date: string): Promise<CoachAvailability> {
  const response = await api.get<ApiResponse<CoachAvailability>>(`/coaches/${coachId}/availability`, { params: { date } });
  return response.data.data;
}

export async function getMyCoachProfile(): Promise<CoachSelfProfile> {
  const response = await api.get<ApiResponse<CoachSelfProfile>>('/coach/profile');
  return response.data.data;
}

export async function updateMyCoachProfile(input: {
  specialty: string;
  bio: string;
  experienceYears: number | null;
  sessionMode: CoachSessionMode | null;
  location: string;
  bookingEnabled: boolean;
}): Promise<CoachSelfProfile> {
  const response = await api.patch<ApiResponse<CoachSelfProfile>>('/coach/profile', input);
  return response.data.data;
}

// Compatibility aliases for existing Coach pages; all calls use the canonical /api/coaches source.
export const getCoaches = listPublicCoaches;
export const getCoachById = async (id: string): Promise<CoachDetail> => getPublicCoach(id);
