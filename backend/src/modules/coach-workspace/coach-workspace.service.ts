import { getPool, query, sql } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export const MAX_PAGE_SIZE = 50;
const validTimeZone = (value: string) => {
  try { Intl.DateTimeFormat('en-US', { timeZone: value }).format(); return true; } catch { return false; }
};
const dateOnly = (value: unknown): string => {
  const text = String(value ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new AppError(400, 'Date must use YYYY-MM-DD');
  const date = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) throw new AppError(400, 'Invalid date');
  return text;
};
const todayInTimeZone = (timeZone: string) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const addDays = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const mondayDay = (value: string) => {
  const day = new Date(`${value}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
};

export function assertTimeZone(timeZone: string) {
  if (!validTimeZone(timeZone)) throw new AppError(400, 'schedule_timezone must be a valid IANA timezone');
}

export async function assertMemberScope(coachId: number, memberId: number) {
  const result = await query<{ id: number; user_id: number; name: string; email: string; phone: string | null; avatar_url: string | null }>(
    `SELECT c.id,u.id AS user_id,u.name,u.email,u.phone,u.avatar_url
     FROM dbo.CRMCustomers c JOIN dbo.Users u ON u.id=c.user_id
     WHERE c.user_id=@memberId AND c.assigned_coach_id=@coachId AND u.role=N'member' AND u.is_active=1`,
    { coachId, memberId },
  );
  if (!result.recordset[0]) throw new AppError(404, 'Member not found');
  return result.recordset[0];
}

export async function assertProgramOwner(coachId: number, programId: number) {
  const result = await query(`SELECT id FROM dbo.WorkoutPrograms WHERE id=@programId AND owner_coach_id=@coachId`, { coachId, programId });
  if (!result.recordset[0]) throw new AppError(404, 'Program not found');
}

async function assertDayOwner(coachId: number, dayId: number) {
  const result = await query<{ id: number; program_id: number }>(
    `SELECT d.id,d.program_id FROM dbo.WorkoutProgramDays d
     JOIN dbo.WorkoutPrograms p ON p.id=d.program_id AND p.owner_coach_id=@coachId WHERE d.id=@dayId`,
    { coachId, dayId },
  );
  if (!result.recordset[0]) throw new AppError(404, 'Program day not found');
  return result.recordset[0];
}

async function assertProgramExerciseOwner(coachId: number, programExerciseId: number) {
  const result = await query<{ id: number; program_day_id: number }>(
    `SELECT pe.id,pe.program_day_id FROM dbo.WorkoutProgramExercises pe
     JOIN dbo.WorkoutProgramDays d ON d.id=pe.program_day_id
     JOIN dbo.WorkoutPrograms p ON p.id=d.program_id AND p.owner_coach_id=@coachId
     WHERE pe.id=@programExerciseId`,
    { coachId, programExerciseId },
  );
  if (!result.recordset[0]) throw new AppError(404, 'Program exercise not found');
  return result.recordset[0];
}

export async function assertAssignment(coachId: number, assignmentId: number) {
  const result = await query<{ id: number; member_id: number; program_id: number; schedule_timezone: string; status: string }>(
    `SELECT a.id,a.member_id,a.program_id,a.schedule_timezone,a.status
     FROM dbo.CoachProgramAssignments a
     JOIN dbo.CRMCustomers c ON c.user_id=a.member_id AND c.assigned_coach_id=@coachId
     JOIN dbo.Users u ON u.id=a.member_id AND u.role=N'member' AND u.is_active=1
     WHERE a.id=@assignmentId AND a.coach_id=@coachId`,
    { coachId, assignmentId },
  );
  if (!result.recordset[0]) throw new AppError(404, 'Assignment not found');
  return result.recordset[0];
}

async function assertSchedule(coachId: number, scheduleId: number) {
  const result = await query<{ id: number; assignment_id: number; scheduled_date: string; status: string }>(
    `SELECT s.id,s.assignment_id,s.scheduled_date,s.status
     FROM dbo.CoachProgramSchedules s
     JOIN dbo.CoachProgramAssignments a ON a.id=s.assignment_id AND a.coach_id=@coachId
     JOIN dbo.CRMCustomers c ON c.user_id=a.member_id AND c.assigned_coach_id=@coachId
     JOIN dbo.Users u ON u.id=a.member_id AND u.role=N'member' AND u.is_active=1
     WHERE s.id=@scheduleId`,
    { coachId, scheduleId },
  );
  if (!result.recordset[0]) throw new AppError(404, 'Schedule not found');
  return result.recordset[0];
}

export async function dashboard(coachId: number) {
  const [members, activeMembers, programs, assignments, schedules, sessions] = await Promise.all([
    query(`SELECT COUNT(*) AS count FROM dbo.CRMCustomers c JOIN dbo.Users u ON u.id=c.user_id WHERE c.assigned_coach_id=@coachId AND u.role=N'member' AND u.is_active=1`, { coachId }),
    query(`SELECT COUNT(*) AS count FROM dbo.CRMCustomers c JOIN dbo.Users u ON u.id=c.user_id WHERE c.assigned_coach_id=@coachId AND u.role=N'member' AND u.is_active=1`, { coachId }),
    query(`SELECT COUNT(*) AS count FROM dbo.WorkoutPrograms WHERE owner_coach_id=@coachId AND is_active=1`, { coachId }),
    query(`SELECT COUNT(*) AS count FROM dbo.CoachProgramAssignments a JOIN dbo.CRMCustomers c ON c.user_id=a.member_id AND c.assigned_coach_id=@coachId JOIN dbo.Users u ON u.id=a.member_id AND u.is_active=1 WHERE a.coach_id=@coachId AND a.status=N'ACTIVE'`, { coachId }),
    query(`SELECT TOP 5 s.id,s.scheduled_date,s.status,p.name AS program_name,u.id AS member_id,u.name AS member_name,d.title AS day_title
            FROM dbo.CoachProgramSchedules s JOIN dbo.CoachProgramAssignments a ON a.id=s.assignment_id AND a.coach_id=@coachId
            JOIN dbo.CRMCustomers c ON c.user_id=a.member_id AND c.assigned_coach_id=@coachId
            JOIN dbo.Users u ON u.id=a.member_id AND u.is_active=1 JOIN dbo.WorkoutPrograms p ON p.id=a.program_id
            JOIN dbo.WorkoutProgramDays d ON d.id=s.program_day_id
            WHERE s.scheduled_date>=CAST(GETDATE() AS date) AND s.status=N'SCHEDULED'
            ORDER BY s.scheduled_date,s.id`, { coachId }),
    query(`SELECT TOP 5 ws.id,ws.user_id AS member_id,u.name AS member_name,ws.started_at,ws.completed_at,ws.status,w.name AS workout_name
            FROM dbo.WorkoutSessions ws JOIN dbo.Workouts w ON w.id=ws.workout_id AND w.coach_id=@coachId
            JOIN dbo.CRMCustomers c ON c.user_id=ws.user_id AND c.assigned_coach_id=@coachId
            JOIN dbo.Users u ON u.id=ws.user_id AND u.is_active=1
            ORDER BY ws.started_at DESC,ws.id DESC`, { coachId }),
  ]);
  return {
    counts: { assignedMembers: Number(members.recordset[0].count), activeMembers: Number(activeMembers.recordset[0].count), ownedPrograms: Number(programs.recordset[0].count), activeAssignments: Number(assignments.recordset[0].count) },
    upcomingSchedules: schedules.recordset,
    recentSessions: sessions.recordset,
    attentionQueue: [],
    attentionQueueAvailable: false,
  };
}

export async function listExercises(input: { q?: string; muscleGroup?: string; difficulty?: string; equipment?: string; page: number; limit: number; sort: string }) {
  const conditions = ['e.is_active=1'];
  const params: Record<string, unknown> = { offset: (input.page - 1) * input.limit, limit: input.limit };
  if (input.q) { conditions.push('(e.name LIKE @q OR e.description LIKE @q OR e.instructions LIKE @q)'); params.q = `%${input.q}%`; }
  if (input.muscleGroup) { conditions.push('e.muscle_group=@muscleGroup'); params.muscleGroup = input.muscleGroup; }
  if (input.difficulty) { conditions.push('e.difficulty=@difficulty'); params.difficulty = input.difficulty; }
  if (input.equipment) { conditions.push('e.equipment=@equipment'); params.equipment = input.equipment; }
  const sort: Record<string, string> = { name_asc: 'e.name ASC,e.id ASC', name_desc: 'e.name DESC,e.id DESC', newest: 'e.created_at DESC,e.id DESC' };
  const where = conditions.join(' AND ');
  const [rows, count] = await Promise.all([
    query(`SELECT e.id,e.name,e.slug,e.description,e.instructions,e.muscle_group,e.equipment,e.difficulty,e.thumbnail_url,e.is_active,e.created_at,e.updated_at FROM dbo.Exercises e WHERE ${where} ORDER BY ${sort[input.sort] ?? sort.name_asc} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params),
    query(`SELECT COUNT(*) AS total FROM dbo.Exercises e WHERE ${where}`, params),
  ]);
  return { items: rows.recordset, page: input.page, limit: input.limit, total: Number(count.recordset[0].total), totalPages: Math.ceil(Number(count.recordset[0].total) / input.limit) };
}

export async function getExercise(exerciseId: number) {
  const result = await query(`SELECT e.id,e.name,e.slug,e.description,e.instructions,e.muscle_group,e.equipment,e.difficulty,e.thumbnail_url,e.is_active,e.created_at,e.updated_at FROM dbo.Exercises e WHERE e.id=@exerciseId AND e.is_active=1`, { exerciseId });
  if (!result.recordset[0]) throw new AppError(404, 'Exercise not found');
  return result.recordset[0];
}

export async function listPrograms(coachId: number, page: number, limit: number, q?: string) {
  const params: Record<string, unknown> = { coachId, offset: (page - 1) * limit, limit };
  const search = q ? ' AND (p.name LIKE @q OR p.description LIKE @q OR p.goal LIKE @q)' : '';
  if (q) params.q = `%${q}%`;
  const [rows, count] = await Promise.all([
    query(`SELECT p.id,p.name,p.description,p.goal,p.difficulty,p.duration_weeks,p.days_per_week,p.owner_coach_id,p.is_active,p.created_at,p.updated_at,
                  (SELECT COUNT(*) FROM dbo.WorkoutProgramDays d WHERE d.program_id=p.id) AS day_count,
                  (SELECT COUNT(*) FROM dbo.WorkoutProgramExercises pe JOIN dbo.WorkoutProgramDays d ON d.id=pe.program_day_id WHERE d.program_id=p.id) AS exercise_count
           FROM dbo.WorkoutPrograms p WHERE p.owner_coach_id=@coachId${search} ORDER BY p.updated_at DESC,p.id DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params),
    query(`SELECT COUNT(*) AS total FROM dbo.WorkoutPrograms p WHERE p.owner_coach_id=@coachId${search}`, params),
  ]);
  return { items: rows.recordset, page, limit, total: Number(count.recordset[0].total), totalPages: Math.ceil(Number(count.recordset[0].total) / limit) };
}

export async function getProgram(coachId: number, programId: number) {
  await assertProgramOwner(coachId, programId);
  const [program, days, exercises] = await Promise.all([
    query(`SELECT p.id,p.name,p.description,p.goal,p.difficulty,p.duration_weeks,p.days_per_week,p.owner_coach_id,p.is_active,p.created_at,p.updated_at FROM dbo.WorkoutPrograms p WHERE p.id=@programId`, { programId }),
    query(`SELECT d.id,d.program_id,d.week_number,d.day_number,d.title,d.description,d.sort_order,d.created_at,d.updated_at FROM dbo.WorkoutProgramDays d WHERE d.program_id=@programId ORDER BY d.sort_order,d.id`, { programId }),
    query(`SELECT pe.id,pe.program_day_id,pe.exercise_id,pe.sort_order,pe.target_sets,pe.target_reps_min,pe.target_reps_max,pe.target_weight,pe.target_duration_seconds,pe.rest_seconds,pe.tempo,pe.coach_note,e.name AS exercise_name,e.slug AS exercise_slug,e.muscle_group,e.equipment,e.difficulty,e.thumbnail_url FROM dbo.WorkoutProgramExercises pe JOIN dbo.WorkoutProgramDays d ON d.id=pe.program_day_id JOIN dbo.Exercises e ON e.id=pe.exercise_id WHERE d.program_id=@programId ORDER BY pe.program_day_id,pe.sort_order,pe.id`, { programId }),
  ]);
  const byDay = new Map<number, unknown[]>();
  for (const row of exercises.recordset) { const list = byDay.get(Number(row.program_day_id)) ?? []; list.push(row); byDay.set(Number(row.program_day_id), list); }
  return { ...program.recordset[0], days: days.recordset.map(day => ({ ...day, exercises: byDay.get(Number(day.id)) ?? [] })) };
}

export async function createProgram(coachId: number, data: Record<string, unknown>) {
  const result = await query(`INSERT dbo.WorkoutPrograms(name,description,goal,difficulty,duration_weeks,days_per_week,owner_coach_id,created_by) OUTPUT INSERTED.* VALUES(@name,@description,@goal,@difficulty,@durationWeeks,@daysPerWeek,@coachId,@coachId)`, { name: data.name, description: data.description ?? null, goal: data.goal, difficulty: data.difficulty, durationWeeks: data.durationWeeks, daysPerWeek: data.daysPerWeek, coachId });
  return result.recordset[0];
}

export async function updateProgram(coachId: number, programId: number, data: Record<string, unknown>) {
  await assertProgramOwner(coachId, programId);
  const result = await query(`UPDATE dbo.WorkoutPrograms SET name=@name,description=@description,goal=@goal,difficulty=@difficulty,duration_weeks=@durationWeeks,days_per_week=@daysPerWeek,updated_at=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE id=@programId AND owner_coach_id=@coachId`, { ...data, description: data.description ?? null, programId, coachId });
  return result.recordset[0];
}

export async function setProgramActive(coachId: number, programId: number, active: boolean) {
  await assertProgramOwner(coachId, programId);
  const result = await query(`UPDATE dbo.WorkoutPrograms SET is_active=@active,updated_at=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE id=@programId AND owner_coach_id=@coachId`, { active: active ? 1 : 0, programId, coachId });
  return result.recordset[0];
}

export async function createDay(coachId: number, programId: number, data: Record<string, unknown>) {
  await assertProgramOwner(coachId, programId);
  const result = await query(`INSERT dbo.WorkoutProgramDays(program_id,week_number,day_number,title,description,sort_order) OUTPUT INSERTED.* SELECT @programId,@weekNumber,@dayNumber,@title,@description,COALESCE(MAX(sort_order),-1)+1 FROM dbo.WorkoutProgramDays WHERE program_id=@programId`, { programId, weekNumber: data.weekNumber, dayNumber: data.dayNumber, title: data.title, description: data.description ?? null });
  return result.recordset[0];
}

export async function updateDay(coachId: number, dayId: number, data: Record<string, unknown>) {
  await assertDayOwner(coachId, dayId);
  const result = await query(`UPDATE dbo.WorkoutProgramDays SET week_number=@weekNumber,day_number=@dayNumber,title=@title,description=@description,updated_at=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE id=@dayId`, { ...data, description: data.description ?? null, dayId });
  return result.recordset[0];
}

export async function deleteDay(coachId: number, dayId: number) {
  await assertDayOwner(coachId, dayId);
  try { await query('DELETE FROM dbo.WorkoutProgramDays WHERE id=@dayId', { dayId }); }
  catch (error) { if ((error as { number?: number }).number === 547) throw new AppError(409, 'Program day is referenced by a schedule'); throw error; }
}

async function reorder(tx: sql.Transaction, table: string, parentColumn: string, parentId: number, ids: number[], ownerCoachId: number, joinTable: string, joinColumn: string) {
  const valid = await new sql.Request(tx).input('parentId', sql.Int, parentId).input('ownerCoachId', sql.Int, ownerCoachId).query(`SELECT child.id FROM dbo.${table} child JOIN dbo.${joinTable} parent ON parent.id=child.${joinColumn} AND parent.owner_coach_id=@ownerCoachId WHERE child.${parentColumn}=@parentId`);
  const allowed = valid.recordset.map((row: { id: number }) => Number(row.id));
  if (ids.length !== allowed.length || ids.some(id => !allowed.includes(id))) throw new AppError(400, 'Order must contain exactly the current items');
  const unique = new Set(ids); if (unique.size !== ids.length) throw new AppError(400, 'Order contains duplicate IDs');
  await new sql.Request(tx).input('parentId', sql.Int, parentId).query(`UPDATE dbo.${table} SET sort_order=sort_order+10000 WHERE ${parentColumn}=@parentId`);
  for (let index = 0; index < ids.length; index += 1) await new sql.Request(tx).input('id', sql.Int, ids[index]).input('sortOrder', sql.Int, index).query(`UPDATE dbo.${table} SET sort_order=@sortOrder,updated_at=SYSUTCDATETIME() WHERE id=@id`);
}

export async function reorderDays(coachId: number, programId: number, ids: number[]) {
  await assertProgramOwner(coachId, programId); const tx = (await getPool()).transaction(); await tx.begin();
  try { await reorder(tx, 'WorkoutProgramDays', 'program_id', programId, ids, coachId, 'WorkoutPrograms', 'program_id'); await tx.commit(); }
  catch (error) { try { await tx.rollback(); } catch {} throw error; }
}

export async function createProgramExercise(coachId: number, dayId: number, data: Record<string, unknown>) {
  await assertDayOwner(coachId, dayId); await getExercise(Number(data.exerciseId));
  const active = await query('SELECT id FROM dbo.Exercises WHERE id=@exerciseId AND is_active=1', { exerciseId: data.exerciseId }); if (!active.recordset[0]) throw new AppError(400, 'Exercise must be active');
  const result = await query(`INSERT dbo.WorkoutProgramExercises(program_day_id,exercise_id,sort_order,target_sets,target_reps_min,target_reps_max,target_weight,target_duration_seconds,rest_seconds,tempo,coach_note) OUTPUT INSERTED.* SELECT @dayId,@exerciseId,COALESCE(MAX(sort_order),-1)+1,@targetSets,@targetRepsMin,@targetRepsMax,@targetWeight,@targetDurationSeconds,@restSeconds,@tempo,@coachNote FROM dbo.WorkoutProgramExercises WHERE program_day_id=@dayId`, { dayId, exerciseId: data.exerciseId, targetSets: data.targetSets ?? null, targetRepsMin: data.targetRepsMin ?? null, targetRepsMax: data.targetRepsMax ?? null, targetWeight: data.targetWeight ?? null, targetDurationSeconds: data.targetDurationSeconds ?? null, restSeconds: data.restSeconds ?? null, tempo: data.tempo ?? null, coachNote: data.coachNote ?? null });
  return result.recordset[0];
}

export async function updateProgramExercise(coachId: number, id: number, data: Record<string, unknown>) {
  await assertProgramExerciseOwner(coachId, id); const result = await query(`UPDATE dbo.WorkoutProgramExercises SET target_sets=@targetSets,target_reps_min=@targetRepsMin,target_reps_max=@targetRepsMax,target_weight=@targetWeight,target_duration_seconds=@targetDurationSeconds,rest_seconds=@restSeconds,tempo=@tempo,coach_note=@coachNote,updated_at=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE id=@id`, { ...data, id }); return result.recordset[0];
}

export async function deleteProgramExercise(coachId: number, id: number) { await assertProgramExerciseOwner(coachId, id); await query('DELETE FROM dbo.WorkoutProgramExercises WHERE id=@id', { id }); }

export async function reorderProgramExercises(coachId: number, dayId: number, ids: number[]) {
  await assertDayOwner(coachId, dayId); const tx = (await getPool()).transaction(); await tx.begin();
  try {
    const valid = await new sql.Request(tx).input('dayId', sql.Int, dayId).input('coachId', sql.Int, coachId).query(`SELECT pe.id FROM dbo.WorkoutProgramExercises pe JOIN dbo.WorkoutProgramDays d ON d.id=pe.program_day_id JOIN dbo.WorkoutPrograms p ON p.id=d.program_id AND p.owner_coach_id=@coachId WHERE pe.program_day_id=@dayId`);
    const allowed = valid.recordset.map((row: { id: number }) => Number(row.id)); const unique = new Set(ids); if (ids.length !== allowed.length || unique.size !== ids.length || ids.some(item => !allowed.includes(item))) throw new AppError(400, 'Order must contain exactly the current items');
    await new sql.Request(tx).input('dayId', sql.Int, dayId).query('UPDATE dbo.WorkoutProgramExercises SET sort_order=sort_order+10000 WHERE program_day_id=@dayId');
    for (let index = 0; index < ids.length; index += 1) await new sql.Request(tx).input('id', sql.Int, ids[index]).input('sortOrder', sql.Int, index).query('UPDATE dbo.WorkoutProgramExercises SET sort_order=@sortOrder,updated_at=SYSUTCDATETIME() WHERE id=@id');
    await tx.commit();
  }
  catch (error) { try { await tx.rollback(); } catch {} throw error; }
}

export async function listMembers(coachId: number, page: number, limit: number, q?: string) {
  const params: Record<string, unknown> = { coachId, offset: (page - 1) * limit, limit }; const search = q ? ' AND (u.name LIKE @q OR u.email LIKE @q)' : ''; if (q) params.q = `%${q}%`;
  const [rows, count] = await Promise.all([
    query(`SELECT c.user_id AS id,u.name,u.email,u.phone,u.avatar_url,c.last_contact_at,c.created_at AS assigned_at FROM dbo.CRMCustomers c JOIN dbo.Users u ON u.id=c.user_id WHERE c.assigned_coach_id=@coachId AND u.role=N'member' AND u.is_active=1${search} ORDER BY u.name,u.id OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params),
    query(`SELECT COUNT(*) AS total FROM dbo.CRMCustomers c JOIN dbo.Users u ON u.id=c.user_id WHERE c.assigned_coach_id=@coachId AND u.role=N'member' AND u.is_active=1${search}`, params),
  ]);
  return { items: rows.recordset, page, limit, total: Number(count.recordset[0].total), totalPages: Math.ceil(Number(count.recordset[0].total) / limit) };
}

export async function getMember(coachId: number, memberId: number) {
  const member = await assertMemberScope(coachId, memberId);
  const [assignment, sessionCount] = await Promise.all([
    query(`SELECT TOP 1 a.id,a.program_id,a.coach_id,a.start_date,a.end_date,a.status,a.schedule_timezone,a.note,p.name AS program_name FROM dbo.CoachProgramAssignments a JOIN dbo.WorkoutPrograms p ON p.id=a.program_id WHERE a.member_id=@memberId AND a.coach_id=@coachId ORDER BY CASE WHEN a.status=N'ACTIVE' THEN 0 ELSE 1 END,a.updated_at DESC`, { memberId, coachId }),
    query(`SELECT COUNT(*) AS count FROM dbo.WorkoutSessions ws JOIN dbo.Workouts w ON w.id=ws.workout_id AND w.coach_id=@coachId WHERE ws.user_id=@memberId`, { memberId, coachId }),
  ]);
  return { ...member, currentAssignment: assignment.recordset[0] ?? null, sessionCount: Number(sessionCount.recordset[0].count), sessionDataAvailable: true };
}

export async function listAssignments(coachId: number, page: number, limit: number, memberId?: number) {
  const params: Record<string, unknown> = { coachId, offset: (page - 1) * limit, limit }; const member = memberId ? ' AND a.member_id=@memberId' : ''; if (memberId) { await assertMemberScope(coachId, memberId); params.memberId = memberId; }
  const scope = `a.coach_id=@coachId AND c.assigned_coach_id=@coachId AND u.role=N'member' AND u.is_active=1`;
  const [rows, count] = await Promise.all([
    query(`SELECT a.id,a.member_id,a.program_id,a.coach_id,a.assigned_by,a.start_date,a.end_date,a.status,a.schedule_timezone,a.note,a.created_at,a.updated_at,p.name AS program_name,u.name AS member_name FROM dbo.CoachProgramAssignments a JOIN dbo.CRMCustomers c ON c.user_id=a.member_id JOIN dbo.Users u ON u.id=a.member_id JOIN dbo.WorkoutPrograms p ON p.id=a.program_id WHERE ${scope}${member} ORDER BY a.updated_at DESC,a.id DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params),
    query(`SELECT COUNT(*) AS total FROM dbo.CoachProgramAssignments a JOIN dbo.CRMCustomers c ON c.user_id=a.member_id JOIN dbo.Users u ON u.id=a.member_id WHERE ${scope}${member}`, params),
  ]);
  return { items: rows.recordset, page, limit, total: Number(count.recordset[0].total), totalPages: Math.ceil(Number(count.recordset[0].total) / limit) };
}

export async function createAssignment(coachId: number, data: Record<string, unknown>) {
  await assertMemberScope(coachId, Number(data.memberId)); await assertProgramOwner(coachId, Number(data.programId));
  const startDate = dateOnly(data.startDate); const endDate = data.endDate ? dateOnly(data.endDate) : null; if (endDate && endDate < startDate) throw new AppError(400, 'endDate must be on or after startDate');
  assertTimeZone(String(data.scheduleTimezone));
  const tx = (await getPool()).transaction(); await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const active = await new sql.Request(tx).input('memberId', sql.Int, Number(data.memberId)).query(`SELECT id FROM dbo.CoachProgramAssignments WITH (UPDLOCK,HOLDLOCK) WHERE member_id=@memberId AND status=N'ACTIVE'`);
    if (active.recordset[0]) throw new AppError(409, 'Member already has an active assignment');
    const program = await new sql.Request(tx).input('programId', sql.Int, Number(data.programId)).input('coachId', sql.Int, coachId).query(`SELECT id FROM dbo.WorkoutPrograms WHERE id=@programId AND owner_coach_id=@coachId AND is_active=1`);
    if (!program.recordset[0]) throw new AppError(400, 'Program must be active and owned by the current Coach');
    const result = await new sql.Request(tx).input('memberId', sql.Int, Number(data.memberId)).input('programId', sql.Int, Number(data.programId)).input('coachId', sql.Int, coachId).input('startDate', sql.Date, startDate).input('endDate', sql.Date, endDate).input('status', sql.NVarChar(20), 'ACTIVE').input('timezone', sql.NVarChar(64), String(data.scheduleTimezone)).input('note', sql.NVarChar(2000), data.note ?? null).query(`INSERT dbo.CoachProgramAssignments(member_id,program_id,coach_id,assigned_by,start_date,end_date,status,schedule_timezone,note) OUTPUT INSERTED.* VALUES(@memberId,@programId,@coachId,@coachId,@startDate,@endDate,@status,@timezone,@note)`);
    await tx.commit(); return result.recordset[0];
  } catch (error) { try { await tx.rollback(); } catch {} throw error; }
}

const transitions: Record<string, string[]> = { PAUSED: ['ACTIVE'], ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'] };
export async function transitionAssignment(coachId: number, assignmentId: number, nextStatus: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED') {
  const assignment = await assertAssignment(coachId, assignmentId); if (!transitions[assignment.status]?.includes(nextStatus)) throw new AppError(409, `Cannot transition ${assignment.status} to ${nextStatus}`);
  const result = await query(`UPDATE dbo.CoachProgramAssignments SET status=@status,updated_at=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE id=@assignmentId AND coach_id=@coachId`, { status: nextStatus, assignmentId, coachId }); return result.recordset[0];
}

export async function listSchedules(coachId: number, page: number, limit: number, memberId?: number, fromDate?: string, toDate?: string) {
  const params: Record<string, unknown> = { coachId, offset: (page - 1) * limit, limit }; let extra = ''; if (memberId) { await assertMemberScope(coachId, memberId); extra += ' AND a.member_id=@memberId'; params.memberId = memberId; } if (fromDate) { params.fromDate = dateOnly(fromDate); extra += ' AND s.scheduled_date>=@fromDate'; } if (toDate) { params.toDate = dateOnly(toDate); extra += ' AND s.scheduled_date<=@toDate'; }
  const scope = `a.coach_id=@coachId AND c.assigned_coach_id=@coachId AND u.role=N'member' AND u.is_active=1`;
  const [rows, count] = await Promise.all([
    query(`SELECT s.id,s.assignment_id,s.program_day_id,s.scheduled_date,s.status,s.created_at,s.updated_at,a.member_id,a.program_id,a.status AS assignment_status,a.schedule_timezone,p.name AS program_name,u.name AS member_name,d.week_number,d.day_number,d.title AS day_title FROM dbo.CoachProgramSchedules s JOIN dbo.CoachProgramAssignments a ON a.id=s.assignment_id JOIN dbo.CRMCustomers c ON c.user_id=a.member_id JOIN dbo.Users u ON u.id=a.member_id JOIN dbo.WorkoutPrograms p ON p.id=a.program_id JOIN dbo.WorkoutProgramDays d ON d.id=s.program_day_id WHERE ${scope}${extra} ORDER BY s.scheduled_date,s.id OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params),
    query(`SELECT COUNT(*) AS total FROM dbo.CoachProgramSchedules s JOIN dbo.CoachProgramAssignments a ON a.id=s.assignment_id JOIN dbo.CRMCustomers c ON c.user_id=a.member_id JOIN dbo.Users u ON u.id=a.member_id WHERE ${scope}${extra}`, params),
  ]); return { items: rows.recordset, page, limit, total: Number(count.recordset[0].total), totalPages: Math.ceil(Number(count.recordset[0].total) / limit) };
}

export async function generateSchedules(coachId: number, assignmentId: number, input: { fromDate?: string; horizonDays: number }) {
  const assignment = await assertAssignment(coachId, assignmentId); if (assignment.status !== 'ACTIVE') throw new AppError(409, 'Only active assignments can generate schedules'); assertTimeZone(assignment.schedule_timezone);
  const from = input.fromDate ? dateOnly(input.fromDate) : todayInTimeZone(assignment.schedule_timezone); const days = await query(`SELECT id,week_number,day_number FROM dbo.WorkoutProgramDays WHERE program_id=@programId ORDER BY week_number,day_number,sort_order`, { programId: assignment.program_id });
  const tx = (await getPool()).transaction(); await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE); let inserted = 0;
  try {
    for (let offset = 0; offset < input.horizonDays; offset += 1) {
      const scheduledDate = addDays(from, offset); const week = Math.floor(offset / 7) + 1; const dayNumber = mondayDay(scheduledDate); const day = days.recordset.find(row => Number(row.week_number) === week && Number(row.day_number) === dayNumber); if (!day) continue;
      const result = await new sql.Request(tx).input('assignmentId', sql.Int, assignmentId).input('dayId', sql.Int, Number(day.id)).input('scheduledDate', sql.Date, scheduledDate).query(`IF NOT EXISTS (SELECT 1 FROM dbo.CoachProgramSchedules WITH (UPDLOCK,HOLDLOCK) WHERE assignment_id=@assignmentId AND program_day_id=@dayId AND scheduled_date=@scheduledDate) BEGIN INSERT dbo.CoachProgramSchedules(assignment_id,program_day_id,scheduled_date) VALUES(@assignmentId,@dayId,@scheduledDate); SELECT 1 AS inserted; END ELSE SELECT 0 AS inserted`); inserted += Number(result.recordset[0].inserted);
    }
    await tx.commit(); return { inserted, fromDate: from, horizonDays: input.horizonDays };
  } catch (error) { try { await tx.rollback(); } catch {} throw error; }
}

export async function reschedule(coachId: number, scheduleId: number, scheduledDate: string) {
  const schedule = await assertSchedule(coachId, scheduleId); const date = dateOnly(scheduledDate); const today = todayInTimeZone('UTC'); if (schedule.status !== 'SCHEDULED' || date < today) throw new AppError(409, 'Only future scheduled items can be rescheduled');
  const result = await query(`UPDATE dbo.CoachProgramSchedules SET scheduled_date=@scheduledDate,updated_at=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE id=@scheduleId AND status=N'SCHEDULED'`, { scheduledDate: date, scheduleId }); return result.recordset[0];
}

export async function cancelSchedule(coachId: number, scheduleId: number) {
  const schedule = await assertSchedule(coachId, scheduleId); if (schedule.status !== 'SCHEDULED' || schedule.scheduled_date < todayInTimeZone('UTC')) throw new AppError(409, 'Only future scheduled items can be cancelled');
  const result = await query(`UPDATE dbo.CoachProgramSchedules SET status=N'CANCELLED',updated_at=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE id=@scheduleId AND status=N'SCHEDULED'`, { scheduleId }); return result.recordset[0];
}

export async function listSessions(coachId: number, memberId: number, page: number, limit: number) {
  await assertMemberScope(coachId, memberId); const params = { coachId, memberId, offset: (page - 1) * limit, limit };
  const [rows, count] = await Promise.all([
    query(`SELECT ws.id,ws.user_id AS member_id,ws.workout_id,ws.started_at,ws.completed_at,ws.status,ws.notes,w.name AS workout_name,w.description AS workout_description FROM dbo.WorkoutSessions ws JOIN dbo.Workouts w ON w.id=ws.workout_id AND w.coach_id=@coachId WHERE ws.user_id=@memberId ORDER BY ws.started_at DESC,ws.id DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params),
    query(`SELECT COUNT(*) AS total FROM dbo.WorkoutSessions ws JOIN dbo.Workouts w ON w.id=ws.workout_id AND w.coach_id=@coachId WHERE ws.user_id=@memberId`, params),
  ]); return { items: rows.recordset.map(row => ({ ...row, setSummary: null, blockedReason: 'BLOCKED_BY_MEMBER_WORKOUT_FLOW' })), page, limit, total: Number(count.recordset[0].total), totalPages: Math.ceil(Number(count.recordset[0].total) / limit) };
}

export async function getSession(coachId: number, memberId: number, sessionId: number) {
  await assertMemberScope(coachId, memberId); const result = await query(`SELECT ws.id,ws.user_id AS member_id,ws.workout_id,ws.started_at,ws.completed_at,ws.status,ws.notes,w.name AS workout_name,w.description AS workout_description FROM dbo.WorkoutSessions ws JOIN dbo.Workouts w ON w.id=ws.workout_id AND w.coach_id=@coachId WHERE ws.id=@sessionId AND ws.user_id=@memberId`, { coachId, memberId, sessionId }); if (!result.recordset[0]) throw new AppError(404, 'Session not found');
  const exercises = await query(`SELECT id,workout_id,name,sets,reps,weight,duration_seconds,rest_seconds,sort_order FROM dbo.WorkoutExercises WHERE workout_id=@workoutId ORDER BY sort_order,id`, { workoutId: result.recordset[0].workout_id });
  return { ...result.recordset[0], exerciseSnapshot: exercises.recordset, setSummary: null, blockedReason: 'BLOCKED_BY_MEMBER_WORKOUT_FLOW' };
}

export async function getProgress(coachId: number, memberId: number) {
  await assertMemberScope(coachId, memberId); const [summary, recent, due] = await Promise.all([
    query(`SELECT COUNT(*) AS completed_sessions,COALESCE(SUM(CASE WHEN ws.status=N'completed' AND ws.completed_at IS NOT NULL THEN DATEDIFF(SECOND,ws.started_at,ws.completed_at) ELSE 0 END),0) AS total_duration FROM dbo.WorkoutSessions ws JOIN dbo.Workouts w ON w.id=ws.workout_id AND w.coach_id=@coachId WHERE ws.user_id=@memberId`, { coachId, memberId }),
    query(`SELECT TOP 10 ws.id,ws.started_at,ws.completed_at,ws.status,w.name AS workout_name FROM dbo.WorkoutSessions ws JOIN dbo.Workouts w ON w.id=ws.workout_id AND w.coach_id=@coachId WHERE ws.user_id=@memberId ORDER BY ws.started_at DESC,ws.id DESC`, { coachId, memberId }),
    query(`SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN s.status=N'COMPLETED' THEN 1 ELSE 0 END),0) AS completed FROM dbo.CoachProgramSchedules s JOIN dbo.CoachProgramAssignments a ON a.id=s.assignment_id AND a.member_id=@memberId AND a.coach_id=@coachId WHERE s.scheduled_date<CAST(GETDATE() AS date)`, { coachId, memberId }),
  ]);
  const dueTotal = Number(due.recordset[0].total); const completedDue = Number(due.recordset[0].completed);
  return { completed_sessions: Number(summary.recordset[0].completed_sessions), total_duration: Number(summary.recordset[0].total_duration), training_volume: null, completion_rate: dueTotal ? (completedDue / dueTotal) * 100 : null, recent_sessions: recent.recordset, exercise_history: [], blockedReason: 'BLOCKED_BY_MEMBER_WORKOUT_FLOW', dataSources: { legacySessions: true, setLogs: false, memberProgressFlow: false } };
}
