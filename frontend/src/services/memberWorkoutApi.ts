import api from '../api/axios';
import type { MemberCurrent, MemberProgress, MemberSchedule, MemberSchedulePage, MemberSession, MemberSessionPage, MemberSetLog } from '../types/memberWorkout';

const data = <T,>(response:{data:{data:T}}) => response.data.data;
export const getMemberCurrent = async () => data<MemberCurrent>(await api.get('/member/workouts/current'));
export const listMemberSchedules = async (params:Record<string,unknown> = {}) => data<MemberSchedulePage>(await api.get('/member/workouts/schedules', { params }));
export const getMemberSchedule = async (id:number) => data<MemberSchedule>(await api.get(`/member/workouts/schedules/${id}`));
export const startMemberSession = async (scheduleId:number) => data<MemberSession>(await api.post(`/member/workouts/schedules/${scheduleId}/start`));
export const listMemberSessions = async (params:Record<string,unknown> = {}) => data<MemberSessionPage>(await api.get('/member/workouts/sessions', { params }));
export const getMemberSession = async (id:number) => data<MemberSession>(await api.get(`/member/workouts/sessions/${id}`));
export const completeMemberSession = async (id:number) => data<MemberSession>(await api.post(`/member/workouts/sessions/${id}/complete`));
export const abandonMemberSession = async (id:number) => data<MemberSession>(await api.post(`/member/workouts/sessions/${id}/abandon`));
export const getMemberProgress = async () => data<MemberProgress>(await api.get('/member/workouts/progress'));
export const createMemberSet = async (sessionId:number, sessionExerciseId:number, body:Record<string,unknown>) => data<MemberSetLog>(await api.post(`/member/workouts/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`, body));
export const updateMemberSet = async (sessionId:number, sessionExerciseId:number, setId:number, body:Record<string,unknown>) => data<MemberSetLog>(await api.patch(`/member/workouts/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`, body));
export const deleteMemberSet = async (sessionId:number, sessionExerciseId:number, setId:number) => api.delete(`/member/workouts/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`);
